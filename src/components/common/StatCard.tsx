import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  accent?: 'primary' | 'danger' | 'warning' | 'success';
}

const accentMap = {
  primary: 'from-accent-primary/20 to-accent-primary/5 text-accent-primary',
  danger: 'from-risk-critical/20 to-risk-critical/5 text-risk-critical',
  warning: 'from-risk-high/20 to-risk-high/5 text-risk-high',
  success: 'from-risk-low/20 to-risk-low/5 text-risk-low',
};

export default function StatCard({ title, value, icon, trend, trendLabel, accent = 'primary' }: StatCardProps) {
  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? 'text-text-muted' : trend > 0 ? 'text-risk-critical' : trend < 0 ? 'text-risk-low' : 'text-text-muted';

  return (
    <div className="card p-5 hover:shadow-glow transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-3xl font-bold font-mono text-text-primary mt-2 group-hover:text-accent-primary transition-colors">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs ${trendColor}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-text-muted ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
