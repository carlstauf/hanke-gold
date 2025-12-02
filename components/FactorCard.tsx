import React from 'react';
import { FactorScore } from '../types';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface FactorCardProps {
  factor: FactorScore;
}

const FactorCard: React.FC<FactorCardProps> = ({ factor }) => {
  const isBullish = factor.score > 0.1;
  const isBearish = factor.score < -0.1;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-400 font-medium text-sm">{factor.factor}</h3>
        {isBullish && <ArrowUpRight className="text-green-500" size={18} />}
        {isBearish && <ArrowDownRight className="text-red-500" size={18} />}
        {!isBullish && !isBearish && <Minus className="text-slate-500" size={18} />}
      </div>
      
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-2xl font-bold ${
          isBullish ? 'text-green-400' : isBearish ? 'text-red-400' : 'text-slate-300'
        }`}>
          {factor.score > 0 ? '+' : ''}{factor.score.toFixed(2)}
        </span>
        <span className="text-xs text-slate-500 mb-1 font-mono">IMPACT</span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full ${isBullish ? 'bg-green-500' : isBearish ? 'bg-red-500' : 'bg-slate-500'}`}
          style={{ width: `${Math.abs(factor.score) * 100}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
        {factor.explanation}
      </p>
    </div>
  );
};

export default FactorCard;
