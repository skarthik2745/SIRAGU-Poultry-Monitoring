import {
  DHT11Data,
  MQ2Data,
  FlameSensorData,
  IRSensorData,
  FeederData,
  PoultryActivityData,
  ESP32Status,
  FarmAlert,
  TelemetryPoint,
  FeedingScheduleItem,
  FeedingHistoryItem,
  EmergencyEvent,
  FarmSettings,
  DemoScenario,
} from '../types/poultry';
import { soundService } from './soundService';
import { telegramService } from './telegramService';

export interface PoultryState {
  farmStatus: 'NORMAL' | 'WARNING' | 'EMERGENCY';
  overallFarmHealth: number; // 0 - 100%
  dht11: DHT11Data;
  mq2: MQ2Data;
  flame: FlameSensorData;
  ir: IRSensorData;
  feeder: FeederData;
  poultryActivity: PoultryActivityData;
  esp32: ESP32Status;
  alerts: FarmAlert[];
  telemetryHistory: TelemetryPoint[];
  feedingSchedules: FeedingScheduleItem[];
  feedingHistory: FeedingHistoryItem[];
  emergencyEvents: EmergencyEvent[];
  settings: FarmSettings;
  activeScenario: DemoScenario;
  aiInsight: string;
  lastSyncedTimestamp: number;
  isHardwareConnected: boolean;
  dataSource: 'SIMULATION' | 'WOKWI_HARDWARE';
}

type Listener = (state: PoultryState) => void;

class IoTDataService {
  private listeners: Set<Listener> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;
  private scenarioTimer: ReturnType<typeof setTimeout> | null = null;
  private apiPollTimer: ReturnType<typeof setInterval> | null = null;

  private state: PoultryState;

  constructor() {
    this.state = this.getInitialState();
    this.startSimulation();
    this.startApiPolling();
  }

