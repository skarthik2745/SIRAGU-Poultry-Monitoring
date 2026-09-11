import { PoultryState } from './iotDataService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isRecommendation?: boolean;
}

export interface RecommendationCard {
  id: string;
  category: 'CLIMATE' | 'AIR_QUALITY' | 'FEEDING' | 'SAFETY' | 'BIOSECURITY';
  priority: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
  title: string;
  description: string;
  action: string;
  sensorTrigger: string;
}

/**
 * Generate instantaneous heuristic recommendations based on live sensor telemetry
 */
export function generateLiveRecommendations(state: PoultryState): RecommendationCard[] {
  const recs: RecommendationCard[] = [];
  const { dht11, mq2, flame, ir, feeder } = state;

  // 1. Temperature & Humidity Checks
  if (dht11.temperature > 32) {
    recs.push({
      id: 'rec-temp-high',
      category: 'CLIMATE',
      priority: 'CRITICAL',
      title: 'Heat Stress Risk (Temp > 32°C)',
      description: `Current reading is ${dht11.temperature}°C. Broilers cannot sweat; high heat causes panting, electrolyte loss, and heat stroke.`,
      action: 'Engage high-speed tunnel exhaust fans, activate roof misting evaporative pads, and add electrolytes/Vitamin C to drinker water lines.',
      sensorTrigger: `DHT11: ${dht11.temperature}°C (High Threshold: 30°C)`,
    });
  } else if (dht11.temperature < 20) {
    recs.push({
      id: 'rec-temp-low',
      category: 'CLIMATE',
      priority: 'WARNING',
      title: 'Chilling / Low Ambient Temperature',
      description: `Current reading is ${dht11.temperature}°C. Low temperatures reduce feed conversion efficiency as birds expend energy for thermoregulation.`,
      action: 'Activate supplementary radiant brooder heaters, reduce side curtain openings, and eliminate floor drafts.',
      sensorTrigger: `DHT11: ${dht11.temperature}°C (Low Threshold: 22°C)`,
    });
  } else {
    recs.push({
      id: 'rec-temp-ok',
      category: 'CLIMATE',
      priority: 'OPTIMAL',
      title: 'Thermal Comfort Zone Maintained',
      description: `Temperature (${dht11.temperature}°C) and Humidity (${dht11.humidity}%) are within standard broiler comfort boundaries.`,
      action: 'Maintain steady ventilation cycle. Monitor diurnal day-night shifts.',
      sensorTrigger: `DHT11: ${dht11.temperature}°C / ${dht11.humidity}%`,
    });
  }

  // 2. Ammonia / Gas Checks (MQ-2)
  if (mq2.gasPpm > 350) {
    recs.push({
      id: 'rec-gas-high',
      category: 'AIR_QUALITY',
      priority: 'CRITICAL',
      title: 'Dangerous Ammonia & Toxic Gas Level (> 350 ppm)',
      description: `Ammonia reading at ${mq2.gasPpm} ppm. High NH3 damages tracheal cilia, causing conjunctivitis, respiratory lesions, and ascites.`,
      action: 'Run exhaust fans at 100% capacity, check for damp litter around drinker nipples, top-dress litter with dry shavings, and apply agricultural lime/acidifier.',
      sensorTrigger: `MQ-2: ${mq2.gasPpm} ppm (Safe Limit: 300 ppm)`,
    });
  } else if (mq2.gasPpm > 260) {
    recs.push({
      id: 'rec-gas-med',
      category: 'AIR_QUALITY',
      priority: 'WARNING',
      title: 'Elevated Gas Concentration',
      description: `Ammonia at ${mq2.gasPpm} ppm. Air exchange is falling behind biological manure degradation.`,
      action: 'Increase minimum ventilation timer cycle by 20%. Inspect moisture level in litter manure pits.',
      sensorTrigger: `MQ-2: ${mq2.gasPpm} ppm`,
    });
  }

  // 3. Flame / Fire Safety
  if (flame.detected) {
    recs.push({
      id: 'rec-fire',
      category: 'SAFETY',
      priority: 'CRITICAL',
      title: 'Active Thermal Flame Detected!',
      description: 'Optical YG1006 photodiode detected open flame. Immediate hazard to farm structure and livestock.',
      action: 'Evacuate personnel, trigger automated deluge misting/suppression system, shut down ventilation to prevent draft spread, and contact local emergency dispatch.',
      sensorTrigger: 'Flame Sensor: ACTIVE FLAME',
    });
  }

  // 4. IR Perimeter Security
  if (ir.intrusionDetected) {
    recs.push({
      id: 'rec-ir',
      category: 'BIOSECURITY',
      priority: 'CRITICAL',
      title: 'Perimeter Intrusion Breach Detected',
      description: 'Infrared barrier tripwire breached. Risk of predator entry (rodents, wild birds, foxes) or unauthorized access.',
      action: 'Check boundary fence gate, inspect security camera feeds in the monitored sector, and engage pest deterring ultrasonic sirens.',
      sensorTrigger: 'IR Barrier: BEAM BROKEN',
    });
  }

  // 5. Feeder & Nutrition Check
  if (feeder.hopperLevel < 25) {
    recs.push({
      id: 'rec-feeder-low',
      category: 'FEEDING',
      priority: 'WARNING',
      title: 'Feed Silo Hopper Level Low (< 25%)',
      description: `Hopper level is at ${feeder.hopperLevel}%. Risk of feed auger running dry.`,
      action: 'Refill bulk hopper from external feed silos to prevent disruption in the flock ad-libitum nutritional schedule.',
      sensorTrigger: `Feeder Hopper: ${feeder.hopperLevel}% remaining`,
    });
  }

  return recs;
}

