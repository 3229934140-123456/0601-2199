import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RiskLevel } from '@/types';

interface RiskDistributionProps {
  data: Record<RiskLevel, number>;
  height?: number;
}

const COLORS: Record<RiskLevel, string> = {
  critical: '#FF4D4F',
  high: '#FA8C16',
  medium: '#FAAD14',
  low: '#52C41A',
};

const LABELS: Record<RiskLevel, string> = {
  critical: '极高风险',
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

export default function RiskDistribution({ data, height = 260 }: RiskDistributionProps) {
  const chartData = useMemo(() => {
    return (Object.keys(data) as RiskLevel[]).map(key => ({
      name: LABELS[key],
      value: data[key],
      level: key,
    }));
  }, [data]);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.level]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#112240',
              border: '1px solid #1E3A5F',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#E6F1FF',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: '#8FA3BF' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
