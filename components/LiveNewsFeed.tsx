import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { NewsArticle } from '../types';
import { LIVE_NEWS_POOL } from '../constants';
import { fetchLiveGoldNews } from '../services/geminiService';

interface LiveNewsFeedProps {
  apiKey?: string;
}

const LiveNewsFeed: React.FC<LiveNewsFeedProps> = ({ apiKey }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealData, setIsRealData] = useState(false);
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
    if (apiKey) {
      loadRealNews();
    } else {
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
  }, [apiKey]);

  return (
    <div className="h-full flex flex-col font-mono text-xs">
       <div className="bg-terminal-dark border-b border-terminal-border flex justify-between px-3 py-1 items-center shrink-0">
          <span className="text-terminal-text opacity-50 uppercase">Global Wire</span>
          {isRealData && (
             <button onClick={loadRealNews} disabled={loading} className="hover:text-terminal-highlight text-terminal-text">
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''}/>
             </button>
          )}
       </div>
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
                {articles.map((article) => (
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
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default LiveNewsFeed;