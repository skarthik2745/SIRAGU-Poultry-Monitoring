import React from 'react';
import {
  X,
  Thermometer,
  Wind,
  Flame,
  ShieldAlert,
  RotateCw,
  Cpu,
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame as FlameIcon,
  Play
} from 'lucide-react';
import { PoultryState } from '../../services/iotDataService';
import { iotDataService } from '../../services/iotDataService';

interface SensorDetailModalProps {
  sensorId: string | null;
  state: PoultryState;
  onClose: () => void;
}

export const SensorDetailModal: React.FC<SensorDetailModalProps> = ({
  sensorId,
  state,
  onClose,
}) => {
  if (!sensorId) return null;

  const { dht11, mq2, flame, ir, feeder, esp32, telemetryHistory } = state;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
      case 'SAFE':
      case 'SECURE':
      case 'ONLINE':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'WARNING':
      case 'OPEN':
      case 'DISPENSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'CRITICAL':
      case 'DETECTED':
      case 'BREACH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <FlameIcon className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  const renderSensorContent = () => {
    switch (sensorId) {
      case 'dht11': {
        const historyData = telemetryHistory.slice(-10);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">DHT11 Climate Sensor</h3>
                  <p className="text-xs text-slate-400">Digital Temperature & Humidity Module (GPIO 4)</p>
                </div>
              </div>
              {getStatusBadge(dht11.tempStatus)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Current Temperature</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {dht11.temperature.toFixed(1)} <span className="text-sm font-normal text-slate-400">°C</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Trend: {dht11.tempTrend >= 0 ? `+${dht11.tempTrend}` : dht11.tempTrend}°C / min
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Relative Humidity</span>
                <div className="text-2xl font-bold text-cyan-300 mt-1">
                  {dht11.humidity} <span className="text-sm font-normal text-slate-400">%</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Status: {dht11.humidityStatus}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Configured Safe Temp Range:</span>
                <span className="text-emerald-400 font-medium">20.0°C – 32.0°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Configured Safe Humidity:</span>
                <span className="text-emerald-400 font-medium">50% – 75% RH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Synced:</span>
                <span className="text-slate-300">{dht11.lastUpdated}</span>
              </div>
            </div>

            {/* Sparkline visualization */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Recent Temperature Telemetry</span>
              <div className="h-16 flex items-end gap-1.5 pt-2">
                {historyData.map((pt, idx) => {
                  const heightPercent = Math.min(100, Math.max(15, ((pt.temperature - 20) / (38 - 20)) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full rounded-t transition-all bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-400 group-hover:to-cyan-200"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] text-slate-500">{pt.temperature}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'mq2': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">MQ-2 Gas / Air Quality Sensor</h3>
                  <p className="text-xs text-slate-400">Detects Ammonia (NH3), Smoke, CO (ADC Channel 0)</p>
                </div>
              </div>
              {getStatusBadge(mq2.status)}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Current Concentration</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-400">{mq2.gasPpm}</span>
                <span className="text-sm font-semibold text-slate-400">ppm</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    mq2.gasPpm > 450 ? 'bg-rose-500' : mq2.gasPpm > 350 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (mq2.gasPpm / 600) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                <span>0 ppm (Pristine)</span>
                <span>350 ppm (Warning)</span>
                <span>600 ppm (Hazard)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Calibrated Safe Threshold:</span>
                <span className="text-emerald-400 font-medium">&lt; {mq2.safeThreshold} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Evacuation Limit:</span>
                <span className="text-rose-400 font-medium">&gt; 480 ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Measurement:</span>
                <span className="text-slate-300">{mq2.lastUpdated}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'flame': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">IR Flame Detector</h3>
                  <p className="text-xs text-slate-400">YG1006 Infrared Optical Sensor (GPIO 18)</p>
                </div>
              </div>
              {getStatusBadge(flame.status)}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Fire Hazard Condition</span>
                <div className="text-xl font-bold mt-1 text-white">
                  {flame.detected ? (
                    <span className="text-rose-500 flex items-center gap-2">
                      <Flame className="w-5 h-5 animate-bounce" /> ACTIVE FLAME DETECTED
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> NO FIRE DETECTED
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Sensor Output</span>
                <div className="text-sm font-mono text-slate-300 mt-1">{flame.rawVoltage.toFixed(2)} V</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Detection Spectrum:</span>
                <span className="text-slate-300 font-medium">760 nm – 1100 nm (IR Flame)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Latency:</span>
                <span className="text-emerald-400 font-medium">&lt; 15 microseconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Synced:</span>
                <span className="text-slate-300">{flame.lastUpdated}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'ir': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">IR Intrusion Barrier</h3>
                  <p className="text-xs text-slate-400">Active Infrared Photoelectric Beam (GPIO 19)</p>
                </div>
              </div>
              {getStatusBadge(ir.status)}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400">Monitored Zone</span>
              <div className="text-lg font-bold text-white mt-1">{ir.zone}</div>
              <div className="mt-2 text-xs">
                {ir.intrusionDetected ? (
                  <div className="p-2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold">
                    🚨 BREACH: Tripwire beam interrupted! Unauthorized predator or person detected.
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium">
                    🛡️ Beam intact. No intrusion detected.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Perimeter Range:</span>
                <span className="text-slate-300 font-medium">15 Meters dual-beam</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Scan:</span>
                <span className="text-slate-300">{ir.lastUpdated}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'servo': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <RotateCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Automatic Feeder & Servo Motor</h3>
                  <p className="text-xs text-slate-400">PWM Servo Actuator (GPIO 13) + Feed Hopper</p>
                </div>
              </div>
              {getStatusBadge(feeder.status)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Servo Position</span>
                <div className="text-2xl font-bold text-cyan-400 mt-1">{feeder.servoAngle}°</div>
                <div className="text-xs text-slate-500 mt-1">Range: 0° (Closed) to 180°</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Hopper Capacity</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{feeder.hopperLevel}%</div>
                <div className="text-xs text-slate-500 mt-1">~18.4 kg remaining</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300">Direct Actuator Control</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => iotDataService.dispenseFeeder(2000, 'Manual Test')}
                  disabled={feeder.status === 'DISPENSING'}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Dispense Now
                </button>
                <button
                  onClick={() => iotDataService.setFeederServo(feeder.servoAngle === 0 ? 90 : 0)}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
                >
                  {feeder.servoAngle === 0 ? 'Open Feeder' : 'Close Feeder'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Mode:</span>
                <span className="text-cyan-400 font-semibold">{feeder.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Feeding Cycle:</span>
                <span className="text-slate-300 font-medium">{feeder.lastFeedingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Scheduled Meal:</span>
                <span className="text-slate-300 font-medium">{feeder.nextFeedingTime}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'esp32': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ESP32 IoT Gateway Node</h3>
                  <p className="text-xs text-slate-400">Dual-Core Xtensa LX6 Microcontroller</p>
                </div>
              </div>
              {getStatusBadge('ONLINE')}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">IP Address</span>
                <div className="text-sm font-mono text-cyan-300 font-bold mt-1">{esp32.ip}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Wi-Fi RSSI</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">{esp32.rssi} dBm (Strong)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Free Heap Memory</span>
                <div className="text-sm font-mono text-slate-200 font-semibold mt-1">{esp32.freeHeapKb} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Firmware</span>
                <div className="text-sm font-mono text-slate-200 font-semibold mt-1">{esp32.firmwareVersion}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">System Uptime:</span>
                <span className="text-slate-300 font-medium">{Math.floor(esp32.uptimeSeconds / 3600)}h {Math.floor((esp32.uptimeSeconds % 3600) / 60)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Synchronization Rate:</span>
                <span className="text-emerald-400 font-medium">1.0 Hz (Every 1000ms)</span>
              </div>
            </div>
          </div>
        );
      }

      case 'camera': {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ESP32-CAM / AI Vision Node</h3>
                  <p className="text-xs text-slate-400">OV2640 2MP Wide-Angle Infrared Vision</p>
                </div>
              </div>
              {getStatusBadge('ONLINE')}
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Optical Analysis Pipeline</span>
                <span className="text-xs font-mono text-cyan-400">15 FPS / 1080p Stream</span>
              </div>
              <div className="relative h-28 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500/5 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                    <span className="text-[11px] text-cyan-300 font-medium block mt-1">AI Bird Detection Active</span>
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-emerald-400 font-mono">
                  LIVE FEED
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-5 border border-cyan-500/30 text-slate-200 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {renderSensorContent()}

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
