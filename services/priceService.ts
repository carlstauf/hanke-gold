
export const getLiveGoldPrice = async (): Promise<number | null> => {
  // STRATEGY: 
  // 1. CoinGecko (PAX Gold) - Most reliable open API, works in US & Global.
  // 2. Binance US (PAXG/USDT) - Specific for US users (api.binance.com is blocked in US).
  // 3. Binance Global (PAXG/USDT) - For rest of world.
  // 4. Yahoo Futures (GC=F) - Backup via Proxy.
  
  const sources = [
    {
      name: "CoinGecko (Global)",
      url: "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd",
      parser: (json: any) => json?.['pax-gold']?.usd
    },
    {
      name: "Binance US (PAXG/USDT)",
      url: "https://api.binance.us/api/v3/ticker/price?symbol=PAXGUSDT",
      parser: (json: any) => parseFloat(json.price)
    },
    {
      name: "Binance Global (PAXG/USDT)",
      url: "https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT",
      parser: (json: any) => parseFloat(json.price)
    },
    {
      name: "Yahoo GC=F (Backup)",
      url: "https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m",
      parser: (json: any) => json?.chart?.result?.[0]?.meta?.regularMarketPrice
    }
  ];

  for (const source of sources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout per source

      const res = await fetch(source.url, {
         signal: controller.signal,
         cache: 'no-store',
         method: 'GET',
         headers: {
             'Accept': 'application/json'
         }
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      
      const data = await res.json();
      const price = source.parser(data);
      
      if (price && typeof price === 'number' && !isNaN(price) && price > 2000) {
        // Basic validation: Gold shouldn't be $0 or $100. It's > $2000.
        return price;
      }
    } catch (e) {
      // Silently fail and try next source
      continue;
    }
  }

  return null;
};
