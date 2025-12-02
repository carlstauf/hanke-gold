import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { NewsArticle } from '../types';
import { LIVE_NEWS_POOL } from '../constants';

const LiveNewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const poolIndex = useRef(0);

  useEffect(() => {
    // Initial load of a few articles
    const initial = LIVE_NEWS_POOL.slice(0, 3).map((item, i) => ({
      ...item,
      id: `init-${i}`,
      timestamp: '2m ago',
      url: '#',
      tags: ['Live'],
      impact_score: item.impact
    }));
    setArticles(initial);

    // Stream new articles every few seconds
    const interval = setInterval(() => {
      const nextItem = LIVE_NEWS_POOL[poolIndex.current];
      poolIndex.current = (poolIndex.current + 1) % LIVE_NEWS_POOL.length;
      
      const newArticle: NewsArticle = {
        ...nextItem,
        id: `live-${Date.now()}`,
        timestamp: 'Just now',
        url: '#',
        tags: ['Breaking'],
        impact_score: nextItem.impact
      };

      setArticles(prev => [newArticle, ...prev].slice(0, 6)); // Keep recent 6
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <h3 className="font-bold text-white text-sm tracking-wide">LIVE WIRE</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">REAL-TIME ALGO FEED</span>
      </div>
      <div className="divide-y divide-slate-800/50 max-h-[350px] overflow-y-auto">
        {articles.map((article) => (
          <div key={article.id} className="p-4 hover:bg-slate-800/50 transition-colors animate-in slide-in-from-top-2 duration-500 fade-in">
             <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-gold-500 uppercase">{article.source}</span>
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
             <h4 className="text-sm font-medium text-slate-200 mb-1">{article.title}</h4>
             <p className="text-xs text-slate-400">{article.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveNewsFeed;