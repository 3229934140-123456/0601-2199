import { Bell, Search, User, Settings, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime } from '@/utils/formatters';

export default function TopBar() {
  const { currentUser, alerts } = useAppStore();
  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const roleMap = { analyst: '风控专员', supervisor: '风控主管', strategist: '策略分析师' };

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索商户、交易号、预警ID..."
            className="w-80 pl-10 pr-4 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatDateTime(new Date().toISOString())}</span>
        </div>

        <button className="relative p-2 rounded-md hover:bg-bg-hover transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-risk-critical text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>

        <button className="p-2 rounded-md hover:bg-bg-hover transition-colors">
          <Settings className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="h-8 w-px bg-border-primary" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border-primary flex items-center justify-center">
            <User className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-sm">
            <div className="text-text-primary font-medium">{currentUser.name}</div>
            <div className="text-text-muted text-xs">{roleMap[currentUser.role]}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
