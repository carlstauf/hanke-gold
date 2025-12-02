import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { HistoricalPoint } from '../types';
import { WifiOff } from 'lucide-react';

interface HistoryChartProps {
  data: HistoricalPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-terminal-black border border-terminal-border p-2 shadow-xl">
        <p className="text-terminal-text text-[10px] font-mono mb-1">{label}</p>
        <div className="flex items-center gap-3">
          <span className="text-signal-hold text-sm font-bold font-mono">${payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center border border-terminal-border/20 border-dashed bg-terminal-dark/50">
         <WifiOff className="text-terminal-text opacity-20 mb-2" size={24} />
         <span className="text-xs font-mono text-terminal-text opacity-50">NO MARKET DATA FEED</span>
         <span className="text-[10px] font-mono text-terminal-text opacity-30 mt-1">Awaiting tick stream...</span>
      </div>
    );
  }

  const lastPrice = data[data.length - 1]?.price || 0;
  
  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 right-4 flex flex-col items-end z-10 pointer-events-none">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
            <span className="text-xl font-mono font-bold text-signal-hold">${lastPrice.toFixed(2)}</span>
         </div>
         <span className="text-[10px] text-terminal-text font-mono">LIVE XAU/USD PRICE</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272a" strokeDasharray="1 0" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={10} 
            tickMargin={5}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#52525b" 
            fontSize={10} 
            domain={['dataMin - 5', 'dataMax + 5']}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="price" 
            stroke="#fbbf24" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;