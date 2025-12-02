import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { HistoricalPoint } from '../types';

interface HistoryChartProps {
  data: HistoricalPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-terminal-black border border-terminal-border p-2 shadow-xl">
        <p className="text-terminal-text text-[10px] font-mono mb-1">{label}</p>
        <div className="flex items-center gap-3">
          <span className="text-signal-hold text-xs font-bold font-mono">${payload[0].value}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-400 text-xs font-bold font-mono">Sent: {payload[1].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="1 0" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="date" 
            stroke="#52525b" 
            fontSize={10} 
            tickFormatter={(val) => val.slice(8)} // Just day
            tickMargin={5}
            axisLine={false}
            tickLine={false}
            interval={5}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#52525b" 
            fontSize={10} 
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#52525b" 
            fontSize={10} 
            domain={[-1, 1]} 
            hide
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line 
            yAxisId="left"
            type="linear" // Sharp lines for technical look
            dataKey="price" 
            stroke="#fbbf24" 
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: '#fbbf24' }}
          />
          <Line 
            yAxisId="right"
            type="step" 
            dataKey="sentiment" 
            stroke="#3b82f6" 
            strokeWidth={1}
            dot={false}
            opacity={0.6}
          />
          <ReferenceLine yAxisId="right" y={0} stroke="#27272a" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;