import React from 'react';
import { DemoScenario } from '../../types/poultry';
import { iotDataService } from '../../services/iotDataService';
import {
  Play,
  RotateCcw,
  Flame,
  Wind,
  Thermometer,
  ShieldAlert,
  RotateCw,
  Activity,
  CheckCircle2,
  Sliders,
  Wrench
} from 'lucide-react';

interface DemoBarProps {
  activeScenario: DemoScenario;
}

export const DemoBar: React.FC<DemoBarProps> = ({ activeScenario }) => {
  const scenarios: { id: DemoScenario; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'NORMAL', label: 'Normal Operation', icon: CheckCircle2, color: 'hover:border-emerald-500 text-emerald-400' },
    { id: 'HIGH_TEMP', label: 'Simulate High Temp', icon: Thermometer, color: 'hover:border-amber-500 text-amber-400' },
    { id: 'HIGH_GAS', label: 'Simulate Gas Leak', icon: Wind, color: 'hover:border-amber-500 text-amber-400' },
    { id: 'INTRUSION', label: 'Simulate Intrusion', icon: ShieldAlert, color: 'hover:border-rose-500 text-rose-400' },
    { id: 'FIRE', label: 'SIMULATE FIRE', icon: Flame, color: 'hover:border-rose-500 text-rose-400' },
    { id: 'FEEDER', label: 'Trigger Feeder', icon: RotateCw, color: 'hover:border-cyan-500 text-cyan-400' },
    { id: 'ABNORMAL_INACTIVITY', label: 'Flock Inactivity', icon: Activity, color: 'hover:border-amber-500 text-amber-400' },
    { id: 'SENSOR_FAULT', label: 'Simulate Sensor Fault', icon: Wrench, color: 'hover:border-purple-500 text-purple-400' },
  ];

  return (
    <div className="bg-[#0b101b] border-b border-cyan-500/20 py-2 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Title */}
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white tracking-wider uppercase text-[11px]">
            HACKATHON DEMO CONTROL:
          </span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Instantly test system reactions & Digital Twin twin-state
          </span>
        </div>

        {/* Buttons List */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => iotDataService.triggerScenario(sc.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400'
                    : `bg-slate-900/90 border-slate-800 ${sc.color} hover:bg-slate-800`
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{sc.label}</span>
              </button>
            );
          })}

          {/* Reset System Button */}
          <button
            onClick={() => iotDataService.resetToNormal()}
            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET SYSTEM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