/**
 * Query Google Gemini API for intelligent poultry farming expert consultation
 */
export async function askGeminiPoultryAI(
  userQuery: string,
  currentState: PoultryState,
  history: ChatMessage[] = []
): Promise<string> {
  const telemetrySummary = `
--- LIVE POULTRY FARM TELEMETRY ---
• Temperature: ${currentState.dht11.temperature}°C (Status: ${currentState.dht11.tempStatus})
• Humidity: ${currentState.dht11.humidity}%
• Gas / Ammonia Concentration: ${currentState.mq2.gasPpm} ppm (Status: ${currentState.mq2.status})
• Flame Detector: ${currentState.flame.detected ? '🔥 ACTIVE FLAME DETECTED' : 'Normal / Safe'}
• Perimeter IR Security: ${currentState.ir.intrusionDetected ? '🚨 INTRUSION DETECTED' : 'Secure'}
• Feeder Status: ${currentState.feeder.status} (Servo: ${currentState.feeder.servoAngle}°, Hopper: ${currentState.feeder.hopperLevel}%)
• Flock Activity Index: ${currentState.poultryActivity.movementIndex}% (${currentState.poultryActivity.status})
• ESP32 Hardware Link: ${currentState.isHardwareConnected ? 'Connected & Live Stream' : 'Simulation Mode'}
-----------------------------------
`;

  const systemInstruction = `You are PoultryGuard AI, an expert Poultry Veterinarian, Agronomist, and Smart Farm Management Consultant.
You assist poultry farmers, managers, and technicians with:
1. Answering all questions regarding broiler and layer chicken management, disease prevention, biosecurity, feeding, lighting, and brooding.
2. Providing immediate, actionable suggestions and guidance when sensor values (temperature, humidity, ammonia/gas, flame, intrusion) exceed standard thresholds.
3. Offering step-by-step troubleshooting, flock health indicators, ventilation adjustments, and operational optimization.

Always refer directly to the live sensor telemetry provided when diagnosing conditions. Give structured, clear, bulleted recommendations with practical farm-level steps. Keep your tone encouraging, professional, and safety-focused.`;

  // Format request for Gemini 1.5 / 2.0 API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `${systemInstruction}

${telemetrySummary}

User Question: ${userQuery}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      // If gemini-2.5-flash is not available, try gemini-1.5-flash fallback
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!fallbackRes.ok) {
        throw new Error(`Gemini API error: ${fallbackRes.statusText}`);
      }

      const fallbackData = await fallbackRes.json();
      return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || generateOfflineResponse(userQuery, currentState);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || generateOfflineResponse(userQuery, currentState);
  } catch (error) {
    console.warn('Gemini API query failed or network issue, using smart heuristic advisor:', error);
    return generateOfflineResponse(userQuery, currentState);
  }
}

