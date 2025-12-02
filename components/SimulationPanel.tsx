import React, { useState } from 'react';
import { Play, Loader2, Key } from 'lucide-react';

interface SimulationPanelProps {
  onAnalyze: (headlines: string[]) => void;
  isLoading: boolean;
  onApiKeyChange: (key: string) => void;
  hasKey: boolean;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ onAnalyze, isLoading, onApiKeyChange, hasKey }) => {
  const [headlines, setHeadlines] = useState<string>(
    "ECB cuts rates by 25bps as inflation cools\nGold prices dip below $2300 on technical selling\nGeopolitical tensions rise in Red Sea affecting shipping"
  );
  const [tempKey, setTempKey] = useState('');

  const handleRun = () => {
    const lines = headlines.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      onAnalyze(lines);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Play size={20} className="text-gold-500" />
          Live Sentiment Engine
        </h3>
        <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">GEMINI POWERED</span>
      </div>

      {!hasKey && (
        <div className="mb-4 p-4 bg-slate-950 rounded-lg border border-red-900/50">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <Key size={16} />
            <span className="text-sm font-bold">API Key Required</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">To run the live simulation, enter a Google Gemini API Key. It is stored only in memory.</p>
          <div className="flex gap-2">
            <input 
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="Paste Gemini API Key"
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm focus:border-gold-500 outline-none"
            />
            <button 
              onClick={() => onApiKeyChange(tempKey)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-mono text-slate-400 mb-2">INPUT HEADLINES (ONE PER LINE)</label>
        <textarea
          value={headlines}
          onChange={(e) => setHeadlines(e.target.value)}
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-300 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none resize-none transition-all"
          placeholder="Paste news headlines here..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleRun}
          disabled={isLoading || !hasKey}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${
            isLoading || !hasKey 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gold-500 hover:bg-gold-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Compute Signal
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SimulationPanel;
