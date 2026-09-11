import React from 'react';
import { PoultryState } from '../../services/iotDataService';
import { RealDigitalTwin3D } from '../digitaltwin/RealDigitalTwin3D';
import { DigitalTwinLegend } from '../digitaltwin/DigitalTwinLegend';
import {
  Sparkles,
  Info,
  Radio,
  RotateCw,
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  Cpu,
  Layers,
  MapPin
} from 'lucide-react';

interface DigitalTwinViewProps {
  state: PoultryState;
  onSelectSensor: (sensorId: string) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  state,
  onSelectSensor,
}) => {
  const { dht11, mq2, flame, ir, feeder, esp32 } = state;

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              CORE FEATURE
            </span>
            <span className="text-xs text-slate-400">Physical-to-Virtual Real-Time Synchronization</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Poultry Shed Digital Twin Architecture
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            A high-fidelity 2.5D visual twin continuously synchronized with physical ESP32 edge telemetry. Inspect physical sensor nodes, observe live flock distribution, simulate hazards, and trigger actuators directly from the virtual twin.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 font-mono">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>ESP32 UDP Stream: 1.0 Hz</span>
          </div>
        </div>
      </div>

      {/* Main Digital Twin 3D Canvas */}
      <div className="space-y-3">
        <RealDigitalTwin3D state={state} onSelectSensor={onSelectSensor} />
        <DigitalTwinLegend state={state} />
      </div>

      {/* Interactive Sensor Nodes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Physically Positioned Sensor Nodes & Actuators
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any card to inspect technical diagnostics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* DHT11 Climate */}
          <div
            onClick={() => onSelectSensor('dht11')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">DHT11 Climate Node</span>
                <span className="text-xs text-slate-400">Wall Bracket #02</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-cyan-300">
                {dht11.temperature}°C / {dht11.humidity}%
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">{dht11.tempStatus}</span>
            </div>
          </div>

          {/* MQ-2 Gas */}
          <div
            onClick={() => onSelectSensor('mq2')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">MQ-2 Gas / Ammonia</span>
                <span className="text-xs text-slate-400">Truss Height (1.8m)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-300">{mq2.gasPpm} ppm</div>
              <span className="text-[10px] text-emerald-400 font-semibold">{mq2.status}</span>
            </div>
          </div>

          {/* Flame Sensor */}
          <div
            onClick={() => onSelectSensor('flame')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">YG1006 Flame Sensor</span>
                <span className="text-xs text-slate-400">Central Overhead Zone</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-200">
                {flame.detected ? (
                  <span className="text-rose-400 animate-pulse">DETECTED</span>
                ) : (
                  <span className="text-emerald-400">SAFE</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{flame.rawVoltage.toFixed(2)} V</span>
            </div>
          </div>

          {/* IR Perimeter */}
          <div
            onClick={() => onSelectSensor('ir')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">IR Perimeter Barrier</span>
                <span className="text-xs text-slate-400">North Entryway Gate</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-200">
                {ir.intrusionDetected ? (
                  <span className="text-rose-400 animate-pulse">BREACH</span>
                ) : (
                  <span className="text-emerald-400">SECURE</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">Optical Beam Intact</span>
            </div>
          </div>

          {/* Feeder Servo */}
          <div
            onClick={() => onSelectSensor('servo')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Automatic Feeder Hopper</span>
                <span className="text-xs text-slate-400">Zone 3 Dispenser</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-cyan-300">
                {feeder.status === 'DISPENSING' ? 'DISPENSING' : `${feeder.servoAngle}° Angle`}
              </div>
              <span className="text-[10px] text-slate-400">{feeder.hopperLevel}% mash left</span>
            </div>
          </div>

          {/* ESP32 Hub */}
          <div
            onClick={() => onSelectSensor('esp32')}
            className="p-4 rounded-xl glass-panel glass-panel-hover border border-slate-800 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">ESP32 IoT Master Node</span>
                <span className="text-xs text-slate-400">{esp32.ip}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400">ONLINE</div>
              <span className="text-[10px] text-slate-500">Latency: {esp32.lastSyncLatencyMs}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