  private getInitialState(): PoultryState {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Initial 20 history points
    const history: TelemetryPoint[] = [];
    const baseTemp = 28.2;
    const baseHum = 66;
    const baseGas = 240;
    const baseAct = 72;

    for (let i = 19; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 3000);
      const pastStr = pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        time: pastStr,
        temperature: Number((baseTemp + (Math.sin(i * 0.4) * 0.4) + (Math.random() * 0.1 - 0.05)).toFixed(1)),
        humidity: Math.round(baseHum + (Math.cos(i * 0.3) * 1.5)),
        gasPpm: Math.round(baseGas + (Math.sin(i * 0.2) * 8)),
        activityIndex: Math.round(baseAct + (Math.sin(i * 0.5) * 6)),
      });
    }

    return {
      farmStatus: 'NORMAL',
      overallFarmHealth: 98,
      dht11: {
        temperature: 28.4,
        humidity: 67,
        tempStatus: 'NORMAL',
        humidityStatus: 'NORMAL',
        tempTrend: 0.2,
        lastUpdated: timeStr,
        safeTempRange: [20, 32],
        safeHumRange: [50, 75],
      },
      mq2: {
        gasPpm: 245,
        status: 'SAFE',
        trend: 2,
        lastUpdated: timeStr,
        safeThreshold: 350,
        warningThreshold: 450,
      },
      flame: {
        detected: false,
        status: 'SAFE',
        rawVoltage: 0.12,
        lastUpdated: timeStr,
      },
      ir: {
        intrusionDetected: false,
        status: 'SECURE',
        zone: 'North Perimeter Barrier',
        lastUpdated: timeStr,
      },
      feeder: {
        status: 'CLOSED',
        servoAngle: 0,
        hopperLevel: 82,
        mode: 'AUTOMATIC',
        lastFeedingTime: '10:30 AM',
        nextFeedingTime: '06:30 PM',
        dispenseCountToday: 3,
      },
      poultryActivity: {
        status: 'NORMAL',
        movementIndex: 74,
        flockDistribution: 'UNIFORM',
        birdsDetected: 1250,
        lastAssessed: timeStr,
      },
      esp32: {
        online: true,
        ip: '192.168.1.145',
        macAddress: '24:6F:28:9C:3A:D4',
        rssi: -58,
        uptimeSeconds: 86420,
        freeHeapKb: 184,
        firmwareVersion: 'v2.4.1-PG',
        lastSyncLatencyMs: 24,
        lastSyncTime: timeStr,
      },
      alerts: [
        {
          id: 'alt-1',
          timestamp: '10:30 AM',
          type: 'INFO',
          sensor: 'SERVO',
          title: 'Scheduled Feeding Completed',
          message: 'Morning feed dispensed: 4.5kg mash pellets delivered successfully.',
          acknowledged: true,
          resolved: true,
        },
        {
          id: 'alt-2',
          timestamp: '08:15 AM',
          type: 'INFO',
          sensor: 'ESP32',
          title: 'ESP32 Telemetry Synchronized',
          message: 'Connected to primary Wi-Fi network (SSID: PoultryFarm_IoT).',
          acknowledged: true,
          resolved: true,
        },
      ],
      telemetryHistory: history,
      feedingSchedules: [
        { id: 'sch-1', label: 'Morning Feeding', time: '06:30 AM', enabled: true, portionGrams: 4500 },
        { id: 'sch-2', label: 'Afternoon Feeding', time: '12:30 PM', enabled: true, portionGrams: 3500 },
        { id: 'sch-3', label: 'Evening Feeding', time: '06:30 PM', enabled: true, portionGrams: 4500 },
      ],
      feedingHistory: [
        { id: 'fh-1', timestamp: '06:30 AM', mealName: 'Morning Feeding', status: 'COMPLETED', portionGrams: 4500 },
        { id: 'fh-2', timestamp: '10:30 AM', mealName: 'Nutritional Boost', status: 'MANUAL', portionGrams: 1200 },
      ],
      emergencyEvents: [
        { id: 'em-1', timestamp: '10:42:11', event: 'Gas level micro-fluctuation detected (280 ppm)', sensor: 'MQ-2', severity: 'NORMAL' },
        { id: 'em-2', timestamp: '10:43:20', event: 'Gas returned to nominal baseline', sensor: 'MQ-2', severity: 'NORMAL' },
        { id: 'em-3', timestamp: '10:50:04', event: 'Perimeter IR sweep: All sectors secure', sensor: 'IR Barrier', severity: 'NORMAL' },
      ],
      settings: {
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
      },
      activeScenario: 'NORMAL',
      aiInsight: 'Environmental conditions and bird distribution are optimal. Ambient ventilation is maintaining healthy air exchange.',
      lastSyncedTimestamp: Date.now(),
      isHardwareConnected: false,
      dataSource: 'SIMULATION',
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.state.lastSyncedTimestamp = Date.now();
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): PoultryState {
    return this.state;
  }

  private startSimulation() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.simulatePhysicsStep();
    }, 2000);
  }

  private simulatePhysicsStep() {
    // If live hardware/Wokwi is sending data, don't overwrite with mock simulation
    if (this.state.isHardwareConnected && this.state.dataSource === 'WOKWI_HARDWARE') {
      if (Date.now() - this.state.lastSyncedTimestamp < 15000) {
        return;
      } else {
        // Hardware stream timed out, fall back to simulation mode
        this.state.isHardwareConnected = false;
        this.state.dataSource = 'SIMULATION';
      }
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const { activeScenario, settings } = this.state;

    let targetTemp = 28.4;
    let targetHum = 67;
    let targetGas = 245;
    let targetAct = 74;

    // Handle Active Scenarios
    if (activeScenario === 'HIGH_TEMP') {
      targetTemp = 35.6;
      targetHum = 54;
      targetGas = 290;
      targetAct = 42; // Birds panting/inactive
    } else if (activeScenario === 'HIGH_GAS') {
      targetTemp = 29.1;
      targetHum = 72;
      targetGas = 585; // Ammonia spike
      targetAct = 36;
    } else if (activeScenario === 'INTRUSION') {
      targetTemp = 28.5;
      targetHum = 66;
      targetGas = 248;
      targetAct = 95; // Flock panic dispersal
    } else if (activeScenario === 'FIRE') {
      targetTemp = 42.8;
      targetHum = 40;
      targetGas = 620;
      targetAct = 98; // Extreme commotion
    } else if (activeScenario === 'ABNORMAL_INACTIVITY') {
      targetTemp = 28.2;
      targetHum = 66;
      targetGas = 240;
      targetAct = 18; // Very low movement
    } else if (activeScenario === 'SENSOR_FAULT') {
      targetTemp = 78.5; // Extreme abnormal temperature spike (impossible in normal poultry shed)
      targetHum = 8;     // Extreme abnormal low humidity
      targetGas = 1420;  // Out-of-bounds gas sensor reading
      targetAct = 50;
    }

    // Realistic gradual walk towards target (smooth dampening)
    const prevTemp = this.state.dht11.temperature;
    const nextTemp = Number((prevTemp + (targetTemp - prevTemp) * 0.15 + (Math.random() * 0.1 - 0.05)).toFixed(1));
    const tempTrend = Number((nextTemp - prevTemp).toFixed(1));

    const prevHum = this.state.dht11.humidity;
    const nextHum = Math.round(prevHum + (targetHum - prevHum) * 0.15 + (Math.random() * 0.8 - 0.4));

    const prevGas = this.state.mq2.gasPpm;
    const nextGas = Math.round(prevGas + (targetGas - prevGas) * 0.2 + (Math.random() * 4 - 2));

    const prevAct = this.state.poultryActivity.movementIndex;
    const nextAct = Math.max(5, Math.min(100, Math.round(prevAct + (targetAct - prevAct) * 0.2 + (Math.random() * 4 - 2))));

    // Determine status badges based on settings
    const tempStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' =
      nextTemp >= settings.tempCriticalThreshold ? 'CRITICAL' : nextTemp >= settings.tempWarningThreshold ? 'WARNING' : 'NORMAL';

    const humStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' =
      nextHum > settings.humMaxThreshold || nextHum < settings.humMinThreshold ? 'WARNING' : 'NORMAL';

    const gasStatus: 'SAFE' | 'WARNING' | 'CRITICAL' =
      nextGas >= settings.gasCriticalThreshold ? 'CRITICAL' : nextGas >= settings.gasWarningThreshold ? 'WARNING' : 'SAFE';

    let actStatus: 'NORMAL' | 'HIGH' | 'LOW' | 'ABNORMAL_INACTIVE' = 'NORMAL';
    if (nextAct < 25) actStatus = 'ABNORMAL_INACTIVE';
    else if (nextAct > 85) actStatus = 'HIGH';
    else if (nextAct < 45) actStatus = 'LOW';

    // Global farm status & health
    let farmStatus: 'NORMAL' | 'WARNING' | 'EMERGENCY' = 'NORMAL';
    let healthScore = 98;

    if (this.state.flame.detected || activeScenario === 'FIRE') {
      farmStatus = 'EMERGENCY';
      healthScore = 32;
    } else if (this.state.ir.intrusionDetected || activeScenario === 'INTRUSION') {
      farmStatus = 'WARNING';
      healthScore = 65;
    } else if (tempStatus === 'CRITICAL' || gasStatus === 'CRITICAL') {
      farmStatus = 'EMERGENCY';
      healthScore = 48;
    } else if (tempStatus === 'WARNING' || gasStatus === 'WARNING' || humStatus === 'WARNING' || actStatus === 'ABNORMAL_INACTIVE') {
      farmStatus = 'WARNING';
      healthScore = 78;
    }

    // Dynamic AI insight generation based on current environmental situation
    let aiInsight = 'Environmental conditions are currently within the configured safe range.';
    if (this.state.flame.detected || activeScenario === 'FIRE') {
      aiInsight = '🚨 CRITICAL HAZARD: Thermal flame signature detected! Ventilation fans should engage emergency exhaust. Immediate human dispatch required.';
    } else if (this.state.ir.intrusionDetected || activeScenario === 'INTRUSION') {
      aiInsight = '⚠️ SECURITY ALERT: Perimeter IR boundary tripped. Flock movement indicates clustering away from North entryway. Inspect immediately.';
    } else if (tempStatus === 'CRITICAL') {
      aiInsight = `🔥 HEAT STRESS WARNING: Temperature (${nextTemp}°C) exceeds critical limit (${settings.tempCriticalThreshold}°C). Boost exhaust fans & evaporative cooling pads.`;
    } else if (gasStatus === 'CRITICAL') {
      aiInsight = `💨 HAZARDOUS GAS DETECTED: MQ-2 sensor reading ${nextGas} ppm ammonia/CO buildup. Litter moisture check and maximum air exchange recommended.`;
    } else if (tempStatus === 'WARNING') {
      aiInsight = `Temperature is slightly elevated (${nextTemp}°C). Increase ventilation if the condition persists.`;
    } else if (gasStatus === 'WARNING') {
      aiInsight = `Ammonia concentration is rising (${nextGas} ppm). Verify litter dryness and cross-ventilation dampers.`;
    } else if (actStatus === 'ABNORMAL_INACTIVE') {
      aiInsight = `Flock mobility index is abnormally low (${nextAct}%). Suspected thermal sluggishness or feeding lull. Review flock visually.`;
    }

    // Update telemetry history (max 30 points)
    const newHistory = [
      ...this.state.telemetryHistory.slice(this.state.telemetryHistory.length > 28 ? 1 : 0),
      {
        time: timeStr,
        temperature: nextTemp,
        humidity: nextHum,
        gasPpm: nextGas,
        activityIndex: nextAct,
      },
    ];

    const prevTempStatus = this.state.dht11.tempStatus;
    const prevGasStatus = this.state.mq2.status;

    this.state = {
      ...this.state,
      farmStatus,
      overallFarmHealth: healthScore,
      dht11: {
        ...this.state.dht11,
        temperature: nextTemp,
        humidity: nextHum,
        tempStatus,
        humidityStatus: humStatus,
        tempTrend,
        lastUpdated: timeStr,
      },
      mq2: {
        ...this.state.mq2,
        gasPpm: nextGas,
        status: gasStatus,
        trend: nextGas - prevGas,
        lastUpdated: timeStr,
      },
      poultryActivity: {
        ...this.state.poultryActivity,
        movementIndex: nextAct,
        status: actStatus,
        flockDistribution: activeScenario === 'INTRUSION' ? 'CLUSTERED' : activeScenario === 'FIRE' ? 'PERIMETER' : 'UNIFORM',
        lastAssessed: timeStr,
      },
      esp32: {
        ...this.state.esp32,
        uptimeSeconds: this.state.esp32.uptimeSeconds + 2,
        lastSyncLatencyMs: Math.round(22 + Math.random() * 8),
        lastSyncTime: timeStr,
      },
      telemetryHistory: newHistory,
      aiInsight,
    };

    // -------------------------------------------------------------
    // Telegram Alert Crossings & RECOVERY / RESOLVED Notifications
    // -------------------------------------------------------------

    // Temperature Exceeded
    if (tempStatus === 'CRITICAL' && prevTempStatus !== 'CRITICAL') {
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'DHT11 CLIMATE SENSOR',
        title: '🌡️ CRITICAL TEMPERATURE — HEAT STRESS ALERT',
        message: `Shed temperature climbed to ${nextTemp}°C, exceeding the critical limit of ${settings.tempCriticalThreshold}°C. Broiler heat stress and mortality risk is HIGH.`,
        value: `${nextTemp}°C / ${nextHum}% RH`,
        threshold: `Critical: ${settings.tempCriticalThreshold}°C | Warning: ${settings.tempWarningThreshold}°C`,
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Boost tunnel exhaust fan RPM, activate evaporative cooling pads, and supplement electrolytes in drinker water.',
      });
    } else if (tempStatus === 'WARNING' && prevTempStatus === 'NORMAL') {
      telegramService.sendAlert({
        severity: 'WARNING',
        sensor: 'DHT11 CLIMATE SENSOR',
        title: '⚠️ TEMPERATURE WARNING — Approaching Danger Zone',
        message: `Shed temperature is rising (${nextTemp}°C) and has crossed the warning threshold (${settings.tempWarningThreshold}°C). Monitor closely.`,
        value: `${nextTemp}°C / ${nextHum}% RH`,
        threshold: `Warning: ${settings.tempWarningThreshold}°C`,
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Increase ventilation speed. Check cooling pad water supply.',
      });
    } else if (tempStatus === 'NORMAL' && (prevTempStatus === 'CRITICAL' || prevTempStatus === 'WARNING')) {
      // TEMPERATURE HAS COOLED DOWN & NORMALIZED
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'DHT11 CLIMATE SENSOR',
        title: '✅ TEMPERATURE RESTORED — Broiler Shed Cooled Down',
        message: `Great news! Shed ambient temperature has cooled down to ${nextTemp}°C, well within the safe comfort range. Heat stress danger has subsided.`,
        value: `${nextTemp}°C / ${nextHum}% RH`,
        threshold: `Nominal Safe Comfort Range: 20.0°C – ${settings.tempWarningThreshold}°C`,
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Resume normal ventilation cycles. Maintain fresh water availability.',
      });
    }

    // Ammonia / Toxic Gas Exceeded
    if (gasStatus === 'CRITICAL' && prevGasStatus !== 'CRITICAL') {
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'MQ-2 GAS / AMMONIA SENSOR',
        title: '💨 CRITICAL AMMONIA SPIKE — TOXIC HAZARD',
        message: `MQ-2 gas sensor detected ${nextGas} ppm ammonia/CO concentration, exceeding the critical limit of ${settings.gasCriticalThreshold} ppm. Immediate ventilation required!`,
        value: `${nextGas} ppm NH3`,
        threshold: `Critical: ${settings.gasCriticalThreshold} ppm | Warning: ${settings.gasWarningThreshold} ppm`,
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Run all exhaust fans at 100% capacity, inspect litter for moisture, top-dress with dry wood shavings.',
      });
    } else if (gasStatus === 'WARNING' && prevGasStatus === 'SAFE') {
      telegramService.sendAlert({
        severity: 'WARNING',
        sensor: 'MQ-2 GAS / AMMONIA SENSOR',
        title: '⚠️ AMMONIA LEVEL RISING — Attention Required',
        message: `Ammonia concentration has reached ${nextGas} ppm and crossed the warning threshold (${settings.gasWarningThreshold} ppm). Ventilation check needed.`,
        value: `${nextGas} ppm NH3`,
        threshold: `Warning: ${settings.gasWarningThreshold} ppm`,
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Verify litter dryness, check cross-ventilation dampers, increase air exchange rate.',
      });
    } else if (gasStatus === 'SAFE' && (prevGasStatus === 'CRITICAL' || prevGasStatus === 'WARNING')) {
      // GAS / AMMONIA HAS NORMALIZED
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'MQ-2 GAS / AMMONIA SENSOR',
        title: '✅ AIR QUALITY RESTORED — Ammonia Levels Back to Normal',
        message: `Air purification and ventilation successful! Ammonia/CO concentration dropped to safe nominal level of ${nextGas} ppm. Atmospheric toxicity hazard cleared.`,
        value: `${nextGas} ppm NH3 (Safe Baseline)`,
        threshold: `Safe Operating Limit: < ${settings.gasWarningThreshold} ppm`,
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Return exhaust fans to standard automated cycling. Routine monitoring continues.',
      });
    }

    this.notify();
  }

  // Judge Demo Mode Triggers
  public triggerScenario(scenario: DemoScenario) {
    if (this.scenarioTimer) {
      clearTimeout(this.scenarioTimer);
      this.scenarioTimer = null;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (scenario === 'NORMAL') {
      this.resetToNormal();
      return;
    }

    soundService.playClick();

    if (scenario === 'FIRE') {
      soundService.startFireSiren();
      const newAlert: FarmAlert = {
        id: `fire-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'FLAME',
        title: '🚨 FIRE HAZARD DETECTED',
        message: 'Optical flame sensor detected active infrared flame radiation in Zone 2. Master alarm tripped!',
        acknowledged: false,
        resolved: false,
      };

      // Dispatch real-time Telegram Bot Notification
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'YG1006 FLAME SENSOR',
        title: '🔥 ACTIVE FLAME DETECTED IN ZONE 2',
        message: 'Optical infrared spectrum sensor detected active flame. High thermal spike recorded. Evacuation protocol initiated.',
        value: '4.82 V (Flame Present)',
        threshold: '< 1.50 V (Safe Limit)',
        zone: 'Zone 2 — Central Brooding Sector',
        actionRequired: 'Immediately trigger deluge misting, isolate electrical mains, and evacuate personnel.',
      });

      this.state.flame = {
        detected: true,
        status: 'DETECTED',
        rawVoltage: 4.82,
        lastUpdated: timeStr,
        lastAlarmTime: timeStr,
      };
      this.state.activeScenario = 'FIRE';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'EMERGENCY: Flame detector tripped in Zone 2',
        sensor: 'FLAME',
        severity: 'CRITICAL',
      });
    } else if (scenario === 'HIGH_TEMP') {
      soundService.playWarningChime();
      const newAlert: FarmAlert = {
        id: `temp-${Date.now()}`,
        timestamp: timeStr,
        type: 'WARNING',
        sensor: 'DHT11',
        title: 'High Temperature Threshold Exceeded',
        message: 'Ambient heat index reached 35.6°C. Risk of broiler heat stress.',
        acknowledged: false,
        resolved: false,
      };

      // Dispatch Telegram Notification
      telegramService.sendAlert({
        severity: 'WARNING',
        sensor: 'DHT11 CLIMATE NODE',
        title: '🌡️ HIGH TEMPERATURE THRESHOLD EXCEEDED',
        message: 'Ambient shed temperature reached 35.6°C. Elevated risk of broiler panting, respiratory alkalosis, and mortality.',
        value: '35.6°C / 78% Humidity',
        threshold: 'Max Safe Limit: 30.0°C',
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Boost tunnel exhaust fan RPM, activate evaporative cooling pads, and supplement electrolytes in drinker water.',
      });

      this.state.activeScenario = 'HIGH_TEMP';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'Thermal elevation above comfort boundary (35.6°C)',
        sensor: 'DHT11',
        severity: 'WARNING',
      });
    } else if (scenario === 'HIGH_GAS') {
      soundService.playWarningChime();
      const newAlert: FarmAlert = {
        id: `gas-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'MQ2',
        title: 'Hazardous Ammonia / Gas Spike',
        message: 'MQ-2 sensor reported 585 ppm toxic gas accumulation. Air quality hazardous.',
        acknowledged: false,
        resolved: false,
      };
      this.state.activeScenario = 'HIGH_GAS';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'Gas concentration spike: 585 ppm ammonia',
        sensor: 'MQ-2',
        severity: 'CRITICAL',
      });
      // Dispatch Telegram Notification
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'MQ-2 GAS / AMMONIA SENSOR',
        title: '💨 CRITICAL AMMONIA SPIKE — 585 PPM DETECTED',
        message: 'MQ-2 sensor recorded 585 ppm toxic ammonia accumulation in the shed. This is well above the safe limit and poses risk of tracheal lesions and flock suffocation.',
        value: '585 ppm NH3',
        threshold: 'Critical Limit: 480 ppm | Safe: < 350 ppm',
        zone: 'Zone 3 — Rearing & Litter Area',
        actionRequired: 'Run all exhaust fans at 100% capacity, inspect litter for moisture, top-dress with dry wood shavings, reduce stocking density.',
      });
    } else if (scenario === 'INTRUSION') {
      soundService.playWarningChime();
      const newAlert: FarmAlert = {
        id: `ir-${Date.now()}`,
        timestamp: timeStr,
        type: 'WARNING',
        sensor: 'IR',
        title: '⚠️ Perimeter Security Breach Detected',
        message: 'IR optical barrier broken at South-East Boundary Fence. Potential wild bird/predator access.',
        acknowledged: false,
        resolved: false,
      };

      // Dispatch Telegram Notification
      telegramService.sendAlert({
        severity: 'WARNING',
        sensor: 'IR PERIMETER TRIPWIRE',
        title: '🚨 PERIMETER INTRUSION DETECTED',
        message: 'Infrared optical barrier beam interrupted. Potential predator entry or biosecurity boundary breach.',
        value: 'Beam State: BROKEN (Triggered)',
        threshold: 'Continuous 38kHz Modulated Beam',
        zone: 'Zone 4 — South-East Boundary Fence',
        actionRequired: 'Inspect security camera feeds and check perimeter fencing for breaches.',
      });

      this.state.ir = {
        intrusionDetected: true,
        status: 'BREACH',
        zone: 'South-East Boundary Fence',
        lastUpdated: timeStr,
      };
      this.state.activeScenario = 'INTRUSION';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'SECURITY: Perimeter IR tripwire breach detected',
        sensor: 'IR',
        severity: 'WARNING',
      });
    } else if (scenario === 'FEEDER') {
      this.dispenseFeeder(1500, 'Demonstration Cycle');
      return;
    } else if (scenario === 'ABNORMAL_INACTIVITY') {
      soundService.playWarningChime();
      const newAlert: FarmAlert = {
        id: `act-${Date.now()}`,
        timestamp: timeStr,
        type: 'WARNING',
        sensor: 'AI',
        title: 'Abnormal Flock Inactivity Detected',
        message: 'Vision tracking reports flock movement drop below 20%. Potential lethargy or chilling.',
        acknowledged: false,
        resolved: false,
      };
      this.state.activeScenario = 'ABNORMAL_INACTIVITY';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'AI Vision Alert: Flock mobility index dropped to 18%',
        sensor: 'AI Vision',
        severity: 'WARNING',
      });
    } else if (scenario === 'SENSOR_FAULT') {
      soundService.playWarningChime();
      const newAlert: FarmAlert = {
        id: `fault-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'DHT11',
        title: '⚠️ HARDWARE SENSOR ABNORMALITY DETECTED',
        message: 'Telemetry readings jumped outside standard physical detection envelopes: DHT11 reported 78.5°C, MQ-2 reported 1420 ppm. Potential sensor short/fault.',
        acknowledged: false,
        resolved: false,
      };

      // Set instantaneous abnormal values
      this.state.dht11 = {
        ...this.state.dht11,
        temperature: 78.5,
        humidity: 8,
        tempStatus: 'CRITICAL',
        humidityStatus: 'CRITICAL',
        lastUpdated: timeStr,
      };
      this.state.mq2 = {
        ...this.state.mq2,
        gasPpm: 1420,
        status: 'CRITICAL',
        lastUpdated: timeStr,
      };
      this.state.activeScenario = 'SENSOR_FAULT';
      this.state.alerts = [newAlert, ...this.state.alerts];
      this.state.emergencyEvents.unshift({
        id: `ev-${Date.now()}`,
        timestamp: timeStr,
        event: 'DIAGNOSTIC ALERT: Abnormal sensor telemetry detected (DHT11: 78.5°C, MQ-2: 1420 ppm)',
        sensor: 'Edge Node Diagnostician',
        severity: 'CRITICAL',
      });

      // Also send Telegram Notification regarding sensor malfunction
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'EDGE SENSOR NODE #04',
        title: '⚠️ HARDWARE FAULT: ABNORMAL SENSOR READINGS',
        message: 'Gemini AI Diagnostics identified physical telemetry anomalies: DHT11 reporting 78.5°C (exceeds physical limits), MQ-2 reporting 1420 ppm. Microcontroller ADC channel or sensor wiring fault suspected.',
        value: 'Temp: 78.5°C | Gas: 1420 ppm',
        threshold: 'Physical Range: 0°C – 50°C | 50 – 1000 ppm',
        zone: 'Hardware Node Bus (GPIO 4 / ADC A0)',
        actionRequired: 'Inspect physical wiring on DHT11 and MQ-2 sensors. Recalibrate ADC trimpot or swap faulty sensor module.',
      });
    }

    this.notify();
  }

  public resetToNormal() {
    soundService.stopSiren();
    soundService.playClick();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const prevScenario = this.state.activeScenario;
    this.state.activeScenario = 'NORMAL';
    this.state.flame = {
      detected: false,
      status: 'SAFE',
      rawVoltage: 0.12,
      lastUpdated: timeStr,
    };
    this.state.ir = {
      intrusionDetected: false,
      status: 'SECURE',
      zone: 'North Perimeter Barrier',
      lastUpdated: timeStr,
    };
    this.state.feeder = {
      ...this.state.feeder,
      status: 'CLOSED',
      servoAngle: 0,
    };
    this.state.farmStatus = 'NORMAL';
    this.state.overallFarmHealth = 98;
    this.state.emergencyEvents.unshift({
      id: `ev-${Date.now()}`,
      timestamp: timeStr,
      event: 'System restored to nominal operating parameters',
      sensor: 'Controller',
      severity: 'NORMAL',
    });

    // Send Telegram Recovery Notification depending on what was resolved
    if (prevScenario === 'FIRE') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'YG1006 FLAME SENSOR',
        title: '✅ FIRE HAZARD CLEARED & EXTINGUISHED',
        message: 'Flame detector reports 0 infrared radiation. Fire risk has been fully mitigated. Deluge systems and ventilation have returned to standby.',
        value: '0.12 V (Normal / No Flame)',
        threshold: '< 1.50 V (Safe Limit)',
        zone: 'Zone 2 — Central Brooding Sector',
        actionRequired: 'Inspect area for residual smoke, verify bird flock status, resume standard production operations.',
      });
    } else if (prevScenario === 'HIGH_GAS') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'MQ-2 GAS / AMMONIA SENSOR',
        title: '✅ AMMONIA GAS CONCENTRATION NORMALIZED',
        message: 'Litter ventilation cycle complete. Ammonia/CO levels have dropped back down to baseline safe limits. Air quality is clean.',
        value: '245 ppm NH3 (Safe Baseline)',
        threshold: 'Safe Limit: < 350 ppm',
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Automated fans returned to energy-efficient cycle. Flock respiratory conditions safe.',
      });
    } else if (prevScenario === 'HIGH_TEMP') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'DHT11 CLIMATE NODE',
        title: '✅ SHED TEMPERATURE COOLED DOWN TO NORMAL',
        message: 'Cooling pads and tunnel ventilation have successfully lowered shed temperature into the optimal comfort zone (28.4°C). Broiler heat stress averted.',
        value: '28.4°C / 67% RH',
        threshold: 'Safe Zone: 20.0°C – 31.0°C',
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Maintain fresh drinking water. Environmental setpoints verified normal.',
      });
    } else if (prevScenario === 'INTRUSION') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'IR PERIMETER TRIPWIRE',
        title: '✅ PERIMETER SECURED — Boundary Intact',
        message: 'Infrared tripwire sweep confirms all sector boundaries are secure and uninterrupted. No intruders or predators detected.',
        value: 'Beam State: CONTINUOUS (Secure)',
        threshold: 'Active 38kHz IR Barrier',
        zone: 'Zone 4 — South-East Boundary Fence',
        actionRequired: 'Perimeter sweep logged as nominal. Biosecurity perimeter re-established.',
      });
    } else if (prevScenario === 'ABNORMAL_INACTIVITY') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'AI VISION SYSTEM',
        title: '✅ FLOCK MOBILITY RESTORED TO NORMAL',
        message: 'Vision tracking indicates flock movement index has returned above 70%. Birds actively feeding and drinking across all feeding lines.',
        value: 'Mobility Index: 74% (Uniform)',
        threshold: 'Optimal Mobility: > 45%',
        zone: 'All Sectors — Shed Floor Distribution',
        actionRequired: 'All behavioral metrics optimal. Routine monitoring active.',
      });
    } else if (prevScenario === 'SENSOR_FAULT') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'EDGE SENSOR NODE #04',
        title: '✅ HARDWARE SENSOR RECALIBRATION COMPLETE',
        message: 'All sensor analog channels and digital buses restored to nominal calibration ranges (DHT11: 28.4°C, MQ-2: 245 ppm). Edge node health 98% nominal.',
        value: 'Telemetry Nominal (0 Faults)',
        threshold: 'Nominal Operational Detection Envelope',
        zone: 'Hardware Node Bus (GPIO 4 / ADC A0)',
        actionRequired: 'All edge components healthy. Standard data streaming active.',
      });
    }

    this.notify();
  }

  // Feeder Controls
  public dispenseFeeder(grams = 2000, mealName = 'Manual Dispense') {
    soundService.playFeederCycle();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.state.feeder = {
      ...this.state.feeder,
      status: 'DISPENSING',
      servoAngle: 90,
      lastFeedingTime: timeStr,
      dispenseCountToday: this.state.feeder.dispenseCountToday + 1,
      hopperLevel: Math.max(10, this.state.feeder.hopperLevel - 3),
    };

    this.state.feedingHistory.unshift({
      id: `fh-${Date.now()}`,
      timestamp: timeStr,
      mealName,
      status: 'MANUAL',
      portionGrams: grams,
    });

    this.state.emergencyEvents.unshift({
      id: `ev-${Date.now()}`,
      timestamp: timeStr,
      event: `Feeder cycle activated: ${grams}g dispensed (Servo: 90°)`,
      sensor: 'Feeder Servo',
      severity: 'NORMAL',
    });

    this.notify();

    // Auto-close servo after 3 seconds
    setTimeout(() => {
      this.state.feeder = {
        ...this.state.feeder,
        status: 'CLOSED',
        servoAngle: 0,
      };
      this.notify();
    }, 3200);
  }

  public setFeederServo(angle: number) {
    soundService.playClick();
    this.state.feeder = {
      ...this.state.feeder,
      servoAngle: angle,
      status: angle > 10 ? 'OPEN' : 'CLOSED',
    };
    this.notify();
  }

  public setFeederMode(mode: 'AUTOMATIC' | 'MANUAL') {
    soundService.playClick();
    this.state.feeder = {
      ...this.state.feeder,
      mode,
    };
    this.notify();
  }

  public addFeedingSchedule(item: FeedingScheduleItem) {
    this.state.feedingSchedules.push(item);
    this.notify();
  }

  public removeFeedingSchedule(id: string) {
    this.state.feedingSchedules = this.state.feedingSchedules.filter((s) => s.id !== id);
    this.notify();
  }

  public toggleFeedingSchedule(id: string) {
    this.state.feedingSchedules = this.state.feedingSchedules.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    this.notify();
  }

  // Alerts Management
  public acknowledgeAlert(id: string) {
    soundService.playClick();
    this.state.alerts = this.state.alerts.map((alt) =>
      alt.id === id ? { ...alt, acknowledged: true } : alt
    );
    this.notify();
  }

  public resolveAlert(id: string) {
    soundService.playClick();
    this.state.alerts = this.state.alerts.map((alt) =>
      alt.id === id ? { ...alt, acknowledged: true, resolved: true } : alt
    );
    this.notify();
  }

  public acknowledgeAllAlerts() {
    soundService.playClick();
    this.state.alerts = this.state.alerts.map((alt) => ({ ...alt, acknowledged: true }));
    this.notify();
  }

  // Settings Management
  public updateSettings(newSettings: Partial<FarmSettings>) {
    soundService.playClick();
    this.state.settings = { ...this.state.settings, ...newSettings };
    if (newSettings.soundAlertsEnabled !== undefined) {
      soundService.enabled = newSettings.soundAlertsEnabled;
    }
    this.notify();
  }

  // Live Backend Polling (Wokwi / ESP32 Bridge)
  private startApiPolling() {
    if (this.apiPollTimer) clearInterval(this.apiPollTimer);
    this.apiPollTimer = setInterval(() => {
      this.fetchSensorDataFromApi();
    }, 2000);
  }

  private async fetchSensorDataFromApi() {
    try {
      const res = await fetch('/api/sensor-data');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.isHardwareConnected && json.packetCount > 0) {
        this.applyHardwareSensorData(json);
      }
    } catch {
      // Backend not reached or offline, silent fallback
    }
  }

  public applyHardwareSensorData(data: {
    temperature: number;
    humidity: number;
    gas: number;
    flame: number;
    ir: number;
    feeder: number;
    formattedTime?: string;
  }) {
    const now = new Date();
    const timeStr = data.formattedTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const { settings } = this.state;

    const temp = Number(Number(data.temperature).toFixed(1));
    const hum = Number(Number(data.humidity).toFixed(1));
    const gas = Math.round(Number(data.gas));
    const flameDetected = Number(data.flame) === 1 || Number(data.flame) > 0;
    const intrusionDetected = Number(data.ir) === 1 || Number(data.ir) > 0;
    const feederAngle = Number(data.feeder) || 0;
    const feederStatus = feederAngle > 0 ? 'OPEN' : 'CLOSED';

    // Evaluate thresholds based on configured settings
    const tempStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' =
      temp >= settings.tempCriticalThreshold ? 'CRITICAL' : temp >= settings.tempWarningThreshold ? 'WARNING' : 'NORMAL';

    const humStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' =
      hum > settings.humMaxThreshold || hum < settings.humMinThreshold ? 'WARNING' : 'NORMAL';

    const gasStatus: 'SAFE' | 'WARNING' | 'CRITICAL' =
      gas >= settings.gasCriticalThreshold ? 'CRITICAL' : gas >= settings.gasWarningThreshold ? 'WARNING' : 'SAFE';

    // Global farm status & health
    let farmStatus: 'NORMAL' | 'WARNING' | 'EMERGENCY' = 'NORMAL';
    let healthScore = 98;

    if (flameDetected) {
      farmStatus = 'EMERGENCY';
      healthScore = 20;
      soundService.startFireSiren();
    } else if (intrusionDetected) {
      farmStatus = 'WARNING';
      healthScore = 60;
      soundService.playWarningChime();
    } else if (tempStatus === 'CRITICAL' || gasStatus === 'CRITICAL') {
      farmStatus = 'EMERGENCY';
      healthScore = 40;
    } else if (tempStatus === 'WARNING' || gasStatus === 'WARNING' || humStatus === 'WARNING') {
      farmStatus = 'WARNING';
      healthScore = 75;
    }

    // Dynamic AI Insight
    let aiInsight = 'Environmental conditions are currently within the configured safe range.';
    if (flameDetected) {
      aiInsight = '🚨 CRITICAL HAZARD: Thermal flame signature detected by Wokwi ESP32! High risk to livestock. Immediate human dispatch required.';
    } else if (intrusionDetected) {
      aiInsight = '⚠️ SECURITY ALERT: Perimeter IR sensor beam interrupted. Inspect entryway immediately.';
    } else if (tempStatus === 'CRITICAL') {
      aiInsight = `🔥 HEAT STRESS WARNING: Temperature (${temp}°C) exceeds critical limit (${settings.tempCriticalThreshold}°C). Boost exhaust fans & evaporative cooling pads.`;
    } else if (gasStatus === 'CRITICAL') {
      aiInsight = `💨 HAZARDOUS GAS DETECTED: MQ-2 sensor reading ${gas} ppm ammonia/CO buildup. Litter moisture check and maximum air exchange recommended.`;
    } else if (tempStatus === 'WARNING') {
      aiInsight = `Temperature is slightly elevated (${temp}°C). Increase ventilation if condition persists.`;
    } else if (gasStatus === 'WARNING') {
      aiInsight = `Ammonia concentration is rising (${gas} ppm). Verify litter dryness.`;
    }

    // Update alerts if threshold breaches occur
    const newAlerts = [...this.state.alerts];
    if (flameDetected && !this.state.flame.detected) {
      newAlerts.unshift({
        id: `flame-wokwi-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'FLAME',
        title: '🚨 FIRE DETECTED (WOKWI ESP32)',
        message: 'Active flame sensor triggered in Wokwi simulator! Emergency protocols initiated.',
        acknowledged: false,
        resolved: false,
      });
      // Telegram alert for hardware flame
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'YG1006 FLAME SENSOR (ESP32)',
        title: '🔥 ACTIVE FIRE DETECTED — EMERGENCY',
        message: 'Optical flame sensor on ESP32 hardware node detected active flame radiation. Emergency protocol triggered. Livestock at immediate risk!',
        value: '4.8 V (Flame Confirmed)',
        threshold: '< 1.50 V (Safe Limit)',
        zone: 'Zone 2 — Central Brooding Sector',
        actionRequired: 'Immediately trigger deluge misting, isolate electrical mains, evacuate personnel, and call emergency services.',
      });
    }
    if (gasStatus === 'CRITICAL' && this.state.mq2.status !== 'CRITICAL') {
      newAlerts.unshift({
        id: `gas-wokwi-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'MQ2',
        title: '⚠️ CRITICAL GAS SPIKE (WOKWI ESP32)',
        message: `MQ-2 sensor reported ${gas} ppm. Toxic hazard threshold exceeded!`,
        acknowledged: false,
        resolved: false,
      });
      // Telegram alert for hardware gas critical
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'MQ-2 GAS SENSOR (ESP32)',
        title: '💨 CRITICAL AMMONIA / GAS CONCENTRATION',
        message: `MQ-2 electrochemical sensor (ESP32 hardware) recorded ${gas} ppm. Toxic ammonia/CO accumulation exceeds safe limits. Immediate ventilation required!`,
        value: `${gas} ppm`,
        threshold: `Max Safe: ${settings.gasCriticalThreshold} ppm`,
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Run all exhaust fans at 100% RPM, inspect litter for excess moisture, top-dress with dry wood shavings.',
      });
    }
    if (tempStatus === 'CRITICAL' && this.state.dht11.tempStatus !== 'CRITICAL') {
      newAlerts.unshift({
        id: `temp-wokwi-${Date.now()}`,
        timestamp: timeStr,
        type: 'WARNING',
        sensor: 'DHT11',
        title: '⚠️ HIGH TEMPERATURE ALARM',
        message: `Ambient heat reached ${temp}°C, exceeding configured comfort limits!`,
        acknowledged: false,
        resolved: false,
      });
      // Telegram alert for hardware temp critical
      telegramService.sendAlert({
        severity: 'CRITICAL',
        sensor: 'DHT11 TEMPERATURE SENSOR (ESP32)',
        title: '🌡️ CRITICAL TEMPERATURE — HEAT STRESS RISK',
        message: `DHT11 sensor on ESP32 recorded ${temp}°C. Exceeds critical threshold (${settings.tempCriticalThreshold}°C). Risk of broiler panting, alkalosis, and heat mortality!`,
        value: `${temp}°C / ${hum}% RH`,
        threshold: `Critical: ${settings.tempCriticalThreshold}°C`,
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Boost tunnel exhaust fan RPM, activate evaporative cooling pads, supplement electrolytes in drinker water.',
      });
    }
    if (intrusionDetected && !this.state.ir.intrusionDetected) {
      newAlerts.unshift({
        id: `ir-wokwi-${Date.now()}`,
        timestamp: timeStr,
        type: 'CRITICAL',
        sensor: 'IR',
        title: '🚨 PERIMETER INTRUSION (WOKWI ESP32)',
        message: 'IR beam interrupted at North Entryway barrier.',
        acknowledged: false,
        resolved: false,
      });
      // Telegram alert for hardware intrusion
      telegramService.sendAlert({
        severity: 'WARNING',
        sensor: 'IR PERIMETER SENSOR (ESP32)',
        title: '🚨 PERIMETER SECURITY BREACH DETECTED',
        message: 'Infrared beam barrier on ESP32 hardware was interrupted. Potential predator entry or biosecurity boundary breach detected.',
        value: 'Beam: BROKEN (Triggered)',
        threshold: 'Continuous 38kHz Beam',
        zone: 'Zone 4 — South-East Boundary Fence',
        actionRequired: 'Inspect security camera feeds, check perimeter fencing for physical breaches immediately.',
      });
    }

    // Hardware Recovery / Resolution Notifications
    if (!flameDetected && this.state.flame.detected) {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'YG1006 FLAME SENSOR (ESP32)',
        title: '✅ FIRE HAZARD CLEARED — ESP32 Safe',
        message: 'Optical flame sensor on ESP32 reports zero thermal radiation. Fire has been extinguished and sector secured.',
        value: '0.10 V (Safe Baseline)',
        threshold: '< 1.50 V (Safe Limit)',
        zone: 'Zone 2 — Central Brooding Sector',
        actionRequired: 'Inspect brooding heaters, verify air quality, resume standard operations.',
      });
    }

    if (gasStatus === 'SAFE' && this.state.mq2.status !== 'SAFE') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'MQ-2 GAS SENSOR (ESP32)',
        title: '✅ AMMONIA LEVELS NORMALIZED — ESP32 Telemetry',
        message: `MQ-2 sensor reading dropped to ${gas} ppm. Ammonia accumulation cleared by ventilation dampers. Air quality safe.`,
        value: `${gas} ppm NH3 (Safe Baseline)`,
        threshold: `Safe Limit: < ${settings.gasWarningThreshold} ppm`,
        zone: 'Zone 4 — Manure Pit & Exhaust End',
        actionRequired: 'Ventilation fans return to standard operating cycles.',
      });
    }

    if (tempStatus === 'NORMAL' && this.state.dht11.tempStatus !== 'NORMAL') {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'DHT11 TEMPERATURE SENSOR (ESP32)',
        title: '✅ SHED TEMPERATURE NORMALIZED — Broilers Cooled Down',
        message: `DHT11 sensor reading cooled down to ${temp}°C (${hum}% RH). Heat stress risk eliminated.`,
        value: `${temp}°C / ${hum}% RH`,
        threshold: `Safe Comfort Range: 20.0°C – ${settings.tempWarningThreshold}°C`,
        zone: 'Zone 1 — North-West Ingestion Sector',
        actionRequired: 'Maintain nominal ventilation and fresh water supply.',
      });
    }

    if (!intrusionDetected && this.state.ir.intrusionDetected) {
      telegramService.sendAlert({
        severity: 'RESOLVED',
        sensor: 'IR PERIMETER SENSOR (ESP32)',
        title: '✅ PERIMETER SECURE — Optical Beam Re-established',
        message: 'IR optical barrier sweep reports continuous beam reception. Perimeter barrier intact.',
        value: 'Beam: CONTINUOUS (Restored)',
        threshold: 'Continuous 38kHz Modulated Beam',
        zone: 'Zone 4 — South-East Boundary Fence',
        actionRequired: 'Perimeter check nominal. Security perimeter active.',
      });
    }

    // Telemetry history update
    const newHistory = [
      ...this.state.telemetryHistory.slice(this.state.telemetryHistory.length > 28 ? 1 : 0),
      {
        time: timeStr,
        temperature: temp,
        humidity: hum,
        gasPpm: gas,
        activityIndex: intrusionDetected ? 95 : 74,
      },
    ];

    this.state = {
      ...this.state,
      farmStatus,
      overallFarmHealth: healthScore,
      isHardwareConnected: true,
      dataSource: 'WOKWI_HARDWARE',
      dht11: {
        ...this.state.dht11,
        temperature: temp,
        humidity: hum,
        tempStatus,
        humidityStatus: humStatus,
        tempTrend: Number((temp - this.state.dht11.temperature).toFixed(1)),
        lastUpdated: timeStr,
      },
      mq2: {
        ...this.state.mq2,
        gasPpm: gas,
        status: gasStatus,
        trend: gas - this.state.mq2.gasPpm,
        lastUpdated: timeStr,
      },
      flame: {
        detected: flameDetected,
        status: flameDetected ? 'DETECTED' : 'SAFE',
        rawVoltage: flameDetected ? 4.8 : 0.1,
        lastUpdated: timeStr,
        lastAlarmTime: flameDetected ? timeStr : this.state.flame.lastAlarmTime,
      },
      ir: {
        intrusionDetected,
        status: intrusionDetected ? 'BREACH' : 'SECURE',
        zone: 'North Perimeter Barrier',
        lastUpdated: timeStr,
        lastBreachTime: intrusionDetected ? timeStr : this.state.ir.lastBreachTime,
      },
      feeder: {
        ...this.state.feeder,
        servoAngle: feederAngle,
        status: feederStatus,
        lastFeedingTime: feederAngle > 0 ? timeStr : this.state.feeder.lastFeedingTime,
      },
      esp32: {
        ...this.state.esp32,
        online: true,
        lastSyncTime: timeStr,
      },
      alerts: newAlerts,
      telemetryHistory: newHistory,
      aiInsight,
      lastSyncedTimestamp: Date.now(),
    };

    this.notify();
  }
}

export const iotDataService = new IoTDataService();
