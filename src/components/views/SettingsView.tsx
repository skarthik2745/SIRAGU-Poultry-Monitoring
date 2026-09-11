import React, { useState } from 'react';
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
              <span>Settings Saved</span>
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
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Poultry Shed Unit Identifier</label>
              <input
                type="text"
                value={formData.poultryUnitName}
                onChange={(e) => setFormData({ ...formData, poultryUnitName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Configurable Sensor Thresholds */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Configurable Sensor Threshold Limits
                </h3>
                <span className="text-[11px] text-slate-400">
                  Customizable farm-specific thresholds for warning and critical alarms
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Configurable per farm guidelines</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed italic">
            * Operational Note: These values represent site-specific thresholds configured by the farm administrator to match bird age, genetic breed, and housing style. They are not universal veterinary standards.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Temperature Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span>Temperature Calibration</span>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Warning Threshold:</span>
                  <span className="font-mono text-amber-400 font-bold">{formData.tempWarningThreshold}°C</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={38}
                  step={0.5}
                  value={formData.tempWarningThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, tempWarningThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Critical Threshold:</span>
                  <span className="font-mono text-rose-400 font-bold">{formData.tempCriticalThreshold}°C</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={45}
                  step={0.5}
                  value={formData.tempCriticalThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, tempCriticalThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            {/* Humidity Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Droplets className="w-4 h-4 text-cyan-300" />
                <span>Relative Humidity Calibration</span>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Minimum Target:</span>
                  <span className="font-mono text-cyan-300 font-bold">{formData.humMinThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={60}
                  step={1}
                  value={formData.humMinThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, humMinThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Maximum Ceiling:</span>
                  <span className="font-mono text-amber-400 font-bold">{formData.humMaxThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={90}
                  step={1}
                  value={formData.humMaxThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, humMaxThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400"
                />
              </div>
            </div>

            {/* Gas Thresholds */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>MQ-2 Gas / Ammonia Calibration</span>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Warning Threshold:</span>
                  <span className="font-mono text-amber-400 font-bold">{formData.gasWarningThreshold} ppm</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={450}
                  step={10}
                  value={formData.gasWarningThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, gasWarningThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Critical Evac Threshold:</span>
                  <span className="font-mono text-rose-400 font-bold">{formData.gasCriticalThreshold} ppm</span>
                </div>
                <input
                  type="range"
                  min={400}
                  max={700}
                  step={10}
                  value={formData.gasCriticalThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, gasCriticalThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500"
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
                onChange={(e) => setFormData({ ...formData, mqttBrokerUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">ESP32 Static IP / REST Endpoint</label>
              <input
                type="text"
                value={formData.esp32IpAddress}
                onChange={(e) => setFormData({ ...formData, esp32IpAddress: e.target.value })}
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
                  setFormData({ ...formData, soundAlertsEnabled: e.target.checked })
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
                onChange={(e) => setFormData({ ...formData, simulationMode: e.target.checked })}
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
                value="8766111438:AAFdJ8VzQ5Mj9LQXXpbFHpLoU5xJwvv1qTU"
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
