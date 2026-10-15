import React, { useState, useEffect } from 'react';
import { FarmSettings } from '../../types/poultry';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import { telegramService } from '../../services/telegramService';
import {
  Sliders,
  Building,
  Thermometer,
  Wind,
  Droplets,
  Volume2,
  Cpu,
  Save,
  CheckCircle2,
  HelpCircle,
  Radio,
  RotateCcw,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface SettingsViewProps {
  state: PoultryState;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ state }) => {
  const [formData, setFormData] = useState<FarmSettings>({ ...state.settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const currentChatId = telegramService.getChatId();
  const [telegramChatId, setTelegramChatId] = useState<string>(
    currentChatId && currentChatId !== '5044522382' ? currentChatId : '1475583718'
  );

  // Keep formData in sync when state.settings changes externally
  useEffect(() => {
    setFormData({ ...state.settings });
  }, [state.settings]);

  // Helper: update local form state AND immediately push to the IoT service
  // so thresholds take effect in real-time as the user drags sliders.
  const updateField = (patch: Partial<FarmSettings>) => {
    const updated = { ...formData, ...patch };
    setFormData(updated);
    iotDataService.updateSettings(patch);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    iotDataService.updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    const defaults: FarmSettings = {
      farmName: 'GreenPastures Smart Poultry',
      poultryUnitName: 'Broiler Shed #04',
      tempWarningThreshold: 31.0,
      tempCriticalThreshold: 34.0,
      humMinThreshold: 45,
      humMaxThreshold: 78,
      gasWarningThreshold: 350,
      gasCriticalThreshold: 480,
      soundAlertsEnabled: true,
      simulationMode: true,
      mqttBrokerUrl: 'mqtt://broker.hivemq.com:1883/poultryguard/shed4',
      esp32IpAddress: '192.168.1.145',
      theme: 'dark',
    };
    setFormData(defaults);
    iotDataService.updateSettings(defaults);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              SYSTEM CONFIGURATION
            </span>
            <span className="text-xs text-slate-400">Microclimate Calibration & Gateways</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Poultry Farm Settings & Calibration
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Configure shed environmental boundary thresholds, device connectivity endpoints, and biosecurity notification channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Settings Saved & Applied</span>
            </span>
          )}
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Farm & Poultry Unit Identification */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Farm & Unit Identification
              </h3>
              <span className="text-[11px] text-slate-400">Facility name and shed demarcation tags</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Farm Enterprise Name</label>
              <input
                type="text"
                value={formData.farmName}
                onChange={(e) => updateField({ farmName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Poultry Shed Unit Identifier</label>
              <input
                type="text"
                value={formData.poultryUnitName}
                onChange={(e) => updateField({ poultryUnitName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Configurable Sensor Thresholds */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 bg-slate-950/90 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Configurable Sensor Threshold Limits</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    LIVE CALIBRATION
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Customizable farm-specific thresholds for warning and critical alarms
                </span>
              </div>
            </div>

            {/* Direct Save Button for Thresholds */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  iotDataService.updateSettings(formData);
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Thresholds Immediately</span>
              </button>
            </div>
          </div>

          {/* Quick Presets & Live Sensor Telemetry Badge */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  updateField({ tempWarningThreshold: 31.0, tempCriticalThreshold: 34.0 });
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium transition-all"
              >
                Standard (31°C / 34°C)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateField({ tempWarningThreshold: 35.0, tempCriticalThreshold: 38.0 });
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all"
              >
                🔥 Summer / High Heat (35°C / 38°C)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateField({ tempWarningThreshold: 33.0, tempCriticalThreshold: 36.0 });
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-medium transition-all"
              >
                Chicks Brooding (33°C / 36°C)
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Live Reading:</span>
              <span className="font-mono font-bold text-cyan-300">{state.dht11.temperature}°C</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  state.dht11.temperature >= formData.tempCriticalThreshold
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : state.dht11.temperature >= formData.tempWarningThreshold
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {state.dht11.temperature >= formData.tempCriticalThreshold
                  ? 'CRITICAL'
                  : state.dht11.temperature >= formData.tempWarningThreshold
                  ? 'WARNING'
                  : 'NORMAL / SAFE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Temperature Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between font-bold text-white">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span>Temperature Calibration</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Live: {state.dht11.temperature}°C
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Warning Threshold:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={20}
                      max={40}
                      step={0.5}
                      value={formData.tempWarningThreshold}
                      onChange={(e) =>
                        updateField({ tempWarningThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-right focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-400">°C</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20}
                  max={40}
                  step={0.5}
                  value={formData.tempWarningThreshold}
                  onChange={(e) =>
                    updateField({ tempWarningThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Critical Threshold:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={28}
                      max={48}
                      step={0.5}
                      value={formData.tempCriticalThreshold}
                      onChange={(e) =>
                        updateField({ tempCriticalThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-right focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-slate-400">°C</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={28}
                  max={48}
                  step={0.5}
                  value={formData.tempCriticalThreshold}
                  onChange={(e) =>
                    updateField({ tempCriticalThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Humidity Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between font-bold text-white">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-300" />
                  <span>Humidity Calibration</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Live: {state.dht11.humidity}%
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Minimum Target:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={20}
                      max={65}
                      step={1}
                      value={formData.humMinThreshold}
                      onChange={(e) =>
                        updateField({ humMinThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20}
                  max={65}
                  step={1}
                  value={formData.humMinThreshold}
                  onChange={(e) =>
                    updateField({ humMinThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Maximum Ceiling:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={60}
                      max={95}
                      step={1}
                      value={formData.humMaxThreshold}
                      onChange={(e) =>
                        updateField({ humMaxThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-right focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={60}
                  max={95}
                  step={1}
                  value={formData.humMaxThreshold}
                  onChange={(e) =>
                    updateField({ humMaxThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Gas Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between font-bold text-white">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span>MQ-2 Gas / Ammonia</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Live: {state.mq2.gasPpm} ppm
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Warning Threshold:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={100}
                      max={500}
                      step={10}
                      value={formData.gasWarningThreshold}
                      onChange={(e) =>
                        updateField({ gasWarningThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-right focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-400">ppm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={10}
                  value={formData.gasWarningThreshold}
                  onChange={(e) =>
                    updateField({ gasWarningThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5">
                  <span>Critical Threshold:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={300}
                      max={1000}
                      step={10}
                      value={formData.gasCriticalThreshold}
                      onChange={(e) =>
                        updateField({ gasCriticalThreshold: Number(e.target.value) })
                      }
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-right focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-slate-400">ppm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={300}
                  max={1000}
                  step={10}
                  value={formData.gasCriticalThreshold}
                  onChange={(e) =>
                    updateField({ gasCriticalThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Hardware & IoT Endpoints */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Edge Gateway & IoT Infrastructure Hookup
              </h3>
              <span className="text-[11px] text-slate-400">
                Configure physical ESP32 gateway IP, MQTT broker URL, and simulation modes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">MQTT Broker Endpoint</label>
              <input
                type="text"
                value={formData.mqttBrokerUrl}
                onChange={(e) => updateField({ mqttBrokerUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">ESP32 Static IP / REST Endpoint</label>
              <input
                type="text"
                value={formData.esp32IpAddress}
                onChange={(e) => updateField({ esp32IpAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="soundAlerts"
                checked={formData.soundAlertsEnabled}
                onChange={(e) =>
                  updateField({ soundAlertsEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="soundAlerts" className="text-slate-300 font-medium cursor-pointer">
                Enable Audible Emergency Siren & Buzzer (Web Audio API)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="simMode"
                checked={formData.simulationMode}
                onChange={(e) => updateField({ simulationMode: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="simMode" className="text-slate-300 font-medium cursor-pointer">
                Enable Dynamic Physics Simulation Mode
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Telegram Real-Time Alert Chatbot Integration */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 bg-slate-950/80 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Telegram Alert Chatbot Integration</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    REAL-TIME WEBHOOK
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Instant push notifications for temperature spikes, ammonia gas toxicity, flame hazards, and perimeter breaches.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await telegramService.sendTestPing(telegramChatId);
                  alert(res.message);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Alert to Telegram</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Telegram Bot Token (Integrated)
              </label>
              <input
                type="text"
                readOnly
                value="8766111438:AAGHfTdWeaLHDEXWo89Fe_lN-fm040km2HY"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Bot Username: <code>@AN2745Bot</code>
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Target User / Group Chat ID (Auto-Discovered)
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => {
                  setTelegramChatId(e.target.value);
                  telegramService.setChatId(e.target.value);
                }}
                placeholder="Click /start in your Telegram bot to auto-pair, or enter Chat ID manually"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                💡 <strong>Tip:</strong> Open Telegram, search for your bot, and send <code>/start</code>. It will pair automatically!
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset to Factory Defaults</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
