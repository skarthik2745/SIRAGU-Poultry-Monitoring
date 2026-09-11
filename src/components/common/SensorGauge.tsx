import React from 'react';

interface SensorGaugeProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  safeMin?: number;
  safeMax?: number;
  warningMax?: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SAFE';
  subtitle?: string;
}

export const SensorGauge: React.FC<SensorGaugeProps> = ({
  label,
  value,
  unit,
  min,
  max,
  safeMin,
  safeMax,
  warningMax,
  status,
  subtitle,
}) => {
  // Normalize value percentage (0 to 1)
  const clamped = Math.max(min, Math.min(max, value));
  const percent = (clamped - min) / (max - min);

  // Arc calculation for SVG half circle (180 degrees)
  const radius = 65;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Half circumference
  const strokeDashoffset = circumference * (1 - percent);

  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
        return '#f43f5e';
      case 'WARNING':
        return '#f59e0b';
      case 'NORMAL':
      case 'SAFE':
      default:
        return '#10b981';
    }
  };

  return (
    <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-between text-center relative overflow-hidden">
      {/* Top Label */}
      <div className="w-full flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-slate-300 uppercase tracking-wider">{label}</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
          style={{
            color: getStatusColor(),
            borderColor: `${getStatusColor()}40`,
            backgroundColor: `${getStatusColor()}15`,
          }}
        >
          {status}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-44 h-28 flex items-center justify-center mt-2">
        <svg className="w-44 h-28 overflow-visible" viewBox="0 0 160 90">
          {/* Background Track */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={getStatusColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Metric Text */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-white tracking-tight">{value}</span>
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          </div>
          {subtitle && <span className="text-[10px] text-slate-400 mt-0.5">{subtitle}</span>}
        </div>
      </div>

      {/* Threshold Legend Bar */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Min: {min}{unit}</span>
        {safeMin !== undefined && safeMax !== undefined && (
          <span className="text-emerald-400 font-medium">Safe: {safeMin}–{safeMax}{unit}</span>
        )}
        <span>Max: {max}{unit}</span>
      </div>
    </div>
  );
};
