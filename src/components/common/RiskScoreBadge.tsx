import { getRiskScoreBarColor, getRiskScoreColor } from '@/utils/formatters';

interface RiskScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskScoreBadge({ score, size = 'md' }: RiskScoreBadgeProps) {
  const sizes = {
    sm: { bar: 'h-1 w-12', text: 'text-xs', badge: 'w-8 h-8 text-xs' },
    md: { bar: 'h-1.5 w-16', text: 'text-sm', badge: 'w-10 h-10 text-sm' },
    lg: { bar: 'h-2 w-24', text: 'text-base', badge: 'w-14 h-14 text-lg' },
  };

  const s = sizes[size];
  const barColor = getRiskScoreBarColor(score);
  const textColor = getRiskScoreColor(score);

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.badge} rounded-full border-2 border-current flex items-center justify-center font-mono font-bold ${textColor} bg-current/10`}>
        {score}
      </div>
      {size !== 'sm' && (
        <div className="flex flex-col gap-1">
          <span className={`${s.text} font-medium ${textColor}`}>风险评分</span>
          <div className="w-full bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className={`${barColor} h-full rounded-full transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
