import React from 'react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import { SensorCard } from '../common/SensorCard';
import { RealDigitalTwin3D } from '../digitaltwin/RealDigitalTwin3D';
import { DigitalTwinLegend } from '../digitaltwin/DigitalTwinLegend';
import {
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  RotateCw,
  Activity,
  Heart,
  Droplets,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface OverviewViewProps {
  state: PoultryState;
  onNavigateTab: (tab: string) => void;
  onSelectSensor: (sensorId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  onNavigateTab,
  onSelectSensor,
}) => {
  const { dht11, mq2, flame, ir, feeder, poultryActivity, overallFarmHealth, alerts, aiInsight } = state;

  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Health Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/25 bg-gradient-to-r from-[#09121f] via-[#0d1c2d] to-[#07101a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400">Unit: Broiler Shed #04</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
            Poultry Farm Automated Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time multi-sensor telemetry, synchronized digital twin representation, automated feeder cycling, and active computer vision poultry health tracking.
          </p>
        </div>

        {/* Global Health Gauge Pill */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 min-w-[200px]">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="none" />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke={overallFarmHealth > 85 ? '#10b981' : overallFarmHealth > 60 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - overallFarmHealth / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-xs font-black text-white">{overallFarmHealth}%</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Farm Health</span>
            <div className="text-sm font-bold text-white">
              {overallFarmHealth > 85 ? 'OPTIMAL' : overallFarmHealth > 60 ? 'DEGRADED' : 'CRITICAL'}
            </div>
          </div>
        </div>
      </div>

      {/* 8 Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Temperature */}
        <SensorCard
          title="Temperature"
          value={dht11.temperature.toFixed(1)}
          unit="°C"
          status={dht11.tempStatus}
          trend={`${dht11.tempTrend >= 0 ? '+' : ''}${dht11.tempTrend}°C`}
          trendDirection={dht11.tempTrend > 0 ? 'up' : dht11.tempTrend < 0 ? 'down' : 'neutral'}
          lastUpdated={dht11.lastUpdated}
          icon={Thermometer}
          accentColor={dht11.tempStatus === 'CRITICAL' ? 'rose' : dht11.tempStatus === 'WARNING' ? 'amber' : 'cyan'}
          onClick={() => onSelectSensor('dht11')}
        />

        {/* Humidity */}
        <SensorCard
          title="Humidity"
          value={dht11.humidity}
          unit="%"
          status={dht11.humidityStatus}
          lastUpdated={dht11.lastUpdated}
          icon={Droplets}
          accentColor="cyan"
          onClick={() => onSelectSensor('dht11')}
        />

        {/* Gas Level */}
        <SensorCard
          title="Gas Level (MQ-2)"
          value={mq2.gasPpm}
          unit="ppm"
          status={mq2.status}
          trend={`${mq2.trend >= 0 ? '+' : ''}${mq2.trend} ppm`}
          trendDirection={mq2.trend > 0 ? 'up' : mq2.trend < 0 ? 'down' : 'neutral'}
          lastUpdated={mq2.lastUpdated}
          icon={Wind}
          accentColor={mq2.status === 'CRITICAL' ? 'rose' : mq2.status === 'WARNING' ? 'amber' : 'emerald'}
          onClick={() => onSelectSensor('mq2')}
        />

        {/* Flame Status */}
        <SensorCard
          title="Flame Detection"
          value={flame.detected ? 'DETECTED' : 'NOT DETECTED'}
          status={flame.status}
          lastUpdated={flame.lastUpdated}
          icon={Flame}
          accentColor={flame.detected ? 'rose' : 'emerald'}
          onClick={() => onSelectSensor('flame')}
        />

        {/* Intrusion Status */}
        <SensorCard
          title="Intrusion (IR)"
          value={ir.intrusionDetected ? 'BREACH DETECTED' : 'NO INTRUSION'}
          status={ir.status}
          lastUpdated={ir.lastUpdated}
          icon={ShieldAlert}
          accentColor={ir.intrusionDetected ? 'rose' : 'emerald'}
          onClick={() => onSelectSensor('ir')}
        />

        {/* Feeder Status */}
        <SensorCard
          title="Feeder Status"
          value={feeder.status}
          unit={`(Servo: ${feeder.servoAngle}°)`}
          status={feeder.status === 'DISPENSING' ? 'DISPENSING' : 'READY'}
          trend={`Hopper: ${feeder.hopperLevel}%`}
          lastUpdated={feeder.lastFeedingTime}
          icon={RotateCw}
          accentColor="cyan"
          onClick={() => onSelectSensor('servo')}
        />

        {/* Poultry Activity */}
        <SensorCard
          title="Poultry Activity"
          value={`${poultryActivity.movementIndex}%`}
          status={poultryActivity.status}
          trend={`${poultryActivity.birdsDetected} birds`}
          lastUpdated={poultryActivity.lastAssessed}
          icon={Activity}
          accentColor={poultryActivity.status === 'ABNORMAL_INACTIVE' ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('ai_health')}
        />

        {/* Farm Health */}
        <SensorCard
          title="Overall Farm Health"
          value={`${overallFarmHealth}%`}
          status={overallFarmHealth > 85 ? 'HEALTHY' : overallFarmHealth > 60 ? 'ATTENTION' : 'HAZARD'}
          lastUpdated="Real-time"
          icon={Heart}
          accentColor={overallFarmHealth > 85 ? 'emerald' : overallFarmHealth > 60 ? 'amber' : 'rose'}
          onClick={() => onNavigateTab('system_status')}
        />
      </div>

      {/* Hero Live Digital Twin Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white tracking-wide">LIVE DIGITAL TWIN</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 text-[10px] font-mono border border-cyan-500/30">
              Interactive 2.5D Shed Simulator
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('digital_twin')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all"
          >
            <span>Full Digital Twin View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Digital Twin 3D View */}
        <RealDigitalTwin3D state={state} onSelectSensor={onSelectSensor} />
        <DigitalTwinLegend state={state} />
      </div>

      {/* Two Column Section: Active Alerts & AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Alerts Panel */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Active Alerts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                  {activeAlerts.length}
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View Alert Center</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">🟢 No critical alerts</div>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    All environmental sensors, boundary perimeters, and actuators are functioning within nominal safety parameters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      alert.type === 'CRITICAL'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{alert.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">{alert.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Sensor: {alert.sensor} • {alert.timestamp}</span>
                    </div>
                    <button
                      onClick={() => iotDataService.acknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] border border-slate-700 shrink-0"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">AI Insight & Advisory</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-slate-200 text-xs leading-relaxed space-y-2">
              <p className="font-medium text-cyan-300">
                &ldquo;{aiInsight}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Model: Agronomic Biosecurity LLM v1.4</span>
                <span className="text-emerald-400 font-mono">Inference: 32ms</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Poultry welfare evaluation refreshed continuously</span>
            <button
              onClick={() => onNavigateTab('ai_health')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Explore AI Vision Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
