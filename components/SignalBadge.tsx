
import React from 'react';
import { SignalType } from '../types';
import { Loader2 } from 'lucide-react';

interface SignalBadgeProps {
  signal: SignalType;
  confidence: number;
  isSimulation?: boolean;
  isLoading?: boolean;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, confidence, isSimulation, isLoading }) => {
  let colorClass = 'text-terminal-text';
  let barColor = 'bg-terminal-text';
  
  if (signal === 'BUY') {
    colorClass = 'text-signal-buy';
    barColor = 'bg-signal-buy';
  } else if (signal === 'SELL') {
    colorClass = 'text-signal-sell';
    barColor = 'bg-signal-sell';
  } else {
    colorClass = 'text-signal-hold';
    barColor = 'bg-signal-hold';
  }

  return (
    <div className="h-full w-full p-6 flex flex-col justify-between">
      
      <div className="flex justify-between items-start">
        <h2 className={`text-xs font-mono uppercase ${isSimulation ? 'text-indigo-400 font-bold' : 'text-terminal-text opacity-70'}`}>
           {isSimulation ? 'SIMULATED SIGNAL' : 'DAILY SIGNAL'}
        </h2>
        <div className="flex gap-1">
           {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i===1 ? 'bg-terminal-highlight animate-pulse' : 'bg-terminal-border'}`} />)}
        </div>
      </div>

      <div className="flex items-baseline mt-4 mb-8">
         {isLoading ? (
            <div className="flex items-center gap-3">
               <Loader2 className="animate-spin text-terminal-text opacity-50" size={32} />
               <span className="text-xl font-mono text-terminal-text opacity-50 animate-pulse">PROCESSING...</span>
            </div>
         ) : (
             <h1 className={`text-6xl font-black tracking-tighter ${colorClass}`}>
                {signal}
             </h1>
         )}
      </div>

      <div className="mt-auto space-y-4">
         
         {/* Confidence Metric */}
         <div>
            <div className="flex justify-between text-xs font-mono mb-1">
               <span className="text-terminal-text">MODEL CONFIDENCE</span>
               <span className="text-terminal-highlight">{isLoading ? '--' : confidence}%</span>
            </div>
            <div className="h-2 w-full bg-terminal-border rounded-sm overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${barColor}`} 
                 style={{ width: `${isLoading ? 0 : confidence}%` }}
               />
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 gap-4 border-t border-terminal-border pt-4">
            <div>
               <div className="text-[10px] text-terminal-text font-mono uppercase">Trend Strength</div>
               <div className="text-lg font-mono text-terminal-highlight">{isLoading ? '...' : '0.84'}</div>
            </div>
            <div>
               <div className="text-[10px] text-terminal-text font-mono uppercase">Volatility</div>
               <div className="text-lg font-mono text-terminal-highlight">{isLoading ? '...' : '12.4%'}</div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default SignalBadge;
