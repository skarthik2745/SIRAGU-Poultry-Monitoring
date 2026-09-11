import React from 'react';
import { Flame, ShieldAlert, AlertOctagon, Volume2, CheckCircle, RotateCcw } from 'lucide-react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import { soundService } from '../../services/soundService';

interface EmergencyBannerProps {
  state: PoultryState;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ state }) => {
  const isFire = state.flame.detected || state.activeScenario === 'FIRE';
  const isIntrusion = state.ir.intrusionDetected || state.activeScenario === 'INTRUSION';
  const isGasCritical = state.mq2.status === 'CRITICAL';
  const isTempCritical = state.dht11.tempStatus === 'CRITICAL';

  if (!isFire && !isIntrusion && !isGasCritical && !isTempCritical) {
    return null;
  }

  let title = 'EMERGENCY ALERT: SAFETY HAZARD DETECTED';
  let message = 'Automated safeguards activated. Personnel intervention advised.';
  let icon = AlertOctagon;

  if (isFire) {
    title = '🚨 CRITICAL FIRE HAZARD DETECTED — FLAME SENSOR ACTIVE';
    message = 'Infrared flame radiation confirmed in Zone 2. High risk to livestock. Emergency exhaust override active.';
    icon = Flame;
  } else if (isIntrusion) {
    title = '🚨 PERIMETER BREACH DETECTED — IR TRIPWIRE INTERRUPTED';
    message = 'North entryway perimeter beam broken. Potential predator or unauthorized entry.';
    icon = ShieldAlert;
  } else if (isGasCritical) {
    title = '⚠️ DANGEROUS GAS CONCENTRATION — NH3 EXCEEDS SAFE LIMITS';
    message = `Ammonia concentration is ${state.mq2.gasPpm} ppm. Extreme toxicity risk. Boost ventilation immediately.`;
  } else if (isTempCritical) {
    title = '🔥 CRITICAL HEAT STRESS — TEMPERATURE EXCEEDS CRITICAL THRESHOLD';
    message = `Current temperature is ${state.dht11.temperature}°C. Severe mortality risk without cooling.`;
  }

  const Icon = icon;

  const handleAcknowledge = () => {
    soundService.stopSiren();
    iotDataService.acknowledgeAllAlerts();
  };

  return (
    <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-slate-950 border-y-2 border-rose-500 py-3.5 px-4 shadow-2xl animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/50">
            <Icon className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-black text-rose-100 tracking-wide uppercase">
              {title}
            </h4>
            <p className="text-xs text-rose-200 mt-0.5">{message}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-rose-300">
              <span>Timestamp: <strong>{new Date().toLocaleTimeString()}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                Buzzer Status: <strong>AUDIBLE ALARM ACTIVE</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAcknowledge}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs border border-rose-400/40 shadow transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Acknowledge Alert</span>
          </button>

          <button
            onClick={() => iotDataService.resetToNormal()}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/40 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset System</span>
          </button>
        </div>
      </div>
    </div>
  );
};
