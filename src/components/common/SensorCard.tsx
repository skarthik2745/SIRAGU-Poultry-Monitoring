import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: string;
  trend?: string | number;
  trendDirection?: 'up' | 'down' | 'neutral';
  lastUpdated: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  status,
  trend,
  trendDirection,
  lastUpdated,
  icon: Icon,
  accentColor = 'cyan',
  onClick,
}) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'NORMAL':
      case 'SAFE':
      case 'SECURE':
      case 'READY':
      case 'CLOSED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'WARNING':
      case 'OPEN':
      case 'DISPENSING':
      case 'LOW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CRITICAL':
      case 'DETECTED':
      case 'BREACH':
      case 'ABNORMAL_INACTIVE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getAccentBorder = () => {
    switch (accentColor) {
      case 'emerald':
        return 'border-emerald-500/20 hover:border-emerald-500/40';
      case 'amber':
        return 'border-amber-500/20 hover:border-amber-500/40';
      case 'rose':
        return 'border-rose-500/30 hover:border-rose-500/50';
      case 'cyan':
      default:
        return 'border-cyan-500/20 hover:border-cyan-500/40';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl glass-panel glass-panel-hover border ${getAccentBorder()} cursor-pointer transition-all flex flex-col justify-between`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">{title}</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusStyle()}`}
          >
            {status}
          </span>
        </div>

        {/* Value Display */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white tracking-tight">{value}</span>
          {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
        </div>
      </div>

      {/* Footer / Trend & Timestamp */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          {trend !== undefined && (
            <span className="flex items-center gap-0.5 text-xs font-medium">
              {trendDirection === 'up' ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              ) : trendDirection === 'down' ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span
                className={
                  trendDirection === 'up'
                    ? 'text-amber-400'
                    : trendDirection === 'down'
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }
              >
                {trend}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};
