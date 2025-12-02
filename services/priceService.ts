
export const getLiveGoldPrice = async (): Promise<number | null> => {
  // STRATEGY: 
  // 1. Try Binance PAXG/USDT (Digital Gold). It trades 24/7, has no CORS issues, and tracks Spot Gold very closely.
  // 2. Try Yahoo Futures (GC=F) via CORS Proxies.
  // 3. Try Yahoo Spot (XAUUSD=X) via CORS Proxies.
  
  const sources = [
    {
      name: "Binance PAXG",
      url: "https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT",
      parser: (json: any) => parseFloat(json.price)
    },
    {
      name: "Yahoo GC=F (Proxy 1)",
      url: "https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m",
      parser: (json: any) => json?.chart?.result?.[0]?.meta?.regularMarketPrice
    },
    {
       name: "Yahoo XAU (Proxy 2)",
       url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1m"),
       parser: (json: any) => json?.chart?.result?.[0]?.meta?.regularMarketPrice
    }
  ];

  for (const source of sources) {
    try {
      const res = await fetch(source.url, {
         cache: 'no-store',
         method: 'GET'
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      const price = source.parser(data);
      
      if (price && typeof price === 'number' && !isNaN(price) && price > 0) {
        return price;
      }
    } catch (e) {
      // Silently fail and try next source
      console.warn(`Feed ${source.name} failed, trying next...`);
    }
  }

  return null;
};
