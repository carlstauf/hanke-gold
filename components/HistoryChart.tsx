import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { HistoricalPoint } from '../types';

interface HistoryChartProps {
  data: HistoricalPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-300 text-sm font-mono mb-2">{label}</p>
        <p className="text-gold-400 text-sm font-bold">
          Price: ${payload[0].value}
        </p>
        <p className="text-blue-400 text-sm font-bold">
          Sentiment: {payload[1].value}
        </p>
      </div>
    );
  }
  return null;
};

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EAB308" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickFormatter={(val) => val.slice(5)}
            tickMargin={10}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#EAB308" 
            fontSize={12} 
            domain={['dataMin - 50', 'dataMax + 50']}
            tickFormatter={(val) => `$${val}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#3b82f6" 
            fontSize={12} 
            domain={[-1.2, 1.2]} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="price" 
            name="Gold Price (USD)"
            stroke="#EAB308" 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
          <Line 
            yAxisId="right"
            type="step" 
            dataKey="sentiment" 
            name="Sentiment Score"
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
