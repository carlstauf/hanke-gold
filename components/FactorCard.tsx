import React from 'react';
import { FactorScore } from '../types';

interface FactorCardProps {
  factor: FactorScore;
}

const FactorCard: React.FC<FactorCardProps> = ({ factor }) => {
  const scorePct = Math.min(Math.max((factor.score + 1) / 2 * 100, 0), 100);
  
  let colorClass = 'text-terminal-text';
  if (factor.score > 0.1) colorClass = 'text-signal-buy';
  if (factor.score < -0.1) colorClass = 'text-signal-sell';

  return (
    <div className="h-full p-4 flex flex-col hover:bg-terminal-panel transition-colors group relative">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] font-mono text-terminal-text">
        {factor.impact.toFixed(2)} IMP
      </div>

      <h3 className="text-[10px] font-mono uppercase text-terminal-text opacity-70 mb-2">{factor.factor}</h3>
      
      <div className={`text-2xl font-bold font-mono mb-3 ${colorClass}`}>
         {factor.score > 0 ? '+' : ''}{factor.score.toFixed(2)}
      </div>

      <div className="mt-auto">
         {/* Center-zero sparkline */}
         <div className="h-1 w-full bg-terminal-border relative mb-2">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-terminal-text opacity-20 z-10" />
            <div 
               className={`absolute h-full transition-all duration-300 ${factor.score > 0 ? 'bg-signal-buy' : 'bg-signal-sell'}`}
               style={{
                  left: factor.score < 0 ? `${50 - Math.abs(factor.score) * 50}%` : '50%',
                  width: `${Math.abs(factor.score) * 50}%`
               }}
            />
         </div>
         <p className="text-[10px] text-terminal-text leading-tight opacity-50 line-clamp-2">
            {factor.explanation}
         </p>
      </div>
    </div>
  );
};

export default FactorCard;