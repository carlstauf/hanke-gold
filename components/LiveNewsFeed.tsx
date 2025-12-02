import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, ExternalLink, Globe } from 'lucide-react';
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
      // Simulation Mode
      setIsRealData(false);
      const initial = LIVE_NEWS_POOL.slice(0, 3).map((item, i) => ({
        ...item,
        id: `init-${i}`,
        timestamp: '2m ago',
        url: item.url || '#',
        tags: ['Live'],
        impact_score: item.impact
      }));
      setArticles(initial);

      simulationInterval.current = setInterval(() => {
        const nextItem = LIVE_NEWS_POOL[poolIndex.current];
        poolIndex.current = (poolIndex.current + 1) % LIVE_NEWS_POOL.length;
        
        const newArticle: NewsArticle = {
          ...nextItem,
          id: `live-${Date.now()}`,
          timestamp: 'Just now',
          url: nextItem.url || '#',
          tags: ['Breaking'],
          impact_score: nextItem.impact
        };

        setArticles(prev => [newArticle, ...prev].slice(0, 8)); // Keep recent 8
      }, 4000);
    }

    return () => {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, [apiKey]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 flex flex-col h-full min-h-[400px]">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRealData ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            </div>
            <h3 className="font-bold text-white text-sm tracking-wide">
              {isRealData ? 'LIVE CONNECTED' : 'LIVE SIMULATION'}
            </h3>
        </div>
        <div className="flex items-center gap-3">
          {isRealData && (
            <button 
              onClick={loadRealNews}
              disabled={loading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Refresh Real-time News"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {isRealData ? 'GOOGLE SEARCH GROUNDING' : 'MOCK DATA STREAM'}
          </span>
        </div>
      </div>

      <div className="flex-1 divide-y divide-slate-800/50 overflow-y-auto custom-scrollbar">
        {loading && articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <RefreshCw size={24} className="animate-spin mb-2" />
            <p className="text-xs font-mono">SCANNING GLOBAL SOURCES...</p>
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="p-4 hover:bg-slate-800/50 transition-colors group animate-in slide-in-from-top-2 duration-500 fade-in">
               <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-gold-500 uppercase flex items-center gap-1">
                       {isRealData && <Globe size={10} />}
                       {article.source}
                     </span>
                     <span className="text-[10px] text-slate-500 flex items-center gap-1">
                       <Clock size={10} /> {article.timestamp}
                     </span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                      article.impact_score > 0 ? 'text-green-500' : article.impact_score < 0 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                      {article.impact_score > 0 ? <ArrowUpRight size={12} /> : article.impact_score < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                      {Math.abs(article.impact_score).toFixed(2)} IMPACT
                  </div>
               </div>
               
               <a 
                 href={article.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="block group-hover:text-gold-400 transition-colors"
               >
                 <h4 className="text-sm font-medium text-slate-200 mb-1 flex items-start gap-2">
                   {article.title}
                   <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-slate-500" />
                 </h4>
               </a>
               
               <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveNewsFeed;