
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { NewsArticle } from '../types';
import { fetchLiveGoldNews } from '../services/geminiService';

const LIVE_NEWS_POOL = [
  { title: "Gold Rallies as Dollar Weakens Ahead of Fed Meeting", source: "Bloomberg", summary: "Spot gold rose 0.8% as the dollar index (DXY) slipped.", impact: 0.6, url: "#" },
  { title: "Central Banks Continue Record Gold Buying Spree", source: "World Gold Council", summary: "Emerging market central banks added 45 tonnes to reserves.", impact: 0.8, url: "#" },
  { title: "Yields Spike on Hot CPI Print, Gold Tumbles", source: "Reuters", summary: "US 10Y Treasury yield hit 4.5%, weighing on non-yielding bullion.", impact: -0.7, url: "#" },
  { title: "Geopolitical Tensions Escalate in Middle East", source: "Al Jazeera", summary: "Safe haven flows boost precious metals amid conflict fears.", impact: 0.5, url: "#" },
  { title: "China Import Data Shows Weak Consumer Demand", source: "Caixin", summary: "Jewelry fabrication demand down 15% YoY.", impact: -0.4, url: "#" },
  { title: "Silver Outperforms Gold as Industrial Demand Picks Up", source: "Kitco", summary: "Gold/Silver ratio tightens as manufacturing sector rebounds.", impact: 0.2, url: "#" },
  { title: "ECB Signals Potential Rate Cut in June", source: "Financial Times", summary: "Lower Eurozone rates could weaken EUR but support global liquidity.", impact: 0.4, url: "#" },
  { title: "India Raises Import Duty on Gold to 15%", source: "Times of India", summary: "Physical demand expected to contract in Q3.", impact: -0.5, url: "#" },
];

interface LiveNewsFeedProps {
  apiKey?: string;
  externalArticles?: NewsArticle[];
}

type FilterType = 'ALL' | 'BULLISH' | 'BEARISH' | 'SELL';

const LiveNewsFeed: React.FC<LiveNewsFeedProps> = ({ apiKey, externalArticles }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealData, setIsRealData] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const poolIndex = useRef(0);
  const simulationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRealNews = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const realArticles = await fetchLiveGoldNews(apiKey);
      setArticles(realArticles);
      setIsRealData(true);
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    } catch (error) {
      console.error("Failed to fetch real news, falling back to simulation", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Priority 1: Use External Articles passed from parent (avoids duplicate API calls)
    if (externalArticles && externalArticles.length > 0) {
        setArticles(externalArticles);
        setIsRealData(true);
        if (simulationInterval.current) clearInterval(simulationInterval.current);
        return;
    }

    // Priority 2: Fetch internally if we have a key but no data passed down
    // (Note: In the current App structure, this usually won't run on boot, protecting rate limits)
    if (apiKey && (!externalArticles || externalArticles.length === 0)) {
      loadRealNews();
    } else if (!apiKey) {
      // Priority 3: Simulation Mode
      setIsRealData(false);
      const initial = LIVE_NEWS_POOL.slice(0, 5).map((item, i) => ({
        ...item,
        id: `init-${i}`,
        timestamp: '14:02:33',
        url: item.url || '#',
        tags: ['Live'],
        impact_score: item.impact
      }));
      setArticles(initial);

      simulationInterval.current = setInterval(() => {
        const nextItem = LIVE_NEWS_POOL[poolIndex.current];
        poolIndex.current = (poolIndex.current + 1) % LIVE_NEWS_POOL.length;
        
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        const newArticle: NewsArticle = {
          ...nextItem,
          id: `live-${Date.now()}`,
          timestamp: timeStr,
          url: nextItem.url || '#',
          tags: ['Breaking'],
          impact_score: nextItem.impact
        };

        setArticles(prev => [newArticle, ...prev].slice(0, 20));
      }, 4000);
    }

    return () => {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, [apiKey, externalArticles]);

  // Filtering Logic
  const filteredArticles = articles.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'BULLISH') return a.impact_score > 0;
    if (filter === 'BEARISH' || filter === 'SELL') return a.impact_score < 0;
    return true;
  });

  return (
    <div className="h-full flex flex-col font-mono text-xs">
       {/* Toolbar */}
       <div className="bg-terminal-dark border-b border-terminal-border flex justify-between px-3 py-1 items-center shrink-0">
          <div className="flex gap-2">
             {(['ALL', 'BULLISH', 'SELL'] as FilterType[]).map((f) => (
                <button
                   key={f}
                   onClick={() => setFilter(f)}
                   className={`px-2 py-0.5 text-[10px] rounded-sm transition-colors ${
                      filter === f 
                      ? 'bg-terminal-highlight text-black font-bold' 
                      : 'text-terminal-text hover:bg-terminal-border'
                   }`}
                >
                   {f}
                </button>
             ))}
          </div>
          {isRealData && !externalArticles && (
             <button onClick={loadRealNews} disabled={loading} className="hover:text-terminal-highlight text-terminal-text">
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''}/>
             </button>
          )}
       </div>

       {/* Table */}
       <div className="flex-1 overflow-auto bg-terminal-black">
          <table className="w-full text-left border-collapse">
             <thead className="sticky top-0 bg-terminal-panel z-10 border-b border-terminal-border">
                <tr>
                   <th className="py-1 px-3 font-normal text-terminal-text opacity-60 w-20">TIME</th>
                   <th className="py-1 px-3 font-normal text-terminal-text opacity-60 w-24">SOURCE</th>
                   <th className="py-1 px-3 font-normal text-terminal-text opacity-60">HEADLINE</th>
                   <th className="py-1 px-3 font-normal text-terminal-text opacity-60 text-right w-16">IMP</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-terminal-border/30">
                {filteredArticles.length === 0 ? (
                   <tr><td colSpan={4} className="py-4 text-center opacity-50">No data matching filter</td></tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-terminal-panel group cursor-pointer">
                        <td className="py-2 px-3 text-terminal-text opacity-70">{article.timestamp}</td>
                        <td className="py-2 px-3 text-terminal-highlight font-bold">{article.source}</td>
                        <td className="py-2 px-3">
                          <a href={article.url} target="_blank" rel="noopener noreferrer" className="block text-terminal-text hover:text-signal-hold hover:underline truncate max-w-[400px]">
                              {article.title}
                          </a>
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${article.impact_score > 0 ? 'text-signal-buy' : 'text-signal-sell'}`}>
                          {article.impact_score > 0 ? '+' : ''}{article.impact_score}
                        </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default LiveNewsFeed;
