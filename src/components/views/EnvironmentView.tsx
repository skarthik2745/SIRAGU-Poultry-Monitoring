import React from 'react';
import { PoultryState } from '../../services/iotDataService';
import { SensorGauge } from '../common/SensorGauge';
import {
  Thermometer,
  Droplets,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Fan,
  Sliders,
  ShieldCheck,
  Flame
} from 'lucide-react';

interface EnvironmentViewProps {
  state: PoultryState;
  onNavigateTab: (tab: string) => void;
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({
  state,
  onNavigateTab,
}) => {
  const { dht11, mq2, settings } = state;

  // Compute composite environmental rating
  const isCritical = dht11.tempStatus === 'CRITICAL' || mq2.status === 'CRITICAL';
  const isWarning = dht11.tempStatus === 'WARNING' || dht11.humidityStatus === 'WARNING' || mq2.status === 'WARNING';

  let envStatusLabel = '🟢 GOOD ENVIRONMENT';
  let envBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let envDescription = 'All microclimatic factors conform to farm configured target comfort guidelines.';

  if (isCritical) {
    envStatusLabel = '🚨 HAZARDOUS CLIMATIC PROFILE';
    envBadgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
    envDescription = 'Immediate thermal or chemical hazard detected. Autonomous safeguards engaged.';
  } else if (isWarning) {
    envStatusLabel = '⚠️ ELEVATED ENVIRONMENTAL RISK';
    envBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    envDescription = 'One or more microclimatic indicators deviate from nominal farm thresholds.';
  }

  // Dynamic agronomic recommendations
  const recommendations: string[] = [];
  if (dht11.temperature > settings.tempWarningThreshold) {
    recommendations.push(
      `Temperature is currently elevated (${dht11.temperature}°C). Increase dual exhaust fan speed or trigger evaporative cooling pads if heat persists.`
    );
  } else if (dht11.temperature < 21.0) {
    recommendations.push(
      `Temperature is near lower comfort boundary (${dht11.temperature}°C). Reduce sidewall inlet draft and inspect radiant brooder heaters.`
    );
  } else {
    recommendations.push(
      `Ambient temperature (${dht11.temperature}°C) is balanced within target broiler comfort curve (20°C–32°C).`
    );
  }

  if (dht11.humidity > settings.humMaxThreshold) {
    recommendations.push(
      `Relative humidity is high (${dht11.humidity}%). High moisture increases litter wetness and ammonia volatilization. Accelerate air extraction.`
    );
  } else if (dht11.humidity < settings.humMinThreshold) {
    recommendations.push(
      `Relative humidity is low (${dht11.humidity}%). Dry air may increase airborne dust; inspect misting nozzles.`
    );
  }

  if (mq2.gasPpm > settings.gasWarningThreshold) {
    recommendations.push(
      `Ammonia / hazardous gas concentration is elevated (${mq2.gasPpm} ppm). Verify litter dryness, remove caked bedding, and verify ventilation baffles.`
    );
  } else {
    recommendations.push(
      `Air quality is pristine (${mq2.gasPpm} ppm). Ammonia buildup is minimal; cross-ventilation is optimal.`
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Status Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              MICROCLIMATE MANAGEMENT
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${envBadgeClass}`}>
              {envStatusLabel}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Poultry Shed Microclimate Diagnostics
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">{envDescription}</p>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Adjust Configured Thresholds</span>
        </button>
      </div>

      {/* 3 Large Industrial Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Temperature Gauge */}
        <SensorGauge
          label="Ambient Temperature"
          value={dht11.temperature}
          unit="°C"
          min={10}
          max={45}
          safeMin={20}
          safeMax={settings.tempWarningThreshold}
          status={dht11.tempStatus}
          subtitle="Broiler Shed #04 Sensor Array"
        />

        {/* Humidity Gauge */}
        <SensorGauge
          label="Relative Humidity"
          value={dht11.humidity}
          unit="%"
          min={20}
          max={100}
          safeMin={settings.humMinThreshold}
          safeMax={settings.humMaxThreshold}
          status={dht11.humidityStatus}
          subtitle="Moisture Index / Dewpoint Ratio"
        />

        {/* Gas Level Gauge */}
        <SensorGauge
          label="MQ-2 Gas / Ammonia (NH3)"
          value={mq2.gasPpm}
          unit="ppm"
          min={50}
          max={700}
          safeMin={50}
          safeMax={settings.gasWarningThreshold}
          status={mq2.status}
          subtitle="Air Purity & Chemical Volatilization"
        />
      </div>

      {/* Dynamic Recommendations & Safe Range Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recommendations Panel */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Agronomic Environmental Recommendations
              </h3>
              <span className="text-[11px] text-slate-400">
                Calculated in real-time from active sensor telemetry and farm thresholds
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-3"
              >
                <div className="p-1 rounded bg-cyan-500/20 text-cyan-300 mt-0.5 shrink-0 font-mono text-[10px] font-bold">
                  REC-{i + 1}
                </div>
                <p className="leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 italic">
            * Note: These recommendations reflect the farm administrator’s configured thresholds and provide automated operational guidance rather than universal veterinary prescriptions.
          </div>
        </div>

        {/* Threshold Reference Card */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              Configured Threshold Limits
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current operational boundaries configured in farm settings.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Temp Warning Limit:</span>
                <span className="font-mono text-amber-400 font-bold">{settings.tempWarningThreshold}°C</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Temp Critical Limit:</span>
                <span className="font-mono text-rose-400 font-bold">{settings.tempCriticalThreshold}°C</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Humidity Range:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {settings.humMinThreshold}% – {settings.humMaxThreshold}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Gas Warning Limit:</span>
                <span className="font-mono text-amber-400 font-bold">{settings.gasWarningThreshold} ppm</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Gas Critical Limit:</span>
                <span className="font-mono text-rose-400 font-bold">{settings.gasCriticalThreshold} ppm</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('settings')}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all text-center"
          >
            Reconfigure in Settings
          </button>
        </div>
      </div>
    </div>
  );
};
