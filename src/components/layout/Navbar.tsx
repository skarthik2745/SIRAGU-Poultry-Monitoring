import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  Tv,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Cpu,
  Feather
} from 'lucide-react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import { soundService } from '../../services/soundService';

interface NavbarProps {
  state: PoultryState;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  activeTab,
  onTabChange,
  isPresentationMode,
  onTogglePresentationMode,
}) => {
  const [clock, setClock] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) + ' ' + d.toLocaleTimeString()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundService.enabled = !next;
  };

  const getFarmStatusIndicator = () => {
    switch (state.farmStatus) {
      case 'EMERGENCY':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse font-bold text-xs">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>🚨 FARM STATUS: EMERGENCY</span>
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>⚠️ FARM STATUS: WARNING</span>
          </div>
        );
      case 'NORMAL':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>🟢 FARM STATUS: NORMAL</span>
          </div>
        );
    }
  };

  const navTabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'digital_twin', label: 'DIGITAL TWIN', highlight: true },
    { id: 'live_monitoring', label: 'LIVE MONITORING' },
    { id: 'environment', label: 'ENVIRONMENT' },
    { id: 'safety', label: 'SAFETY' },
    { id: 'feeder_control', label: 'FEEDER CONTROL' },
    { id: 'ai_advisor', label: 'AI CHATBOT & ADVICE', highlight: true },
    { id: 'alerts', label: 'ALERTS', count: state.alerts.filter((a) => !a.acknowledged).length },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'system_status', label: 'SYSTEM STATUS' },
    { id: 'settings', label: 'SETTINGS' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070b12]/95 backdrop-blur-md border-b border-cyan-500/15">
      {/* Top Meta Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            <Feather className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                POULTRYGUARD AI
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 uppercase">
                IoT + AI v2.4
              </span>
              {/* Connection Mode Badge */}
              {state.isHardwareConnected && state.dataSource === 'WOKWI_HARDWARE' ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE WOKWI / ESP32
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-amber-300">
                  SIMULATION MODE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Smart Poultry Farm Automation, Health & Safety System
            </p>
          </div>
        </div>

        {/* Status Pills and Utilities */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Farm Status */}
          {getFarmStatusIndicator()}

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{clock}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              soundMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={soundMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Hackathon Presentation Mode Toggle */}
          <button
            onClick={onTogglePresentationMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{isPresentationMode ? 'Exit Stage' : 'Presentation Mode'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none border-t border-slate-800/80">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                } ${tab.highlight && !isActive ? 'text-cyan-400' : ''}`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
