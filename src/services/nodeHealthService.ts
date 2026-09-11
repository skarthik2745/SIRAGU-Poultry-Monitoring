import { PoultryState } from './iotDataService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface ComponentHealthStatus {
  id: string;
  name: string;
  componentType: 'SENSOR' | 'ACTUATOR' | 'CONTROLLER';
  pinInterface: string;
  nominalRange: string;
  currentReading: string;
  isFaulty: boolean;
  healthScore: number; // 0 - 100%
  statusText: 'HEALTHY' | 'DEGRADED' | 'FAULTY' | 'CRITICAL_OUT_OF_BOUNDS';
  faultReason?: string;
  remediationAdvice?: string;
}

export interface NodeDiagnosticsReport {
  overallHealthScore: number; // 0 - 100%
  overallStatus: 'OPTIMAL' | 'DEGRADED' | 'FAULT_DETECTED' | 'CRITICAL_MALFUNCTION';
  faultyCount: number;
  healthyCount: number;
  components: ComponentHealthStatus[];
  aiAnalysisSummary: string;
  timestamp: string;
  recommendations: string[];
}

/**
 * Expected physical & operational detection boundaries for each sensor/component
 */
export const SENSOR_PHYSICAL_BOUNDS = {
  dht11_temp: {
    min: 0,
    max: 50,
    realisticFarmMin: 12,
    realisticFarmMax: 48,
    unit: '°C',
    name: 'DHT11 Temperature Sensor',
    interface: 'GPIO 4 (One-Wire Bus)',
  },
  dht11_hum: {
    min: 20,
    max: 90,
    realisticFarmMin: 25,
    realisticFarmMax: 95,
    unit: '% RH',
    name: 'DHT11 Humidity Sensor',
    interface: 'GPIO 4 (One-Wire Bus)',
  },
  mq2_gas: {
    min: 50,
    max: 1000,
    realisticFarmMin: 80,
    realisticFarmMax: 900,
    unit: 'ppm',
    name: 'MQ-2 Gas / Ammonia Sensor',
    interface: 'ADC Channel 0 (A0)',
  },
  flame_sensor: {
    minVoltage: 0.0,
    maxVoltage: 5.0,
    unit: 'V',
    name: 'YG1006 Optical Flame Sensor',
    interface: 'GPIO 18 / ADC',
  },
  ir_perimeter: {
    name: 'IR Photoelectric Perimeter Barrier',
    interface: 'GPIO 19 (Digital Pull-Up)',
  },
  feeder_servo: {
    minAngle: 0,
    maxAngle: 180,
    unit: '°',
    name: 'Feeder Servo Actuator',
    interface: 'GPIO 13 (Hardware PWM)',
  },
  esp32_gateway: {
    name: 'ESP32 Dual-Core Gateway Node',
    interface: 'Master SoC / Wi-Fi',
  },
};

/**
 * Rule-based heuristic sanity check for instant local diagnostics
 */
