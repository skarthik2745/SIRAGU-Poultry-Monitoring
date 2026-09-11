import React, { useState, useEffect } from 'react';
import { iotDataService, PoultryState } from './services/iotDataService';
import { Navbar } from './components/layout/Navbar';
import { DemoBar } from './components/layout/DemoBar';
import { EmergencyBanner } from './components/common/EmergencyBanner';
import { SensorDetailModal } from './components/digitaltwin/SensorDetailModal';
import { PresentationMode } from './components/views/PresentationMode';

// The 11 views
import { OverviewView } from './components/views/OverviewView';
import { DigitalTwinView } from './components/views/DigitalTwinView';
import { LiveMonitoringView } from './components/views/LiveMonitoringView';
import { EnvironmentView } from './components/views/EnvironmentView';
import { SafetyView } from './components/views/SafetyView';
import { FeederControlView } from './components/views/FeederControlView';
import { AiChatAdvisorView } from './components/views/AiChatAdvisorView';
import { AlertsView } from './components/views/AlertsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SystemStatusView } from './components/views/SystemStatusView';
import { SettingsView } from './components/views/SettingsView';

import { Feather, Shield, Radio, Sparkles } from 'lucide-react';

export function App() {
  const [state, setState] = useState<PoultryState>(iotDataService.getState());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = iotDataService.subscribe((nextState) => {
      setState(nextState);
    });
    return unsubscribe;
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewView
            state={state}
            onNavigateTab={setActiveTab}
            onSelectSensor={setSelectedSensorId}
          />
        );
      case 'digital_twin':
        return (
          <DigitalTwinView
            state={state}
            onSelectSensor={setSelectedSensorId}
          />
        );
      case 'live_monitoring':
        return (
          <LiveMonitoringView
            state={state}
            onSelectSensor={setSelectedSensorId}
          />
        );
      case 'environment':
        return (
          <EnvironmentView
            state={state}
            onNavigateTab={setActiveTab}
          />
        );
      case 'safety':
        return <SafetyView state={state} />;
      case 'feeder_control':
        return <FeederControlView state={state} />;
      case 'ai_advisor':
        return <AiChatAdvisorView state={state} />;
      case 'alerts':
        return (
          <AlertsView
            state={state}
            onSelectSensor={setSelectedSensorId}
            onNavigateTab={setActiveTab}
          />
        );
      case 'analytics':
        return <AnalyticsView state={state} />;
      case 'system_status':
        return <SystemStatusView state={state} />;
      case 'settings':
        return <SettingsView state={state} />;
      default:
        return (
          <OverviewView
            state={state}
            onNavigateTab={setActiveTab}
            onSelectSensor={setSelectedSensorId}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        state={state}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
      />

      {/* Quick Judge Demo Bar */}
      <DemoBar activeScenario={state.activeScenario} />

      {/* Emergency Hazards Banner (when Fire / Intrusion / Critical Gas occurs) */}
      <EmergencyBanner state={state} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {renderActiveView()}
      </main>

      {/* Sensor Inspection Modal Drawer */}
      <SensorDetailModal
        sensorId={selectedSensorId}
        state={state}
        onClose={() => setSelectedSensorId(null)}
      />

      {/* Hackathon Stage / Presentation Mode Overlay */}
      {isPresentationMode && (
        <PresentationMode
          state={state}
          onClose={() => setIsPresentationMode(false)}
          onSelectSensor={setSelectedSensorId}
        />
      )}

      {/* Commercial Style Footer */}
      <footer className="border-t border-slate-800/80 bg-[#05080e] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">POULTRYGUARD AI</span>
            <span>— Smart Poultry Farm Automation, Health & Safety System</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Biosecurity Safeguards Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              ESP32 Edge Stream Ready
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">Build v2.4.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
