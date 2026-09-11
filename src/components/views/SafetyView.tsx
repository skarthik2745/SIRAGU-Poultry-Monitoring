import React, { useState } from 'react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import { soundService } from '../../services/soundService';
import { ZoneSafetyTwin3D } from '../digitaltwin/ZoneSafetyTwin3D';
import {
  Flame,
  ShieldAlert,
  Wind,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Volume2,
  History,
  RotateCcw,
  Layers,
  Thermometer,
  Eye,
  Radio,
  Sliders,
  MapPin,
  Maximize2,
  Activity,
  Zap
} from 'lucide-react';

interface SafetyViewProps {
  state: PoultryState;
}

interface ZoneSensorData {
  id: string;
  name: string;
  sector: string;
  flameDetected: boolean;
  irIntrusion: boolean;
  temp: number;
  humidity: number;
  gasPpm: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  actuatorStatus: string;
  fanActive: boolean;
  feederActive: boolean;
  mistingActive: boolean;
}

export const SafetyView: React.FC<SafetyViewProps> = ({ state }) => {
  const { flame, ir, mq2, dht11, emergencyEvents, activeScenario, isHardwareConnected } = state;

  const [selectedZone, setSelectedZone] = useState<string>('zone-1');

  // Multi-Zone Architecture Setup (4 Dispersed Zones across the large poultry house)
  // Zone 1 is physically bound to the Live ESP32 Edge Sensor Cluster, while Zones 2-4 simulate multi-unit spatial management.
  const isGlobalFire = flame.detected || activeScenario === 'FIRE';
  const isGlobalIntrusion = ir.intrusionDetected || activeScenario === 'INTRUSION';

  const zones: ZoneSensorData[] = [
    {
      id: 'zone-1',
      name: 'Zone 1 — Brooding & Ingestion Sector',
      sector: 'North-West (NW)',
      flameDetected: isGlobalFire,
      irIntrusion: isGlobalIntrusion,
      temp: dht11.temperature,
      humidity: dht11.humidity,
      gasPpm: mq2.gasPpm,
      status: isGlobalFire || isGlobalIntrusion || mq2.status === 'CRITICAL' ? 'CRITICAL' : dht11.tempStatus === 'WARNING' ? 'WARNING' : 'NORMAL',
      actuatorStatus: isGlobalFire ? 'Fire Suppression Ready' : 'Feed Lines Active',
      fanActive: mq2.gasPpm > 300 || dht11.temperature > 30,
      feederActive: state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0,
      mistingActive: dht11.temperature > 32,
    },
    {
      id: 'zone-2',
      name: 'Zone 2 — Central Flock Growth Bay',
      sector: 'North-East (NE)',
      flameDetected: false,
      irIntrusion: false,
      temp: Number((dht11.temperature + 0.6).toFixed(1)),
      humidity: Math.max(40, dht11.humidity - 2),
      gasPpm: Math.max(140, mq2.gasPpm + 35),
      status: mq2.gasPpm > 350 ? 'WARNING' : 'NORMAL',
      actuatorStatus: 'Ventilation Tunnel Active',
      fanActive: true,
      feederActive: false,
      mistingActive: false,
    },
    {
      id: 'zone-3',
      name: 'Zone 3 — Rear Laying & Roosting Area',
      sector: 'South-West (SW)',
      flameDetected: false,
      irIntrusion: false,
      temp: Number((dht11.temperature - 0.4).toFixed(1)),
      humidity: Math.min(85, dht11.humidity + 3),
      gasPpm: Math.max(120, mq2.gasPpm - 20),
      status: 'NORMAL',
      actuatorStatus: 'Drinker Lines Pressurized',
      fanActive: false,
      feederActive: false,
      mistingActive: false,
    },
    {
      id: 'zone-4',
      name: 'Zone 4 — Exhaust & Manure Management End',
      sector: 'South-East (SE)',
      flameDetected: false,
      irIntrusion: false,
      temp: Number((dht11.temperature + 1.1).toFixed(1)),
      humidity: Math.max(45, dht11.humidity - 4),
      gasPpm: Math.max(180, mq2.gasPpm + 70),
      status: mq2.gasPpm + 70 > 400 ? 'CRITICAL' : mq2.gasPpm + 70 > 320 ? 'WARNING' : 'NORMAL',
      actuatorStatus: 'Exhaust Fans High-Speed',
      fanActive: true,
      feederActive: false,
      mistingActive: true,
    },
  ];

  const activeZoneData = zones.find((z) => z.id === selectedZone) || zones[0];

  return (
    <div className="space-y-6">
      {/* Title & Safety Matrix Overview */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/25 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              BIOSECURITY & MULTI-ZONE SAFETY MATRIX
            </span>
            <span className="text-xs text-slate-400">4-Zone Spatial Precision Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Poultry Farm Multi-Zone Safety Surveillance
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time multi-hazard surveillance across 4 segregated farm sectors. Track localized optical flame detectors, perimeter IR security tripwires, NH3 gas toxicity, and automated actuator overrides per zone.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => iotDataService.resetToNormal()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all shadow"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Safety System</span>
          </button>
        </div>
      </div>

      {/* Global Hazard Warning Banner if active in any zone */}
      {isGlobalFire && (
        <div className="p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl text-rose-100 animate-pulse space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/50">
                <Flame className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-rose-500 text-slate-950 font-black tracking-wider uppercase">
                  ACTIVE FIRE EMERGENCY IN ZONE 1
                </span>
                <h2 className="text-2xl font-black text-white mt-1">🚨 THERMAL FLAME CONFIRMED IN BROODING BAY</h2>
                <p className="text-xs text-rose-200 mt-1">
                  Optical infrared spectrum sensor detected flame in Zone 1. Evacuation and sprinkler protocols initiated.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundService.stopSiren();
                iotDataService.acknowledgeAllAlerts();
              }}
              className="px-4 py-2 rounded-xl bg-white text-rose-950 font-black text-xs shadow-lg hover:bg-rose-100 transition-all"
            >
              Acknowledge Fire Alarm
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ZONE-BASED 3D SAFETY DIGITAL TWIN (HOLOGRAPHIC MATRIX)    */}
      {/* ────────────────────────────────────────────────────────── */}
      <ZoneSafetyTwin3D
        selectedZoneId={selectedZone}
        onSelectZone={(zid) => setSelectedZone(zid)}
        zonesData={zones}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4-ZONE INTERACTIVE MAP & SPATIAL OVERVIEW SECTION          */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                4-Zone Spatial Safety Map (Shed Layout)
              </h2>
              <span className="text-[11px] text-slate-400">
                Click any zone below to inspect its dedicated sensor telemetry and actuator status
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 / 4 Zones Synchronized</span>
            </span>
          </div>
        </div>

        {/* 2x2 Interactive Zone Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone, idx) => {
            const isSelected = selectedZone === zone.id;
            const isCritical = zone.status === 'CRITICAL';
            const isWarning = zone.status === 'WARNING';

            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20'
                    : 'hover:border-slate-700'
                } ${
                  isCritical
                    ? 'bg-rose-950/30 border-rose-500 animate-pulse'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/80'
                    : isSelected
                    ? 'bg-slate-900/90 border-cyan-500/80'
                    : 'bg-slate-950/80 border-slate-800/90'
                }`}
              >
                {/* Header of each zone tile */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center border shadow-sm ${
                        isCritical
                          ? 'bg-rose-500 text-slate-950 border-rose-400'
                          : isWarning
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      Z{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{zone.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">{zone.sector}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {zone.status}
                  </span>
                </div>

                {/* 4 Dedicated Sensor Metrics inside this Zone */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  {/* Climate (Temp & Humidity) */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Thermometer className="w-3 h-3 text-cyan-400" />
                      <span>Temp / Hum</span>
                    </div>
                    <div className="text-xs font-bold text-white font-mono">
                      {zone.temp}°C / {zone.humidity}%
                    </div>
                  </div>

                  {/* Gas / Ammonia MQ-2 */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Wind className="w-3 h-3 text-emerald-400" />
                      <span>MQ-2 Gas</span>
                    </div>
                    <div className="text-xs font-bold text-white font-mono">
                      {zone.gasPpm} ppm
                    </div>
                  </div>

                  {/* Flame Sensor */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>Flame Sensor</span>
                    </div>
                    <div className="text-xs font-bold font-mono">
                      {zone.flameDetected ? (
                        <span className="text-rose-400 animate-pulse">FIRE!</span>
                      ) : (
                        <span className="text-emerald-400">SAFE</span>
                      )}
                    </div>
                  </div>

                  {/* IR Perimeter Tripwire */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>IR Barrier</span>
                    </div>
                    <div className="text-xs font-bold font-mono">
                      {zone.irIntrusion ? (
                        <span className="text-rose-400 animate-pulse">BREACH</span>
                      ) : (
                        <span className="text-emerald-400">SECURE</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer status & active actuators in this zone */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500">Actuators:</span>
                    <span className="text-slate-300 font-semibold">{zone.actuatorStatus}</span>
                  </div>
                  {idx === 0 && isHardwareConnected && (
                    <span className="text-[10px] text-cyan-400 font-bold font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                      LIVE ESP32 NODE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* DETAILED INSPECTION FOR THE CURRENTLY SELECTED ZONE        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 bg-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{activeZoneData.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Sector: {activeZoneData.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detailed real-time diagnostic breakdown for the selected poultry house compartment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${
                activeZoneData.status === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                  : activeZoneData.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
              }`}
            >
              Sector Status: {activeZoneData.status}
            </span>
          </div>
        </div>

        {/* 3 Detailed Safety Subsystem Inspection Cards for Selected Zone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Fire Detection */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              activeZoneData.flameDetected ? 'border-rose-500 bg-rose-950/30' : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`p-2 rounded-lg border ${
                    activeZoneData.flameDetected
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Optical Flame Sensor</h4>
                  <span className="text-[10px] text-slate-400 font-mono">YG1006 Infrared Photodiode</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Sector Fire State</span>
                <div className="text-base font-bold mt-0.5">
                  {activeZoneData.flameDetected ? (
                    <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                      <AlertOctagon className="w-4 h-4" /> ACTIVE FLAME DETECTED
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> NO FLAME (SECURE)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Response: &lt; 20ms</span>
              <span>Spectral: 760nm–1100nm</span>
            </div>
          </div>

          {/* 2. Intrusion Detection */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              activeZoneData.irIntrusion ? 'border-rose-500 bg-rose-950/30' : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`p-2 rounded-lg border ${
                    activeZoneData.irIntrusion
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Perimeter IR Tripwire</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Optical Beam Barrier</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Perimeter Status</span>
                <div className="text-base font-bold mt-0.5">
                  {activeZoneData.irIntrusion ? (
                    <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                      <AlertOctagon className="w-4 h-4" /> INTRUSION BREACH!
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> PERIMETER SECURE
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Modulation: 38 kHz</span>
              <span>Predator Alarm: Armed</span>
            </div>
          </div>

          {/* 3. Gas Toxicity & Ventilation Override */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              activeZoneData.gasPpm > 350 ? 'border-rose-500 bg-rose-950/30' : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`p-2 rounded-lg border ${
                    activeZoneData.gasPpm > 350
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">MQ-2 Gas / Ammonia</h4>
                  <span className="text-[10px] text-slate-400 font-mono">NH3 & Carbon Monoxide</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Ammonia Concentration</span>
                <div className="text-base font-bold mt-0.5 font-mono">
                  {activeZoneData.gasPpm > 350 ? (
                    <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                      <AlertOctagon className="w-4 h-4" /> {activeZoneData.gasPpm} ppm (HAZARD)
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {activeZoneData.gasPpm} ppm (SAFE)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Threshold: &lt; 300 ppm</span>
              <span>Vent Fan: {activeZoneData.fanActive ? 'RUNNING' : 'IDLE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Event Audit Log Timeline */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Multi-Zone Safety Event Audit Log
              </h3>
              <span className="text-[11px] text-slate-400">Chronological telemetry security audit trail</span>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Total logs: {emergencyEvents.length}
          </span>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {emergencyEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 font-bold">{evt.timestamp}</span>
                <span className="text-slate-300 font-medium">{evt.event}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                  {evt.sensor}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    evt.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : evt.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {evt.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
