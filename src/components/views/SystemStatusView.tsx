import React, { useState, useEffect } from 'react';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import {
  runLocalSanityCheck,
  analyzeNodeHealthWithGemini,
  NodeDiagnosticsReport,
  ComponentHealthStatus
} from '../../services/nodeHealthService';
import {
  Cpu,
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  HardDrive,
  ShieldCheck,
  Thermometer,
  Wind,
  Flame,
  Camera,
  RotateCw,
  Clock,
  Zap,
  Layers,
  Sparkles,
  Wrench,
  Activity,
  AlertOctagon,
  ShieldAlert,
  HelpCircle,
  Stethoscope,
  Info
} from 'lucide-react';

interface SystemStatusViewProps {
  state: PoultryState;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({ state }) => {
  const { esp32, activeScenario } = state;
  const [otaSimulating, setOtaSimulating] = useState(false);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState<NodeDiagnosticsReport>(() =>
    runLocalSanityCheck(state)
  );

  // Recalculate diagnostics on state changes (sensor telemetry updates)
  useEffect(() => {
    const local = runLocalSanityCheck(state);
    setDiagnosticsReport(local);
  }, [state.dht11, state.mq2, state.flame, state.ir, state.feeder, state.esp32]);

  // Handle Triggering Deep Gemini AI Node Diagnostic Analysis
  const handleRunAiDiagnosis = async () => {
    setIsAiDiagnosing(true);
    try {
      const report = await analyzeNodeHealthWithGemini(state);
      setDiagnosticsReport(report);
    } catch (err) {
      console.error('AI diagnosis error:', err);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // Handle OTA Simulation
  const handleSimulateOta = () => {
    setOtaSimulating(true);
    setTimeout(() => {
      setOtaSimulating(false);
    }, 2500);
  };

  // Toggle sensor abnormality simulation
  const handleToggleAbnormality = () => {
    if (activeScenario === 'SENSOR_FAULT') {
      iotDataService.resetToNormal();
    } else {
      iotDataService.triggerScenario('SENSOR_FAULT');
    }
  };

  const uptimeHours = Math.floor(esp32.uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((esp32.uptimeSeconds % 3600) / 60);

  const isFaultScenarioActive = activeScenario === 'SENSOR_FAULT';
  const hasFaultyComponents = diagnosticsReport.faultyCount > 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              NODE DIAGNOSTICS & TELEMETRY HEALTH
            </span>
            <span className="text-xs text-slate-400">Firmware: {esp32.firmwareVersion}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1 flex items-center gap-2.5">
            <span>Edge Node & Sensor Health Hub</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Powered by Gemini AI
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time physical sanity boundary validation. Detects sensor drift, short-circuits, abnormal ADC spikes, and out-of-bounds telemetry with AI-assisted veterinary hardware diagnostics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Simulate Sensor Fault / Abnormality Button */}
          <button
            onClick={handleToggleAbnormality}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              isFaultScenarioActive
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white border border-rose-400/50 ring-2 ring-rose-500/50 animate-pulse'
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 hover:border-purple-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>
              {isFaultScenarioActive ? 'Clear Sensor Abnormality' : 'Simulate Abnormal Sensor Values'}
            </span>
          </button>

          {/* Gemini AI Hardware Diagnosis Button */}
          <button
            onClick={handleRunAiDiagnosis}
            disabled={isAiDiagnosing}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Stethoscope className={`w-3.5 h-3.5 ${isAiDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isAiDiagnosing ? 'Diagnosing with Gemini...' : 'Run Gemini AI Diagnostic'}</span>
          </button>

          {/* OTA Firmware Button */}
          <button
            onClick={handleSimulateOta}
            disabled={otaSimulating}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${otaSimulating ? 'animate-spin' : ''}`} />
            <span>{otaSimulating ? 'Checking OTA...' : 'Check OTA'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI & Health Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node Health Gauge Card */}
        <div
          className={`p-5 rounded-2xl glass-panel border flex items-center gap-4 ${
            hasFaultyComponents
              ? 'border-rose-500/40 bg-gradient-to-br from-slate-900 to-rose-950/30'
              : 'border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20'
          }`}
        >
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={hasFaultyComponents ? '#f43f5e' : '#10b981'}
                strokeWidth="5"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 * (1 - diagnosticsReport.overallHealthScore / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-sm font-black text-white">
              {diagnosticsReport.overallHealthScore}%
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Node Health</span>
            <span
              className={`text-lg font-black block ${
                hasFaultyComponents ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {diagnosticsReport.overallStatus.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {diagnosticsReport.healthyCount} of {diagnosticsReport.components.length} components healthy
            </span>
          </div>
        </div>

        {/* Faulty Sensor Counter */}
        <div
          className={`p-5 rounded-2xl glass-panel border flex flex-col justify-between ${
            hasFaultyComponents
              ? 'border-rose-500/50 bg-rose-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Sensor Fault Status</span>
            {hasFaultyComponents ? (
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl font-black block ${
                hasFaultyComponents ? 'text-rose-400' : 'text-white'
              }`}
            >
              {hasFaultyComponents ? `${diagnosticsReport.faultyCount} Faulty Component(s)` : '0 Faults Detected'}
            </span>
            <span className="text-xs font-mono text-slate-400 font-medium">
              {hasFaultyComponents ? 'Abnormal Out-of-Bounds Readings' : 'All detection limits nominal'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Checked against physical detection ranges</span>
        </div>

        {/* Controller Uptime */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Controller Uptime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white font-mono block">
              {uptimeHours}h {uptimeMinutes}m
            </span>
            <span className="text-xs text-slate-400">0 spontaneous resets</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Boot: Power-On Reset (POR)</span>
        </div>

        {/* Free Heap Memory */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">SRAM Heap Memory</span>
            <HardDrive className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white font-mono block">{esp32.freeHeapKb} KB Free</span>
            <span className="text-xs text-emerald-400">58% Headroom Remaining</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Internal RAM: 520 KB Total</span>
        </div>
      </div>

      {/* AI Diagnostic Summary Card */}
      <div
        className={`p-5 rounded-2xl glass-panel border transition-all ${
          hasFaultyComponents
            ? 'border-rose-500/50 bg-slate-950/90 shadow-lg shadow-rose-500/10'
            : 'border-purple-500/30 bg-slate-950/80 shadow-lg shadow-purple-500/10'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                hasFaultyComponents
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Gemini AI Node Health & Anomaly Diagnosis</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasFaultyComponents
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {hasFaultyComponents ? 'ANOMALY DETECTED' : 'NOMINAL INTEGRITY'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Last Assessed: {diagnosticsReport.timestamp} • Model: Gemini 2.5 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Need fresh diagnosis? Click <strong>Run Gemini AI Diagnostic</strong> above.
            </span>
          </div>
        </div>

        {/* AI Insight Content */}
        <div className="mt-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Diagnostic Evaluation:</strong>
                <p>{diagnosticsReport.aiAnalysisSummary}</p>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {diagnosticsReport.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Prescribed Hardware & Calibration Action Steps:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {diagnosticsReport.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                      hasFaultyComponents
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-cyan-400 shrink-0">#{i + 1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Health & Anomaly Table */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Component & Sensor Health Matrix (With Detection Envelopes)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Comparing Live Reading vs Normal Sensor Physical Range
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Component / Sensor</th>
                <th className="pb-3 font-semibold">Interface Pin</th>
                <th className="pb-3 font-semibold">Standard Detection Range</th>
                <th className="pb-3 font-semibold">Live Reading</th>
                <th className="pb-3 font-semibold">Condition</th>
                <th className="pb-3 font-semibold">Health Score</th>
                <th className="pb-3 font-semibold text-right">Diagnostic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {diagnosticsReport.components.map((comp) => {
                let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                let rowBg = 'hover:bg-slate-900/50';

                if (comp.isFaulty) {
                  badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse';
                  rowBg = 'bg-rose-950/20 hover:bg-rose-950/30';
                } else if (comp.statusText === 'DEGRADED') {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                }

                return (
                  <tr key={comp.id} className={`${rowBg} transition-all`}>
                    <td className="py-3.5 pr-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {comp.isFaulty ? (
                          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <span>{comp.name}</span>
                          {comp.faultReason && (
                            <span className="block text-[10px] text-rose-300 font-normal mt-0.5">
                              ⚠️ {comp.faultReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 font-mono text-cyan-300">{comp.pinInterface}</td>
                    <td className="py-3.5 pr-3 text-slate-400 font-mono text-[11px]">{comp.nominalRange}</td>
                    <td className="py-3.5 pr-3 font-bold font-mono">
                      <span className={comp.isFaulty ? 'text-rose-400 text-sm' : 'text-slate-200'}>
                        {comp.currentReading}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${badgeClass}`}
                      >
                        {comp.statusText.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              comp.healthScore > 80
                                ? 'bg-emerald-500'
                                : comp.healthScore > 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${comp.healthScore}%` }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-bold ${
                            comp.healthScore > 80
                              ? 'text-emerald-400'
                              : comp.healthScore > 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {comp.healthScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-semibold">
                      {comp.isFaulty ? (
                        <span className="text-rose-400 text-[11px] font-bold">FAULTY / REPLACE</span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">GOOD (OPERATIONAL)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
