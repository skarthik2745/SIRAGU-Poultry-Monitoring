export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SAFE' | 'DETECTED' | 'SECURE' | 'BREACH' | 'OFFLINE';

export interface TelemetryPoint {
  time: string;
  temperature: number;
  humidity: number;
  gasPpm: number;
  activityIndex: number;
}

export interface DHT11Data {
  temperature: number;
  humidity: number;
  tempStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  humidityStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  tempTrend: number; // e.g. +0.2
  lastUpdated: string;
  safeTempRange: [number, number];
  safeHumRange: [number, number];
}

export interface MQ2Data {
  gasPpm: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  trend: number;
  lastUpdated: string;
  safeThreshold: number;
  warningThreshold: number;
}

export interface FlameSensorData {
  detected: boolean;
  status: 'SAFE' | 'DETECTED';
  rawVoltage: number;
  lastUpdated: string;
  lastAlarmTime?: string;
}

export interface IRSensorData {
  intrusionDetected: boolean;
  status: 'SECURE' | 'BREACH';
  zone: string;
  lastUpdated: string;
  lastBreachTime?: string;
}

export interface FeederData {
  status: 'CLOSED' | 'OPEN' | 'DISPENSING';
  servoAngle: number; // 0 to 180
  hopperLevel: number; // 0 to 100 %
  mode: 'AUTOMATIC' | 'MANUAL';
  lastFeedingTime: string;
  nextFeedingTime: string;
  dispenseCountToday: number;
}

export interface PoultryActivityData {
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'ABNORMAL_INACTIVE';
  movementIndex: number; // 0 to 100
  flockDistribution: 'UNIFORM' | 'CLUSTERED' | 'PERIMETER';
  birdsDetected: number;
  lastAssessed: string;
}

export interface ESP32Status {
  online: boolean;
  ip: string;
  macAddress: string;
  rssi: number; // dBm e.g. -58
  uptimeSeconds: number;
  freeHeapKb: number;
  firmwareVersion: string;
  lastSyncLatencyMs: number;
  lastSyncTime: string;
}

export interface FarmAlert {
  id: string;
  timestamp: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  sensor: 'FLAME' | 'MQ2' | 'DHT11' | 'IR' | 'SERVO' | 'ESP32' | 'AI';
  title: string;
  message: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface FeedingScheduleItem {
  id: string;
  label: string;
  time: string; // "06:30 AM"
  enabled: boolean;
  portionGrams: number;
}

export interface FeedingHistoryItem {
  id: string;
  timestamp: string;
  mealName: string;
  status: 'COMPLETED' | 'MANUAL' | 'SCHEDULED' | 'FAILED';
  portionGrams: number;
}

export interface EmergencyEvent {
  id: string;
  timestamp: string;
  event: string;
  sensor: string;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface FarmSettings {
  farmName: string;
  poultryUnitName: string;
  tempWarningThreshold: number;
  tempCriticalThreshold: number;
  humMinThreshold: number;
  humMaxThreshold: number;
  gasWarningThreshold: number;
  gasCriticalThreshold: number;
  soundAlertsEnabled: boolean;
  simulationMode: boolean;
  mqttBrokerUrl: string;
  esp32IpAddress: string;
  theme: 'dark' | 'light';
}

export interface AIImageInspection {
  id: string;
  imageUrl: string;
  imageName: string;
  timestamp: string;
  prediction: 'ALIVE' | 'SUSPECTED_DEAD' | 'LETHARGIC';
  confidence: number; // 0 to 100%
  movementScore: number;
  postureAssessment: string;
  notes: string;
}

export type DemoScenario =
  | 'NORMAL'
  | 'HIGH_TEMP'
  | 'HIGH_GAS'
  | 'INTRUSION'
  | 'FIRE'
  | 'FEEDER'
  | 'ABNORMAL_INACTIVITY'
  | 'SENSOR_FAULT';
