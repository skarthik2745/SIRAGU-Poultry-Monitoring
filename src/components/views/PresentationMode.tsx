import React from 'react';
import { PoultryState } from '../../services/iotDataService';
import { RealDigitalTwin3D } from '../digitaltwin/RealDigitalTwin3D';
import { DigitalTwinLegend } from '../digitaltwin/DigitalTwinLegend';
import { DemoBar } from '../layout/DemoBar';
import {
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  RotateCw,
  Activity,
  Droplets,
  Tv,
  X,
  Sparkles
} from 'lucide-react';

interface PresentationModeProps {
  state: PoultryState;
  onClose: () => void;
  onSelectSensor: (sensorId: string) => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  state,
  onClose,
  onSelectSensor,
}) => {
  const { dht11, mq2, flame, ir, feeder, poultryActivity, activeScenario } = state;

  return (
    <div className="fixed inset-0 z-50 bg-[#05080e] text-slate-100 flex flex-col overflow-y-auto">
      {/* Presentation Header */}
      <div className="bg-[#080d17]/95 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30">
            PG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">POULTRYGUARD AI</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono font-bold">
                STAGE PRESENTATION MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your Poultry Farm. Digitally Twinned.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow"
        >
          <X className="w-4 h-4" />
          <span>Exit Stage Mode</span>
        </button>
      </div>

      {/* Quick Demo Scenario Bar for Pitch Judges */}
      <DemoBar activeScenario={activeScenario} />

      {/* Primary Presentation View */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 flex flex-col justify-between">
        {/* Top 7 High-Contrast Vitals Overviews */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Temperature */}
          <div className="p-3 rounded-xl glass-panel border border-cyan-500/30 flex items-center gap-2.5">
            <Thermometer className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Temp</span>
              <span className="text-base font-black text-cyan-300">{dht11.temperature}°C</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-xl glass-panel border border-cyan-500/30 flex items-center gap-2.5">
            <Droplets className="w-5 h-5 text-cyan-300 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Humidity</span>
              <span className="text-base font-black text-white">{dht11.humidity}%</span>
            </div>
          </div>

          {/* Gas */}
          <div className="p-3 rounded-xl glass-panel border border-emerald-500/30 flex items-center gap-2.5">
            <Wind className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gas (MQ-2)</span>
              <span className="text-base font-black text-emerald-300">{mq2.gasPpm} ppm</span>
            </div>
          </div>

          {/* Fire */}
          <div className={`p-3 rounded-xl glass-panel border flex items-center gap-2.5 ${
            flame.detected ? 'border-rose-500 bg-rose-950/40 text-rose-300' : 'border-slate-800'
          }`}>
            <Flame className={`w-5 h-5 ${flame.detected ? 'text-rose-400 animate-bounce' : 'text-emerald-400'} shrink-0`} />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fire</span>
              <span className="text-xs font-black">{flame.detected ? 'DETECTED' : 'SAFE'}</span>
            </div>
          </div>

          {/* Intrusion */}
          <div className={`p-3 rounded-xl glass-panel border flex items-center gap-2.5 ${
            ir.intrusionDetected ? 'border-rose-500 bg-rose-950/40 text-rose-300' : 'border-slate-800'
          }`}>
            <ShieldAlert className={`w-5 h-5 ${ir.intrusionDetected ? 'text-rose-400 animate-pulse' : 'text-emerald-400'} shrink-0`} />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Intrusion</span>
              <span className="text-xs font-black">{ir.intrusionDetected ? 'BREACH' : 'SECURE'}</span>
            </div>
          </div>

          {/* Feeder */}
          <div className="p-3 rounded-xl glass-panel border border-cyan-500/30 flex items-center gap-2.5">
            <RotateCw className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Feeder</span>
              <span className="text-xs font-black text-white">{feeder.status}</span>
            </div>
          </div>

          {/* Activity */}
          <div className="p-3 rounded-xl glass-panel border border-emerald-500/30 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Activity</span>
              <span className="text-xs font-black text-emerald-400">{poultryActivity.movementIndex}%</span>
            </div>
          </div>
        </div>

        {/* Hero Full-Size 3D Digital Twin */}
        <div className="flex-1 flex flex-col justify-center space-y-3 min-h-[460px]">
          <RealDigitalTwin3D state={state} onSelectSensor={onSelectSensor} />
          <DigitalTwinLegend state={state} />
        </div>
      </div>
    </div>
  );
};
