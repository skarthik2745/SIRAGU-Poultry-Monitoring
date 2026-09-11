import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PoultryState } from '../../services/iotDataService';
import {
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  RotateCw,
  Activity,
  Radio,
  Clock,
  Database
} from 'lucide-react';

interface LiveMonitoringViewProps {
  state: PoultryState;
  onSelectSensor: (sensorId: string) => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  state,
  onSelectSensor,
}) => {
  const { dht11, mq2, flame, ir, feeder, poultryActivity, telemetryHistory, esp32 } = state;

  return (
    <div className="space-y-6">
      {/* Header with Demo Data indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              TELEMETRY STREAM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              DEMO DATA / SIMULATED HARDWARE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Live Sensor Telemetry Monitor</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous real-time edge telemetry updating every 2 seconds with simulated random-walk physical dynamics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>ESP32: {esp32.ip}</span>
          </div>
        </div>
      </div>

      {/* Large Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* DHT11 Card */}
        <div
          onClick={() => onSelectSensor('dht11')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">DHT11 Climate Sensor</h3>
                  <span className="text-[11px] text-slate-400">GPIO 4 • Digital Bus</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                dht11.tempStatus === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {dht11.tempStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Temperature</span>
                <div className="text-2xl font-black text-cyan-300 mt-0.5">
                  {dht11.temperature.toFixed(1)}°C
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Relative Humidity</span>
                <div className="text-2xl font-black text-cyan-200 mt-0.5">
                  {dht11.humidity}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Safe: 20–32°C / 50–75% RH</span>
            <span>{dht11.lastUpdated}</span>
          </div>
        </div>

        {/* MQ-2 Gas Card */}
        <div
          onClick={() => onSelectSensor('mq2')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">MQ-2 Gas / Ammonia</h3>
                  <span className="text-[11px] text-slate-400">Analog Ch 0 • NH3 / CO / Smoke</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                mq2.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : mq2.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {mq2.status}
              </span>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Gas Concentration</span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {mq2.gasPpm} <span className="text-xs font-normal text-slate-400">ppm</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    mq2.gasPpm > 450 ? 'bg-rose-500' : mq2.gasPpm > 350 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (mq2.gasPpm / 600) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Safe Threshold: &lt; 350 ppm</span>
            <span>{mq2.lastUpdated}</span>
          </div>
        </div>

        {/* Flame Sensor Card */}
        <div
          onClick={() => onSelectSensor('flame')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Flame Detection Sensor</h3>
                  <span className="text-[11px] text-slate-400">GPIO 18 • Infrared 760-1100nm</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                flame.detected ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {flame.status}
              </span>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Hazard Condition</span>
              <div className="text-xl font-bold mt-1">
                {flame.detected ? (
                  <span className="text-rose-500 flex items-center gap-1.5">
                    <Flame className="w-5 h-5 animate-bounce" /> ACTIVE FLAME DETECTED
                  </span>
                ) : (
                  <span className="text-emerald-400">NO FLAME DETECTED</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Analog Voltage: {flame.rawVoltage.toFixed(2)} V</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Response: &lt; 15μs</span>
            <span>{flame.lastUpdated}</span>
          </div>
        </div>

        {/* IR Intrusion Card */}
        <div
          onClick={() => onSelectSensor('ir')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">IR Intrusion Barrier</h3>
                  <span className="text-[11px] text-slate-400">GPIO 19 • Dual Beam Photoelectric</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                ir.intrusionDetected ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {ir.status}
              </span>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Boundary State</span>
              <div className="text-xl font-bold mt-1">
                {ir.intrusionDetected ? (
                  <span className="text-rose-500">BREACH DETECTED</span>
                ) : (
                  <span className="text-emerald-400">NO INTRUSION</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Zone: {ir.zone}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Perimeter: 15m optical link</span>
            <span>{ir.lastUpdated}</span>
          </div>
        </div>

        {/* Servo Feeder Card */}
        <div
          onClick={() => onSelectSensor('servo')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Servo Feeder Actuator</h3>
                  <span className="text-[11px] text-slate-400">GPIO 13 • PWM Controller</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                feeder.status === 'DISPENSING' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {feeder.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Servo Angle</span>
                <div className="text-2xl font-black text-cyan-300 mt-0.5">{feeder.servoAngle}°</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Hopper Level</span>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">{feeder.hopperLevel}%</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Mode: {feeder.mode}</span>
            <span>Last: {feeder.lastFeedingTime}</span>
          </div>
        </div>

        {/* Poultry Activity Card */}
        <div
          onClick={() => onSelectSensor('camera')}
          className="p-5 rounded-2xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Poultry Activity & Vision</h3>
                  <span className="text-[11px] text-slate-400">ESP32-CAM • Optical Flow</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {poultryActivity.status}
              </span>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400">Movement Index</span>
              <div className="text-2xl font-black text-emerald-300 mt-0.5">
                {poultryActivity.movementIndex}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Detected Flock: {poultryActivity.birdsDetected} broilers • Uniform dispersion
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Distribution: {poultryActivity.flockDistribution}</span>
            <span>{poultryActivity.lastAssessed}</span>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Charts (4-grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Real-Time Telemetry Time-Series (Continuous Stream)
          </h2>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
            DEMO DATA • Live Physics Simulation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Temperature Chart */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase">Temperature vs Time (°C)</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{dht11.temperature}°C</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[18, 42]} stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="temperature" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-bold text-white uppercase">Humidity vs Time (% RH)</span>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">{dht11.humidity}%</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <defs>
                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[40, 90]} stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#humGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gas Level Chart */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase">Gas Level (MQ-2) vs Time (ppm)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">{mq2.gasPpm} ppm</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <defs>
                    <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[150, 650]} stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="gasPpm" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gasGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Poultry Activity Chart */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase">Flock Activity Index vs Time (%)</span>
              </div>
              <span className="text-xs font-mono text-teal-400 font-bold">{poultryActivity.movementIndex}%</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="activityIndex" stroke="#2dd4bf" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
