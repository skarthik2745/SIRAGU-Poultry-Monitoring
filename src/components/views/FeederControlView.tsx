import React, { useState } from 'react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import {
  RotateCw,
  Play,
  Clock,
  Calendar,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Layers,
  Power,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';

interface FeederControlViewProps {
  state: PoultryState;
}

export const FeederControlView: React.FC<FeederControlViewProps> = ({ state }) => {
  const { feeder, feedingSchedules, feedingHistory } = state;

  const [newLabel, setNewLabel] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newPortion, setNewPortion] = useState(3000);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    iotDataService.addFeedingSchedule({
      id: `sch-${Date.now()}`,
      label: newLabel,
      time: newTime,
      enabled: true,
      portionGrams: newPortion,
    });
    setNewLabel('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              ACTUATOR AUTOMATION
            </span>
            <span className="text-xs text-slate-400">PWM Servo Micro-Dispensing Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Smart Automated Poultry Feeder Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Precision ration distribution driven by high-torque servo hopper actuators. Configurable multi-interval daily schedules with real-time hopper mass tracking.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Control Mode:</span>
          <button
            onClick={() =>
              iotDataService.setFeederMode(feeder.mode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC')
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              feeder.mode === 'AUTOMATIC'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            }`}
          >
            {feeder.mode === 'AUTOMATIC' ? 'AUTOMATIC MODE' : 'MANUAL OVERRIDE'}
          </button>
        </div>
      </div>

      {/* Main Actuator Status & Direct Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Interactive Servo Actuator Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-cyan-500/20 flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <RotateCw className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Servo Hopper Status</h3>
                <p className="text-xs text-slate-400">PWM Channel 1 • TowerPro MG996R Actuator</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Feeder Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                  feeder.status === 'DISPENSING'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                    : feeder.status === 'OPEN'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {feeder.status}
              </span>
            </div>
          </div>

          {/* Graphical Servo Angle Gauge & Hopper Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Servo Arm Position</span>
                <span className="font-mono text-cyan-400 font-bold text-base">{feeder.servoAngle}°</span>
              </div>
              {/* Slider / Range representation */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${(feeder.servoAngle / 180) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0° (Sealed Closed)</span>
                <span>90° (Half Open)</span>
                <span>180° (Wide Open)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Hopper Pellet Capacity</span>
                <span className="font-mono text-emerald-400 font-bold text-base">{feeder.hopperLevel}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${feeder.hopperLevel}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Total Capacity: 25.0 kg</span>
                <span>Est. Remaining: {(feeder.hopperLevel * 0.25).toFixed(1)} kg</span>
              </div>
            </div>
          </div>

          {/* Direct Controls */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Manual Actuator Controls
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => iotDataService.dispenseFeeder(2500, 'Manual On-Demand Feed')}
                disabled={feeder.status === 'DISPENSING'}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {feeder.status === 'DISPENSING' ? 'Dispensing Mash...' : 'DISPENSE FEED NOW (3s)'}
              </button>

              <button
                onClick={() => iotDataService.setFeederServo(90)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                OPEN FEEDER (90°)
              </button>

              <button
                onClick={() => iotDataService.setFeederServo(0)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                CLOSE FEEDER (0°)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Telemetry Stats */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Ration Metrics
            </h3>
            <span className="text-xs text-slate-400">Daily intake & schedule markers</span>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Last Feeding:</span>
                <span className="font-mono text-cyan-300 font-bold">{feeder.lastFeedingTime}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Next Scheduled Meal:</span>
                <span className="font-mono text-emerald-400 font-bold">{feeder.nextFeedingTime}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Dispenses Today:</span>
                <span className="font-mono text-white font-bold">{feeder.dispenseCountToday} Cycles</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Feed Type:</span>
                <span className="text-slate-200 font-semibold">Crumbled Broiler Finisher</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 leading-relaxed">
            <span className="font-bold block text-white mb-0.5">Autonomous Safeguard:</span>
            Servo anti-jam vibration cycle runs automatically for 150ms before opening to prevent feed pellet bridges.
          </div>
        </div>
      </div>

      {/* Daily Scheduling Planner & Historical Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Scheduled Feedings */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Daily Feeding Schedules
              </h3>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Schedule
            </button>
          </div>

          {/* Schedule list */}
          <div className="space-y-2.5">
            {feedingSchedules.map((sch) => (
              <div
                key={sch.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => iotDataService.toggleFeedingSchedule(sch.id)}
                    className={`p-1 rounded transition-all ${
                      sch.enabled ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {sch.enabled ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <div>
                    <span className="font-bold text-white block">{sch.label}</span>
                    <span className="text-[11px] text-slate-400">Portion: {(sch.portionGrams / 1000).toFixed(1)} kg</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-cyan-300 font-bold text-sm bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {sch.time}
                  </span>
                  <button
                    onClick={() => iotDataService.removeFeedingSchedule(sch.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feeding History */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Feeding Event History
              </h3>
            </div>
            <span className="text-xs text-slate-400">Today&apos;s Records</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {feedingHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-white block">{item.mealName}</span>
                    <span className="text-[11px] text-slate-400">{(item.portionGrams / 1000).toFixed(1)} kg delivered</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                    {item.status}
                  </span>
                  <span className="text-slate-300 text-xs">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-5 border border-cyan-500/30 text-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Add Feeding Schedule</h3>
            <form onSubmit={handleAddSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Meal Label</label>
                <input
                  type="text"
                  placeholder="e.g. Midday Supplement"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Time (12h format)</label>
                <input
                  type="text"
                  placeholder="e.g. 03:00 PM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Portion (Grams)</label>
                <input
                  type="number"
                  value={newPortion}
                  onChange={(e) => setNewPortion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