export function runLocalSanityCheck(state: PoultryState): NodeDiagnosticsReport {
  const components: ComponentHealthStatus[] = [];
  const { dht11, mq2, flame, ir, feeder, esp32 } = state;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. DHT11 Temperature Sensor
  const temp = dht11.temperature;
  let tempFaulty = false;
  let tempStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let tempReason: string | undefined;
  let tempAdvice: string | undefined;
  let tempScore = 98;

  if (temp < -10 || temp > 65) {
    tempFaulty = true;
    tempStatus = 'CRITICAL_OUT_OF_BOUNDS';
    tempScore = 15;
    tempReason = `Physical impossibility for poultry shed: ${temp}°C is outside valid sensor detection capabilities (-10°C to 65°C). ADC floating or short circuit.`;
    tempAdvice = 'Check GPIO 4 pull-up resistor (4.7kΩ). Inspect for disconnected wire or thermal damage on thermistor.';
  } else if (temp < 12 || temp > 50) {
    tempFaulty = true;
    tempStatus = 'FAULTY';
    tempScore = 35;
    tempReason = `Abnormal telemetry outlier: ${temp}°C is extreme/abnormal for farm environment. Sensor drift or hardware fault suspected.`;
    tempAdvice = 'Recalibrate DHT11 sensor or swap with backup DHT22/SHT31 sensor module.';
  } else if (temp > 38 || temp < 18) {
    tempStatus = 'DEGRADED';
    tempScore = 75;
    tempReason = `Operational stress: reading is near limits (${temp}°C).`;
  }

  components.push({
    id: 'comp-dht11-temp',
    name: 'DHT11 Temperature Sensor',
    componentType: 'SENSOR',
    pinInterface: 'GPIO 4',
    nominalRange: '15°C – 45°C (Broiler Living Range)',
    currentReading: `${temp}°C`,
    isFaulty: tempFaulty,
    healthScore: tempScore,
    statusText: tempStatus,
    faultReason: tempReason,
    remediationAdvice: tempAdvice,
  });

  // 2. DHT11 Humidity Sensor
  const hum = dht11.humidity;
  let humFaulty = false;
  let humStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let humReason: string | undefined;
  let humAdvice: string | undefined;
  let humScore = 95;

  if (hum < 0 || hum > 100 || isNaN(hum)) {
    humFaulty = true;
    humStatus = 'CRITICAL_OUT_OF_BOUNDS';
    humScore = 10;
    humReason = `Sensor failure: Reported humidity ${hum}% is mathematically out of relative humidity scale (0–100%).`;
    humAdvice = 'Moisture sensor polymer substrate contaminated or damaged. Clean sensing grid or replace unit.';
  } else if (hum < 15 || hum > 96) {
    humFaulty = true;
    humStatus = 'FAULTY';
    humScore = 40;
    humReason = `Abnormal humidity reading (${hum}%). Likely condensation bridging electrodes or dry sensor disconnect.`;
    humAdvice = 'Inspect sensor casing for feather dust accumulation or water droplets on grid.';
  }

  components.push({
    id: 'comp-dht11-hum',
    name: 'DHT11 Humidity Sensor',
    componentType: 'SENSOR',
    pinInterface: 'GPIO 4',
    nominalRange: '30% – 85% RH',
    currentReading: `${hum}% RH`,
    isFaulty: humFaulty,
    healthScore: humScore,
    statusText: humStatus,
    faultReason: humReason,
    remediationAdvice: humAdvice,
  });

  // 3. MQ-2 Ammonia / Gas Sensor
  const gas = mq2.gasPpm;
  let gasFaulty = false;
  let gasStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let gasReason: string | undefined;
  let gasAdvice: string | undefined;
  let gasScore = 96;

  if (gas < 10 || gas > 1500) {
    gasFaulty = true;
    gasStatus = 'CRITICAL_OUT_OF_BOUNDS';
    gasScore = 10;
    gasReason = `Sensor malfunction: ${gas} ppm is outside standard linear calibration window (10–1000 ppm). Heating coil or heater pin open-circuit.`;
    gasAdvice = 'Inspect MQ-2 onboard heater circuit (pins VH & GND). Verify 5.0V stable supply rail.';
  } else if (gas > 850) {
    gasFaulty = true;
    gasStatus = 'FAULTY';
    gasScore = 38;
    gasReason = `Abnormally extreme toxic concentration (${gas} ppm). Unlikely in ventilated shed without immediate fatal broiler collapse. Possible internal sensor short.`;
    gasAdvice = 'Perform zero-point fresh air calibration using the onboard trimpot potentiometer.';
  } else if (gas > 400) {
    gasStatus = 'DEGRADED';
    gasScore = 70;
    gasReason = 'Elevated air toxicity detected by sensor.';
  }

  components.push({
    id: 'comp-mq2',
    name: 'MQ-2 Gas / Ammonia Sensor',
    componentType: 'SENSOR',
    pinInterface: 'ADC Channel 0 (A0)',
    nominalRange: '50 – 400 ppm NH3',
    currentReading: `${gas} ppm`,
    isFaulty: gasFaulty,
    healthScore: gasScore,
    statusText: gasStatus,
    faultReason: gasReason,
    remediationAdvice: gasAdvice,
  });

  // 4. Optical Flame Detector (YG1006)
  const flameVolt = flame.rawVoltage || (flame.detected ? 4.8 : 0.12);
  let flameFaulty = false;
  let flameStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let flameReason: string | undefined;
  let flameAdvice: string | undefined;
  let flameScore = 99;

  if (flameVolt < 0 || flameVolt > 5.5) {
    flameFaulty = true;
    flameStatus = 'CRITICAL_OUT_OF_BOUNDS';
    flameScore = 15;
    flameReason = `Voltage out of analog range: ${flameVolt.toFixed(2)}V on 5V ADC line.`;
    flameAdvice = 'Verify ground plane integrity and signal line attenuation.';
  }

  components.push({
    id: 'comp-flame',
    name: 'YG1006 Optical Flame Sensor',
    componentType: 'SENSOR',
    pinInterface: 'GPIO 18',
    nominalRange: '0.05V – 1.20V (Safe Ambient)',
    currentReading: `${flameVolt.toFixed(2)}V (${flame.detected ? 'FLAME ALARM' : 'QUIESCENT'})`,
    isFaulty: flameFaulty,
    healthScore: flameScore,
    statusText: flameStatus,
    faultReason: flameReason,
    remediationAdvice: flameAdvice,
  });

  // 5. IR Perimeter Intrusion Barrier
  let irFaulty = false;
  let irStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let irScore = 98;

  components.push({
    id: 'comp-ir',
    name: 'IR Photoelectric Barrier Sensor',
    componentType: 'SENSOR',
    pinInterface: 'GPIO 19',
    nominalRange: 'Continuous 38kHz Modulated',
    currentReading: ir.intrusionDetected ? 'BREACH (Low/0V)' : 'SECURE (High/3.3V)',
    isFaulty: irFaulty,
    healthScore: irScore,
    statusText: irStatus,
  });

  // 6. Feeder PWM Servo Actuator
  let servoFaulty = false;
  let servoStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let servoReason: string | undefined;
  let servoAdvice: string | undefined;
  let servoScore = 95;

  if (feeder.servoAngle < 0 || feeder.servoAngle > 180) {
    servoFaulty = true;
    servoStatus = 'CRITICAL_OUT_OF_BOUNDS';
    servoScore = 20;
    servoReason = `Servo angle ${feeder.servoAngle}° out of standard mechanical 0°–180° range. Gear stripped or PWM jitter.`;
    servoAdvice = 'Inspect servo horn mechanical stops and verify 50Hz PWM pulse width (1000–2000µs).';
  }

  components.push({
    id: 'comp-servo',
    name: 'Feeder Servo Actuator',
    componentType: 'ACTUATOR',
    pinInterface: 'GPIO 13 (PWM)',
    nominalRange: '0° – 180° Travel',
    currentReading: `${feeder.servoAngle}° (${feeder.status})`,
    isFaulty: servoFaulty,
    healthScore: servoScore,
    statusText: servoStatus,
    faultReason: servoReason,
    remediationAdvice: servoAdvice,
  });

  // 7. ESP32 Node Master Microcontroller
  let espFaulty = false;
  let espStatus: ComponentHealthStatus['statusText'] = 'HEALTHY';
  let espScore = 98;
  if (!esp32.online || esp32.rssi < -85) {
    espFaulty = true;
    espStatus = 'DEGRADED';
    espScore = 55;
  }

  components.push({
    id: 'comp-esp32',
    name: 'ESP32 Dual-Core Microcontroller',
    componentType: 'CONTROLLER',
    pinInterface: 'Master Core (SPI/I2C/ADC)',
    nominalRange: 'Heap > 80KB | RSSI > -75dBm',
    currentReading: `${esp32.freeHeapKb}KB Heap | ${esp32.rssi}dBm`,
    isFaulty: espFaulty,
    healthScore: espScore,
    statusText: espStatus,
  });

  const faultyCount = components.filter((c) => c.isFaulty).length;
  const healthyCount = components.length - faultyCount;
  const overallHealthScore = Math.round(
    components.reduce((acc, curr) => acc + curr.healthScore, 0) / components.length
  );

  let overallStatus: NodeDiagnosticsReport['overallStatus'] = 'OPTIMAL';
  if (faultyCount >= 2) overallStatus = 'CRITICAL_MALFUNCTION';
  else if (faultyCount === 1) overallStatus = 'FAULT_DETECTED';
  else if (overallHealthScore < 85) overallStatus = 'DEGRADED';

  const defaultSummary = faultyCount === 0
    ? 'All 7 edge components and sensors are operating within nominal physical calibration limits. Microcontroller bus communication latency is nominal.'
    : `Detected ${faultyCount} component fault(s): Physical readings are out-of-bounds or abnormal compared to standard environmental detection envelopes. Component service or recalibration required.`;

  return {
    overallHealthScore,
    overallStatus,
    faultyCount,
    healthyCount,
    components,
    aiAnalysisSummary: defaultSummary,
    timestamp: now,
    recommendations: faultyCount === 0
      ? ['All sensor telemetry is nominal. Keep scheduled bi-weekly feather-dust air dusting.']
      : components.filter((c) => c.isFaulty && c.remediationAdvice).map((c) => `[${c.name}]: ${c.remediationAdvice}`),
  };
}