/**
 * Intelligent Offline Fallback Advisor with domain knowledge
 */
function generateOfflineResponse(query: string, state: PoultryState): string {
  const q = query.toLowerCase();
  const { dht11, mq2, flame, ir } = state;

  if (q.includes('temp') || q.includes('heat') || q.includes('cold') || q.includes('climate')) {
    return `🌡️ **Temperature & Climate Guidance**:
• Current Farm Temperature: **${dht11.temperature}°C** (${dht11.tempStatus})
• Current Humidity: **${dht11.humidity}%**

**Recommended Actions**:
- **Target Range**: Standard broiler comfort target is **24°C – 28°C** for birds older than 2 weeks.
${dht11.temperature > 30 ? '- ⚠️ **Heat Stress Warning**: Temperature is elevated. Run tunnel exhaust fans continuously and activate evaporative cooling pads to prevent mortality.' : '- ✅ Temperature is within nominal parameters. Continue standard minimum ventilation.'}
- Ensure fresh water is always available at ~18°C–20°C.`;
  }

  if (q.includes('gas') || q.includes('ammonia') || q.includes('air') || q.includes('smell')) {
    return `💨 **Air Quality & Ammonia (NH3) Guidance**:
• Current Concentration: **${mq2.gasPpm} ppm** (${mq2.status})
• Safe Limit: **< 300 ppm**

**Management Protocol**:
- Ammonia above 25 ppm in real bird air causes tracheal damage; keep your farm ventilation cycling regularly.
${mq2.gasPpm > 300 ? '- 🚨 **Urgent**: Run exhaust fans at maximum speed. Check drinker lines for water leaks causing wet litter bedding.' : '- ✅ Ammonia levels are under control. Maintain scheduled 5-minute periodic air purges.'}
- Apply dry wood shavings over high-moisture manure accumulation spots.`;
  }

  if (q.includes('feed') || q.includes('diet') || q.includes('nutrition') || q.includes('dispens')) {
    return `🍗 **Feeding & Nutrition Optimization**:
• Feeder Status: **${state.feeder.status}** (Servo: **${state.feeder.servoAngle}°**)
• Hopper Fill: **${state.feeder.hopperLevel}%**

**Recommendations**:
- Maintain ad-libitum feeding for commercial broilers during light hours.
- Dispense portions in scheduled pulses (e.g., Morning, Midday, Evening) to minimize feed waste and stale feed spoilage.
- Ensure 1 bell feeder per 65-75 broilers.`;
  }

  if (q.includes('fire') || q.includes('flame') || q.includes('hazard') || q.includes('safety')) {
    return `🔥 **Safety & Emergency Protocols**:
• Flame Detector: **${flame.detected ? '🚨 DETECTED' : '🟢 SAFE'}**
• Perimeter Barrier: **${ir.intrusionDetected ? '🚨 BREACH' : '🟢 SECURE'}**

**Protocol**:
${flame.detected ? '- 🚨 **Emergency**: Open fire detected! Immediate evacuation, power off auxiliary heating lines, and trigger sprinkler suppression.' : '- System is clear of thermal and intrusion hazards. Keep smoke/dust optical sensors clean of broiler down feathers weekly.'}`;
  }

  return `🤖 **PoultryGuard AI Advisor Summary**:
Based on your current telemetry:
• **Temperature**: ${dht11.temperature}°C (${dht11.tempStatus})
• **Humidity**: ${dht11.humidity}%
• **Ammonia / Gas**: ${mq2.gasPpm} ppm (${mq2.status})
• **Safety Matrix**: ${flame.detected ? 'FIRE EMERGENCY' : ir.intrusionDetected ? 'PERIMETER BREACH' : 'ALL CLEAR (SECURE)'}

**General Guidance**:
1. Keep ventilation synchronized with live bird weight and age.
2. Maintain litter moisture below 25% to minimize ammonia volatilization.
3. Feel free to ask specific questions like *"How to treat high ammonia?"*, *"What to do during heat waves?"*, or *"Optimize feed timing"*!`;
}
