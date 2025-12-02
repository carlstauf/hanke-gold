import React, { useState, useEffect } from 'react';
import { Play, Loader2, RefreshCw, Zap, AlertTriangle, Activity } from 'lucide-react';
import { SHOCK_EVENTS } from '../constants';
import { ShockEvent } from '../types';

interface SimulationPanelProps {
  onRunScenario: (shocks: string[]) => Promise<void>;
  isLoading: boolean;
  onApiKeyChange: (key: string) => void;
  hasKey: boolean;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ onRunScenario, isLoading, onApiKeyChange, hasKey }) => {
  const [tempKey, setTempKey] = useState('');
  const [activeShocks, setActiveShocks] = useState<Set<string>>(new Set());
  
  // Client-side realtime projection
  const [projection, setProjection] = useState({ sentiment: 0, signal: 'NEUTRAL' });

  const toggleShock = (id: string) => {
    const newSet = new Set(activeShocks);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setActiveShocks(newSet);
  };

  useEffect(() => {
    // Simple logic to calculate implied sentiment from active shocks
    let totalBias = 0;
    activeShocks.forEach(id => {
      const shock = SHOCK_EVENTS.find(s => s.id === id);
      if (shock) totalBias += shock.impact_bias;
    });

    // Dampen the effect so it doesn't just instantly hit max
    const dampened = Math.max(-1, Math.min(1, totalBias));
    
    let sig = 'HOLD';
    if (dampened > 0.3) sig = 'BUY';
    if (dampened < -0.3) sig = 'SELL';

    setProjection({ sentiment: dampened, signal: sig });
  }, [activeShocks]);

  const handleRun = () => {
    const labels = Array.from(activeShocks).map(id => {
       const s = SHOCK_EVENTS.find(evt => evt.id === id);
       return s ? s.label : id;
    });
    onRunScenario(labels);
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-terminal-black font-sans">
      
      {/* LEFT: CONTROLS */}
      <div className="w-full md:w-1/2 p-6 border-r border-terminal-border flex flex-col">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Zap className="text-signal-buy" size={18} fill="currentColor" />
              <h2 className="text-sm font-bold text-terminal-highlight tracking-wide">MARKET SHOCK SIMULATOR</h2>
           </div>
           {!hasKey && (
             <div className="flex gap-2">
               <input 
                 type="password" 
                 placeholder="API_KEY" 
                 className="bg-terminal-dark border border-terminal-border text-xs px-2 py-1 w-24 outline-none text-terminal-highlight"
                 value={tempKey}
                 onChange={(e) => setTempKey(e.target.value)}
               />
               <button onClick={() => onApiKeyChange(tempKey)} className="text-[10px] bg-terminal-border px-2 text-terminal-text hover:bg-terminal-highlight hover:text-black">SET</button>
             </div>
           )}
        </div>

        <p className="text-[10px] text-terminal-text mb-4 opacity-70">
           Select one or multiple "Black Swan" or Macro events to simulate a compound market shock. The engine will hallucinate the resulting news flow and price action.
        </p>

        {/* SHOCK GRID */}
        <div className="grid grid-cols-2 gap-2 flex-1 content-start overflow-y-auto">
          {SHOCK_EVENTS.map((shock) => {
             const isActive = activeShocks.has(shock.id);
             return (
               <button
                 key={shock.id}
                 onClick={() => toggleShock(shock.id)}
                 className={`
                    relative p-3 border text-left transition-all duration-200 group
                    ${isActive 
                       ? 'bg-terminal-highlight/5 border-terminal-highlight' 
                       : 'bg-terminal-dark border-terminal-border hover:border-terminal-text'}
                 `}
               >
                 {isActive && <div className="absolute top-0 right-0 w-2 h-2 bg-terminal-highlight shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                 
                 <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-terminal-highlight' : 'text-terminal-text'}`}>
                       {shock.label}
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-terminal-text opacity-50">{shock.category}</span>
                    <span className={`text-[9px] font-mono ${shock.impact_bias > 0 ? 'text-signal-buy' : 'text-signal-sell'}`}>
                       {shock.impact_bias > 0 ? 'BULL' : 'BEAR'}
                    </span>
                 </div>
               </button>
             );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-terminal-border">
          <button
            onClick={handleRun}
            disabled={isLoading || !hasKey}
            className="w-full py-4 bg-terminal-border hover:bg-terminal-highlight hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
             {isLoading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
             <span className="font-mono font-bold tracking-wider">RUN SIMULATION</span>
          </button>
          {!hasKey && <p className="text-[10px] text-center text-signal-sell mt-2 font-mono">API KEY REQUIRED FOR GENERATIVE REPORT</p>}
        </div>
      </div>

      {/* RIGHT: PREVIEW & OUTPUT */}
      <div className="w-full md:w-1/2 bg-terminal-dark p-6 flex flex-col relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#27272a 1px, transparent 1px), linear-gradient(90deg, #27272a 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="relative z-10 flex flex-col h-full">
           <div className="flex items-center gap-2 mb-6">
              <Activity size={14} className="text-terminal-text" />
              <h3 className="text-xs font-mono text-terminal-text">PROJECTED IMPACT (REAL-TIME)</h3>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className={`text-6xl font-black tracking-tighter mb-2 ${
                 projection.signal === 'BUY' ? 'text-signal-buy' : 
                 projection.signal === 'SELL' ? 'text-signal-sell' : 'text-signal-hold'
              }`}>
                 {projection.signal}
              </div>
              <div className="text-sm font-mono text-terminal-text opacity-50">IMPLIED SENTIMENT VECTOR</div>
           </div>

           {/* Gauge */}
           <div className="h-16 w-full bg-terminal-black border border-terminal-border relative mb-8 rounded-sm overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white z-20"></div>
              {/* Fill */}
              <div 
                className={`absolute top-0 bottom-0 transition-all duration-300 ${projection.sentiment > 0 ? 'bg-signal-buy' : 'bg-signal-sell'}`}
                style={{
                  opacity: 0.3,
                  left: projection.sentiment > 0 ? '50%' : `${50 + (projection.sentiment * 50)}%`,
                  width: `${Math.abs(projection.sentiment) * 50}%`
                }}
              ></div>
               <div 
                className={`absolute top-0 bottom-0 transition-all duration-300 w-1 ${projection.sentiment > 0 ? 'bg-signal-buy' : 'bg-signal-sell'}`}
                style={{ left: `${50 + (projection.sentiment * 50)}%` }}
              ></div>
              
              {/* Labels */}
              <span className="absolute left-2 top-2 text-[10px] font-mono text-signal-sell">EXTREME SELL</span>
              <span className="absolute right-2 top-2 text-[10px] font-mono text-signal-buy">EXTREME BUY</span>
           </div>

           <div className="bg-terminal-black border border-terminal-border p-4">
              <div className="flex items-center gap-2 mb-2">
                 <RefreshCw size={12} className={isLoading ? "animate-spin" : "opacity-50"} />
                 <span className="text-[10px] font-mono text-terminal-text uppercase">Generative Output</span>
              </div>
              <div className="space-y-2">
                 {activeShocks.size === 0 ? (
                    <p className="text-[10px] text-terminal-text opacity-50 italic">System Stable. Select shock events to perturb the model.</p>
                 ) : (
                    <p className="text-[10px] text-terminal-text text-terminal-highlight">
                       Simulation Ready: {activeShocks.size} Active Vectors.
                       <br/>
                       Click Run to generate synthetic headlines.
                    </p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;