/**
 * Advanced AI-Powered Node Health Diagnosis via Google Gemini API
 * Sends component telemetry, operational bounds, and readings to Gemini for veterinary/IoT hardware diagnosis.
 */
export async function analyzeNodeHealthWithGemini(state: PoultryState): Promise<NodeDiagnosticsReport> {
  const localReport = runLocalSanityCheck(state);

  // If Gemini API Key is available, prompt Gemini for deep hardware diagnostic reasoning
  const prompt = `You are PoultryGuard AI's embedded IoT Hardware Diagnostician and Poultry Environmental Systems Engineer.
Analyze the following IoT edge sensor node telemetry and component readings for a commercial poultry house.

Components & Sensor Readings:
- DHT11 Temperature Sensor: ${state.dht11.temperature}°C (Normal poultry range: 18°C - 35°C; Physical limits: 0°C - 50°C)
- DHT11 Humidity Sensor: ${state.dht11.humidity}% RH (Normal poultry range: 45% - 75%; Physical limits: 20% - 90%)
- MQ-2 Ammonia / Toxic Gas Sensor: ${state.mq2.gasPpm} ppm (Normal safe: < 350 ppm; Physical limits: 50 - 1000 ppm)
- YG1006 Optical Flame Sensor: ${state.flame.rawVoltage || (state.flame.detected ? 4.8 : 0.12)}V (Safe: < 1.50V; Detected: > 3.0V)
- IR Photoelectric Barrier: ${state.ir.intrusionDetected ? 'TRIPPED' : 'INTACT'}
- Feeder Servo Actuator: ${state.feeder.servoAngle}° (Nominal travel: 0° to 180°)
- ESP32 Controller: Free Heap ${state.esp32.freeHeapKb}KB, RSSI ${state.esp32.rssi}dBm

Task:
1. Identify if any sensor has an abnormal, impossible, or faulty reading (e.g. 75°C, 200°C, 1500ppm gas, negative humidity, etc.).
2. State which components are HEALTHY and which are FAULTY.
3. Provide a concise, professional 2-sentence diagnostic assessment of the node's health.
4. Provide actionable repair/recalibration advice for any faulty component.

Return your response in clean JSON format:
{
  "summary": "Concise 2-sentence summary of node and sensor health",
  "faultyComponentIds": ["comp-dht11-temp"],
  "recommendations": ["Action item 1", "Action item 2"]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        // Extract JSON from response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary) {
            localReport.aiAnalysisSummary = parsed.summary;
          }
          if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
            localReport.recommendations = parsed.recommendations;
          }
        } else {
          localReport.aiAnalysisSummary = rawText.slice(0, 300);
        }
      }
    }
  } catch (err) {
    console.warn('[Gemini Node Health] Could not contact Gemini endpoint, using deterministic rule engine:', err);
  }

  return localReport;
}
