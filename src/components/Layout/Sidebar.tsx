import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FileSearch,
  Sliders,
  FileBarChart,
  PanelLeft,
  PanelLeftClose,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '风险总览', end: true },
  { path: '/alerts', icon: AlertTriangle, label: '预警列表' },
  { path: '/cases/:id', icon: FileSearch, label: '案件详情', hidden: true },
  { path: '/strategy', icon: Sliders, label: '策略调参' },
  { path: '/reports', icon: FileBarChart, label: '报表中心' },
  { path: '/audit', icon: ClipboardList, label: '审计中心' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside
      className={`h-screen bg-bg-secondary border-r border-border-primary flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-primary">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-bg-primary" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <div className="text-sm font-bold text-text-primary">风控中心</div>
              <div className="text-[10px] text-text-muted">Risk Control</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.filter(item => !item.hidden).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onMouseEnter={() => setHovered(item.path)}
            onMouseLeave={() => setHovered(null)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border-l-2 border-transparent'
              }`
            }
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${hovered === item.path ? 'text-accent-primary' : ''}`} />
            {!sidebarCollapsed && <span className="animate-fade-in whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border-primary">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          {!sidebarCollapsed && <span className="text-xs">收起侧边栏</span>}
        </button>
      </div>
    </aside>
  );
}
