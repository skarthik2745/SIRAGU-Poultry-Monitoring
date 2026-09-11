import React from 'react';
import { PoultryState } from '../../services/iotDataService';
import {
  Activity,
  Wind,
  Droplets,
  Fan,
  Thermometer,
  Lightbulb,
  Database,
  Trash2,
  Tv,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DigitalTwinLegendProps {
  state: PoultryState;
}

export const DigitalTwinLegend: React.FC<DigitalTwinLegendProps> = ({ state }) => {
  const { dht11, mq2, flame, ir, feeder, esp32 } = state;

  // Key Components matching the reference image list:
  // Chickens / Birds, Feeders, Water Drinkers, Ventilation Fans, Temp & Humidity, Lighting, Feed Storage Silos, Water Tank, Control Room, Waste Management
  const components = [
    {
      name: 'Chickens / Birds',
      icon: Activity,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      badge: 'Active Broilers (24)',
    },
    {
      name: 'Feeders',
      icon: Database,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      badge: feeder.status === 'DISPENSING' ? 'Dispensing' : 'Suspended Pans (OK)',
    },
    {
      name: 'Water Drinkers',
      icon: Droplets,
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      badge: 'Nipple Lines Flowing',
    },
    {
      name: 'Ventilation Fans',
      icon: Fan,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      badge: 'Tunnel Exhaust (2x)',
    },
    {
      name: 'Temp & Humidity',
      icon: Thermometer,
      color: dht11.tempStatus === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40',
      badge: `${dht11.temperature}°C / ${dht11.humidity}%`,
    },
    {
      name: 'Lighting',
      icon: Lightbulb,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      badge: 'Warm Photoperiod (16h)',
    },
    {
      name: 'Feed Storage Silos',
      icon: Database,
      color: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
      badge: '2x Bulk Silos (85%)',
    },
    {
      name: 'Water Tank',
      icon: Droplets,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      badge: '5000L Blue Tank (92%)',
    },
    {
      name: 'Control Room',
      icon: Tv,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      badge: state.isHardwareConnected ? 'ESP32 Online' : 'Simulation Gateway',
    },
    {
      name: 'Waste Management',
      icon: Trash2,
      color: 'bg-green-500/20 text-green-400 border-green-500/40',
      badge: 'Compost Pit Optimal',
    },
  ];

  return (
    <div className="p-4 rounded-xl glass-panel border border-slate-800 bg-slate-900/90 text-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-white text-xs">
            Key Farm Components & Synchronized Edge Subsystems
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Architecture: <strong className="text-emerald-400">PoultryTwin Farm Standard</strong>
        </span>
      </div>

      {/* Grid of Key Components matching image */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {components.map((c) => {
          const IconComponent = c.icon;
          return (
            <div
              key={c.name}
              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 transition-all hover:border-slate-700"
            >
              <div className={`p-1.5 rounded-md border shrink-0 ${c.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] font-bold text-white block truncate">{c.name}</span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">{c.badge}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
