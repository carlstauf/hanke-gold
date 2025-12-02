
export const getLiveGoldPrice = async (): Promise<number | null> => {
  try {
    // We use a CORS proxy to allow the browser to call Yahoo Finance directly
    // Option 1 from your list: Yahoo Finance GC=F (Gold Futures)
    const symbol = "GC=F"; 
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Yahoo API Error");
    
    const data = await res.json();
    const result = data.chart.result[0];
    const price = result.meta.regularMarketPrice;
    
    return price;
  } catch (error) {
    console.warn("Failed to fetch live price from Yahoo, falling back...", error);
    return null;
  }
};
