import React, { useState } from 'react';
import { FarmAlert } from '../../types/poultry';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import {
  Bell,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Filter,
  Check,
  Eye,
  Info,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface AlertsViewProps {
  state: PoultryState;
  onSelectSensor: (sensorId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  state,
  onSelectSensor,
  onNavigateTab,
}) => {
  const { alerts } = state;
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FarmAlert | null>(null);

  const filteredAlerts = alerts.filter((alt) => {
    if (filterType !== 'ALL' && alt.type !== filterType) return false;
    if (filterStatus === 'ACTIVE' && alt.acknowledged) return false;
    if (filterStatus === 'RESOLVED' && !alt.resolved) return false;
    return true;
  });

  const getAlertSensorId = (sensor: string): string => {
    switch (sensor) {
      case 'FLAME':
        return 'flame';
      case 'MQ2':
        return 'mq2';
      case 'DHT11':
        return 'dht11';
      case 'IR':
        return 'ir';
      case 'SERVO':
        return 'servo';
      case 'AI':
        return 'camera';
      case 'ESP32':
      default:
        return 'esp32';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              INCIDENT RESPONSE
            </span>
            <span className="text-xs text-slate-400">
              Active Alarms: {alerts.filter((a) => !a.acknowledged).length} unacknowledged
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            Centralized Alert Dispatch & Incident Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Audit, triage, and acknowledge automated safety anomalies emitted by edge sensors and AI analytics models.
          </p>
        </div>

        <button
          onClick={() => iotDataService.acknowledgeAllAlerts()}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>Acknowledge All</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl glass-panel border border-slate-800 text-xs">
        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold mr-1">Category:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No alerts match your filter criteria</h3>
            <p className="text-xs text-slate-400">All systems operating nominally.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.type === 'CRITICAL';
            const isWarning = alert.type === 'WARNING';
            const isResolved = alert.resolved;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl glass-panel border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                  isResolved
                    ? 'border-emerald-500/20 bg-emerald-950/10'
                    : isCritical
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border mt-0.5 ${
                      isResolved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isCritical
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCritical ? (
                      <Flame className="w-5 h-5 animate-pulse" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{alert.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isCritical
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {alert.type}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                        Sensor: {alert.sensor}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 font-mono">
                      <span>Logged: {alert.timestamp}</span>
                      <span>•</span>
                      <span>
                        Status:{' '}
                        {alert.resolved ? (
                          <strong className="text-emerald-400">RESOLVED</strong>
                        ) : alert.acknowledged ? (
                          <strong className="text-cyan-400">ACKNOWLEDGED</strong>
                        ) : (
                          <strong className="text-rose-400">UNACKNOWLEDGED</strong>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      onNavigateTab('digital_twin');
                      onSelectSensor(getAlertSensorId(alert.sensor));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in Twin</span>
                  </button>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => iotDataService.acknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!alert.resolved && (
                    <button
                      onClick={() => iotDataService.resolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
