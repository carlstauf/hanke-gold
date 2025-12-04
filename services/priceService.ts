
export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  source: string;
  timestamp: number;
}

interface CacheEntry {
  data: PriceData;
  expiry: number;
}

const CACHE_TTL_MS = 30_000; // 30 second cache (faster updates)
let cache: CacheEntry | null = null;

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Source 1: CoinCap.io - PAXG (Gold Token)
 * Status: EXCELLENT (CORS enabled, Fast, No Key)
 */
async function fetchFromCoinCap(): Promise<PriceData | null> {
  const res = await fetchWithTimeout("https://api.coincap.io/v2/assets/pax-gold");
  if (!res.ok) return null;

  const json = await res.json();
  const data = json.data;
  if (!data) return null;

  const price = parseFloat(data.priceUsd);
  const changePercent = parseFloat(data.changePercent24Hr);

  if (isNaN(price)) return null;

  // Calculate change in dollars
  const prevPrice = price / (1 + (changePercent / 100));
  const change = price - prevPrice;

  return {
    price,
    change,
    changePercent,
    source: "CoinCap (PAXG)",
    timestamp: Date.now(),
  };
}

/**
 * Source 2: CryptoCompare - PAXG
 * Status: GOOD (CORS enabled)
 */
async function fetchFromCryptoCompare(): Promise<PriceData | null> {
  const res = await fetchWithTimeout(
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=PAXG&tsyms=USD"
  );
  if (!res.ok) return null;

  const json = await res.json();
  const data = json?.RAW?.PAXG?.USD;
  if (!data) return null;

  return {
    price: data.PRICE,
    change: data.CHANGE24HOUR,
    changePercent: data.CHANGEPCT24HOUR,
    source: "CryptoCompare",
    timestamp: Date.now(),
  };
}

/**
 * Source 3: CoinGecko - PAX Gold
 * Status: OK (Rate limits are strict)
 */
async function fetchFromCoinGecko(): Promise<PriceData | null> {
  const res = await fetchWithTimeout(
    "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true"
  );
  if (!res.ok) return null;

  const json = await res.json();
  const data = json?.["pax-gold"];
  if (!data?.usd) return null;

  return {
    price: data.usd,
    change: data.usd * (data.usd_24h_change / 100),
    changePercent: data.usd_24h_change,
    source: "CoinGecko",
    timestamp: Date.now(),
  };
}

/**
 * Source 4: Yahoo Finance (GC=F) via Proxy
 * Status: FALLBACK (Uses allorigins to bypass CORS)
 */
async function fetchYahooViaProxy(): Promise<PriceData | null> {
  // Use allorigins to proxy the request
  const targetUrl = encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=2d");
  const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${targetUrl}`);
  
  if (!res.ok) return null;
  
  const json = await res.json();
  const yahooData = JSON.parse(json.contents);
  const meta = yahooData?.chart?.result?.[0]?.meta;

  if (!meta?.regularMarketPrice) return null;

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose;
  const change = price - prevClose;
  const changePercent = (change / prevClose) * 100;

  return {
    price,
    change,
    changePercent,
    source: "Yahoo Futures (Proxy)",
    timestamp: Date.now(),
  };
}

/**
 * Main Fetcher
 */
export async function getLiveGoldPrice(bypassCache = false): Promise<PriceData | null> {
  // 1. Check Cache
  if (!bypassCache && cache && Date.now() < cache.expiry) {
    return cache.data;
  }

  // 2. Try Sources Sequentially
  const sources = [
    { name: "CoinCap", fn: fetchFromCoinCap },
    { name: "CryptoCompare", fn: fetchFromCryptoCompare },
    { name: "CoinGecko", fn: fetchFromCoinGecko },
    { name: "YahooProxy", fn: fetchYahooViaProxy }
  ];

  for (const source of sources) {
    try {
      const result = await source.fn();
      if (result && result.price > 1000) { // Sanity check
        cache = {
          data: result,
          expiry: Date.now() + CACHE_TTL_MS,
        };
        return result;
      }
    } catch (error) {
      console.warn(`[PriceService] ${source.name} failed`);
    }
  }

  console.error("[PriceService] All sources failed");
  return null;
}

export async function getAllGoldPrices(): Promise<PriceData[]> {
  const results = await Promise.allSettled([
    fetchFromCoinCap(),
    fetchFromCryptoCompare(),
    fetchFromCoinGecko(),
  ]);

  return results
    .filter((r): r is PromiseFulfilledResult<PriceData> => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value);
}

export function clearCache() {
  cache = null;
}
