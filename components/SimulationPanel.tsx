import React, { useState, useEffect } from 'react';
import { Play, Loader2, RefreshCw, BarChart2, TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { GoldSignal } from '../types';

interface SimulationPanelProps {
  onRunScenario: (inputs: any) => Promise<void>;
  isLoading: boolean;
  onApiKeyChange: (key: string) => void;
  hasKey: boolean;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ onRunScenario, isLoading, onApiKeyChange, hasKey }) => {
  const [tempKey, setTempKey] = useState('');
  
  // Scenario Inputs (0-100 scale)
  const [inputs, setInputs] = useState({
    inflation: 50, // 0 = Deflation, 100 = Hyperinflation
    usd: 50,       // 0 = Crash, 100 = Moon
    risk: 30,      // 0 = World Peace, 100 = WW3
    rates: 60      // 0 = 0%, 100 = 10%
  });

  // Client-side realtime projection (simple deterministic logic for UI feedback)
  const [projection, setProjection] = useState({ sentiment: 0, signal: 'NEUTRAL' });

  useEffect(() => {
    // Simple logic to update the UI gauge immediately before the LLM runs
    // High Inflation (Bullish), Low USD (Bullish), High Risk (Bullish), Low Rates (Bullish)
    const infScore = (inputs.inflation - 50) / 50; 
    const usdScore = (50 - inputs.usd) / 50;
    const riskScore = (inputs.risk - 20) / 80; 
    const ratesScore = (50 - inputs.rates) / 50;

    const weightedScore = (infScore * 0.3) + (usdScore * 0.4) + (riskScore * 0.2) + (ratesScore * 0.1);
    const clamped = Math.max(-1, Math.min(1, weightedScore));
    
    let sig = 'HOLD';
    if (clamped > 0.3) sig = 'BUY';
    if (clamped < -0.3) sig = 'SELL';

    setProjection({ sentiment: clamped, signal: sig });
  }, [inputs]);

  const handleSliderChange = (key: string, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-terminal-black font-sans">
      
      {/* LEFT: CONTROLS */}
      <div className="w-full md:w-1/2 p-6 border-r border-terminal-border flex flex-col">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Activity className="text-signal-hold" size={18} />
              <h2 className="text-sm font-bold text-terminal-highlight tracking-wide">MACRO STRESS TEST</h2>
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

        <div className="space-y-8 flex-1">
          <SliderControl 
            label="INFLATION / CPI" 
            subLabel="Deflationary ↔ Hyperinflation"
            value={inputs.inflation} 
            onChange={(v) => handleSliderChange('inflation', v)}
            icon={TrendingUp}
            color="text-red-400"
          />
          <SliderControl 
            label="USD STRENGTH (DXY)" 
            subLabel="Bearish ↔ Bullish Breakout"
            value={inputs.usd} 
            onChange={(v) => handleSliderChange('usd', v)}
            icon={DollarSign}
            color="text-green-400"
          />
          <SliderControl 
            label="GEOPOLITICAL RISK" 
            subLabel="Peace ↔ Conflict"
            value={inputs.risk} 
            onChange={(v) => handleSliderChange('risk', v)}
            icon={AlertTriangle}
            color="text-orange-400"
          />
          <SliderControl 
            label="FED RATES" 
            subLabel="Cuts (-50bps) ↔ Hikes (+50bps)"
            value={inputs.rates} 
            onChange={(v) => handleSliderChange('rates', v)}
            icon={BarChart2}
            color="text-blue-400"
          />
        </div>

        <div className="mt-8 pt-6 border-t border-terminal-border">
          <button
            onClick={() => onRunScenario(inputs)}
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
           <h3 className="text-xs font-mono text-terminal-text mb-6">PROJECTED OUTCOME (REAL-TIME ESTIMATE)</h3>
           
           <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className={`text-6xl font-black tracking-tighter mb-2 ${
                 projection.signal === 'BUY' ? 'text-signal-buy' : 
                 projection.signal === 'SELL' ? 'text-signal-sell' : 'text-signal-hold'
              }`}>
                 {projection.signal}
              </div>
              <div className="text-sm font-mono text-terminal-text">IMPLIED SENTIMENT</div>
           </div>

           {/* Gauge */}
           <div className="h-12 w-full bg-terminal-black border border-terminal-border relative mb-8 rounded-sm overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white z-20"></div>
              {/* Fill */}
              <div 
                className={`absolute top-0 bottom-0 transition-all duration-300 ${projection.sentiment > 0 ? 'bg-signal-buy/20' : 'bg-signal-sell/20'}`}
                style={{
                  left: projection.sentiment > 0 ? '50%' : `${50 + (projection.sentiment * 50)}%`,
                  width: `${Math.abs(projection.sentiment) * 50}%`
                }}
              ></div>
               <div 
                className={`absolute top-0 bottom-0 transition-all duration-300 w-1 ${projection.sentiment > 0 ? 'bg-signal-buy' : 'bg-signal-sell'}`}
                style={{ left: `${50 + (projection.sentiment * 50)}%` }}
              ></div>
           </div>

           <div className="bg-terminal-black border border-terminal-border p-4">
              <div className="flex items-center gap-2 mb-2">
                 <RefreshCw size={12} className={isLoading ? "animate-spin" : "opacity-50"} />
                 <span className="text-[10px] font-mono text-terminal-text uppercase">Generative Report Preview</span>
              </div>
              <div className="space-y-2">
                 <SkeletonLine width="w-3/4" />
                 <SkeletonLine width="w-full" />
                 <SkeletonLine width="w-5/6" />
              </div>
              <p className="text-[10px] text-terminal-text mt-4 opacity-50 italic">
                 Click "RUN SIMULATION" to generate full Bloomberg-style headlines and factor analysis based on these parameters.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const SliderControl = ({ label, subLabel, value, onChange, icon: Icon, color }: any) => (
  <div className="space-y-3">
     <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
           <Icon size={14} className={color} />
           <span className="text-xs font-bold text-terminal-highlight">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-terminal-text">{value}%</span>
     </div>
     <input 
       type="range" 
       min="0" 
       max="100" 
       value={value} 
       onChange={(e) => onChange(Number(e.target.value))}
       className="w-full h-1 bg-terminal-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-terminal-highlight [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
     />
     <div className="flex justify-between text-[10px] text-terminal-text opacity-50 font-mono">
        <span>{subLabel.split('↔')[0]}</span>
        <span>{subLabel.split('↔')[1]}</span>
     </div>
  </div>
);

const SkeletonLine = ({ width }: { width: string }) => (
  <div className={`h-2 bg-terminal-border/50 rounded-sm ${width}`}></div>
);

export default SimulationPanel;
