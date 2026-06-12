import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendDataPoint } from '@/types';

interface TrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export default function TrendChart({ data, height = 280 }: TrendChartProps) {
  const chartData = useMemo(() => data, [data]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4D4F" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FF4D4F" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FA8C16" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FA8C16" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#5C7A99"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1E3A5F' }}
          />
          <YAxis
            stroke="#5C7A99"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#112240',
              border: '1px solid #1E3A5F',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#E6F1FF',
            }}
            itemStyle={{ color: '#E6F1FF' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#8FA3BF' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="count"
            name="预警总数"
            stroke="#00D4FF"
            strokeWidth={2}
            fill="url(#totalGrad)"
          />
          <Area
            type="monotone"
            dataKey="critical"
            name="极高风险"
            stroke="#FF4D4F"
            strokeWidth={1.5}
            fill="url(#criticalGrad)"
          />
          <Area
            type="monotone"
            dataKey="high"
            name="高风险"
            stroke="#FA8C16"
            strokeWidth={1.5}
            fill="url(#highGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
