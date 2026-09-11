import React, { useState } from 'react';
import { PoultryState } from '../../services/iotDataService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Sparkles,
  Thermometer,
  Wind,
  Droplets,
  RotateCw,
  Bell,
  Activity,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface AnalyticsViewProps {
  state: PoultryState;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ state }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Simulated historical datasets based on timeRange
  const getChartData = () => {
    if (timeRange === '24h') {
      return [
        { time: '00:00', temp: 24.2, hum: 72, gas: 210, activity: 22, feedKg: 0 },
        { time: '03:00', temp: 23.8, hum: 74, gas: 215, activity: 18, feedKg: 0 },
        { time: '06:00', temp: 25.1, hum: 70, gas: 235, activity: 68, feedKg: 4.5 },
        { time: '09:00', temp: 27.6, hum: 66, gas: 250, activity: 79, feedKg: 0 },
        { time: '12:00', temp: 29.8, hum: 62, gas: 265, activity: 84, feedKg: 3.5 },
        { time: '15:00', temp: 28.9, hum: 64, gas: 255, activity: 76, feedKg: 0 },
        { time: '18:00', temp: 27.4, hum: 67, gas: 245, activity: 72, feedKg: 4.5 },
        { time: '21:00', temp: 26.0, hum: 69, gas: 230, activity: 45, feedKg: 0 },
      ];
    } else if (timeRange === '7d') {
      return [
        { time: 'Mon', temp: 27.2, hum: 65, gas: 240, activity: 74, feedKg: 12.5 },
        { time: 'Tue', temp: 28.1, hum: 67, gas: 248, activity: 76, feedKg: 12.5 },
        { time: 'Wed', temp: 29.4, hum: 63, gas: 260, activity: 78, feedKg: 13.0 },
        { time: 'Thu', temp: 27.8, hum: 68, gas: 242, activity: 73, feedKg: 12.5 },
        { time: 'Fri', temp: 28.5, hum: 66, gas: 252, activity: 75, feedKg: 12.5 },
        { time: 'Sat', temp: 27.9, hum: 67, gas: 245, activity: 77, feedKg: 13.0 },
        { time: 'Sun', temp: 28.4, hum: 67, gas: 245, activity: 74, feedKg: 12.5 },
      ];
    } else {
      return [
        { time: 'Week 1', temp: 26.8, hum: 68, gas: 235, activity: 72, feedKg: 85.0 },
        { time: 'Week 2', temp: 27.5, hum: 66, gas: 242, activity: 74, feedKg: 88.0 },
        { time: 'Week 3', temp: 28.2, hum: 65, gas: 250, activity: 76, feedKg: 91.0 },
        { time: 'Week 4', temp: 28.4, hum: 67, gas: 245, activity: 75, feedKg: 90.0 },
      ];
    }
  };

  const data = getChartData();

  // Summary Metrics calculations
  const avgTemp = (data.reduce((acc, d) => acc + d.temp, 0) / data.length).toFixed(1);
  const maxTemp = Math.max(...data.map((d) => d.temp)).toFixed(1);
  const minTemp = Math.min(...data.map((d) => d.temp)).toFixed(1);
  const avgHum = Math.round(data.reduce((acc, d) => acc + d.hum, 0) / data.length);
  const maxGas = Math.max(...data.map((d) => d.gas));
  const totalFeed = data.reduce((acc, d) => acc + d.feedKg, 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Title Banner & Time Filter */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              HISTORICAL TELEMETRY
            </span>
            <span className="text-xs text-slate-400">Longitudinal Trend Analysis</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Poultry Farm Analytics & Agronomic Reporting
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Retrospective data modeling across microclimate stability, ration consumption efficiency, and flock behavioral patterns.
          </p>
        </div>

        {/* Time filters */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === range
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Average Temp</span>
          <div className="text-xl font-black text-cyan-400 mt-1">{avgTemp}°C</div>
          <span className="text-[10px] text-slate-500">Target: 26–29°C</span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Max Temp</span>
          <div className="text-xl font-black text-amber-400 mt-1">{maxTemp}°C</div>
          <span className="text-[10px] text-slate-500">Peak thermal spike</span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Min Temp</span>
          <div className="text-xl font-black text-cyan-300 mt-1">{minTemp}°C</div>
          <span className="text-[10px] text-slate-500">Overnight baseline</span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Average Humidity</span>
          <div className="text-xl font-black text-cyan-200 mt-1">{avgHum}%</div>
          <span className="text-[10px] text-slate-500">Optimum: 50–70%</span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Max Gas (NH3)</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{maxGas} ppm</div>
          <span className="text-[10px] text-slate-500">Safe: &lt; 350 ppm</span>
        </div>

        <div className="p-3.5 rounded-xl glass-panel border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Total Feed Dispensed</span>
          <div className="text-xl font-black text-white mt-1">{totalFeed} kg</div>
          <span className="text-[10px] text-slate-500">{timeRange} consumption</span>
        </div>
      </div>

      {/* AI Generated Longitudinal Insight Card */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/25 bg-gradient-to-r from-slate-900/90 to-cyan-950/25 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              AI Agronomic Longitudinal Digest
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Confidence: 97.4%</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            &ldquo;Environmental conditions remained stable during the selected {timeRange === '24h' ? '24-hour' : timeRange === '7d' ? '7-day' : '30-day'} interval. The diurnal microclimate profile showed acceptable night-to-day variance (±{Math.abs(Number(maxTemp) - Number(minTemp)).toFixed(1)}°C). Ammonia retention index stayed well beneath the critical 350 ppm threshold. Feed-to-activity correlation confirms vigorous flock appetite.&rdquo;
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Climate Dynamics: Temp & Humidity */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase">Temperature & Humidity Correlation</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Dual-Axis Curve</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis yAxisId="left" stroke="#06b6d4" domain={[15, 38]} fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" domain={[40, 90]} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#06b6d4" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="hum" name="Humidity (%)" stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gas Level & Activity Trend */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase">Gas ppm & Poultry Activity Index</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Ventilation Efficiency</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="gasAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" domain={[0, 400]} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="gas" name="Ammonia Gas (ppm)" stroke="#10b981" fillOpacity={1} fill="url(#gasAreaGrad)" />
                <Line type="monotone" dataKey="activity" name="Activity Score (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ration Consumption Distribution */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase">Feed Distribution Log (kg Delivered)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Servo Actuator Delivery</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Bar dataKey="feedKg" name="Feed Dispensed (kg)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
