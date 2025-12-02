import React from 'react';
import { SignalType } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SignalBadgeProps {
  signal: SignalType;
  confidence: number;
  className?: string;
}

const SignalBadge: React.FC<SignalBadgeProps> = ({ signal, confidence, className = '' }) => {
  let colorClass = '';
  let Icon = Minus;

  switch (signal) {
    case 'BUY':
      colorClass = 'bg-green-500/20 text-green-400 border-green-500/50';
      Icon = TrendingUp;
      break;
    case 'SELL':
      colorClass = 'bg-red-500/20 text-red-400 border-red-500/50';
      Icon = TrendingDown;
      break;
    case 'HOLD':
      colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      Icon = Minus;
      break;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 ${colorClass} ${className}`}>
      <div className="text-sm font-mono tracking-widest opacity-80 mb-2">DAILY SIGNAL</div>
      <div className="flex items-center gap-3">
        <Icon size={48} strokeWidth={3} />
        <span className="text-6xl font-black tracking-tighter">{signal}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-500" 
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold">{confidence}% CONFIDENCE</span>
      </div>
    </div>
  );
};

export default SignalBadge;
