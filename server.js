import express from 'express';
import cors from 'cors';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (supports Wokwi simulator, localhost, and LAN clients)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Support JSON encoded request bodies
app.use(express.json());

// In-Memory Storage for ESP32 / Wokwi Sensor Data
let latestSensorData = {
  temperature: 28.4,
  humidity: 67,
  gas: 245,
  flame: 0,
  ir: 0,
  feeder: 0,
  timestamp: new Date().toISOString(),
  lastUpdatedMs: Date.now(),
  packetCount: 0,
  isHardwareConnected: false
};

// Recent historical records buffer (up to 50 entries)
const dataHistory = [];

/**
 * POST /api/sensor-data
 * Accepts incoming ESP32 / Wokwi telemetry JSON:
 * {
 *   "temperature": number,
 *   "humidity": number,
 *   "gas": number,
 *   "flame": number,
 *   "ir": number,
 *   "feeder": number
 * }
 */
app.post('/api/sensor-data', (req, res) => {
  try {
    const { temperature, humidity, gas, flame, ir, feeder } = req.body;

    // Validate fields
    if (temperature === undefined || humidity === undefined || gas === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required sensor fields. Expected: temperature, humidity, gas, flame, ir, feeder.'
      });
    }

    const now = new Date();

    // Clean and parse values
    const parsedData = {
      temperature: Number(Number(temperature).toFixed(1)),
      humidity: Number(Number(humidity).toFixed(1)),
      gas: Math.round(Number(gas)),
      flame: Number(flame) || 0,
      ir: Number(ir) || 0,
      feeder: Number(feeder) || 0,
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lastUpdatedMs: Date.now(),
      packetCount: latestSensorData.packetCount + 1,
      isHardwareConnected: true
    };

    // Update in-memory store
    latestSensorData = parsedData;

    // Store in history ring buffer
    dataHistory.push({
      time: parsedData.formattedTime,
      temperature: parsedData.temperature,
      humidity: parsedData.humidity,
      gasPpm: parsedData.gas,
      activityIndex: parsedData.ir === 1 ? 92 : 72
    });
    if (dataHistory.length > 50) {
      dataHistory.shift();
    }

    console.log(`[ESP32/Wokwi] Data packet #${parsedData.packetCount} received: Temp=${parsedData.temperature}°C, Hum=${parsedData.humidity}%, Gas=${parsedData.gas}ppm, Flame=${parsedData.flame}, IR=${parsedData.ir}, Feeder=${parsedData.feeder}`);

    return res.status(200).json({
      success: true,
      message: 'Sensor data updated successfully',
      data: latestSensorData
    });
  } catch (err) {
    console.error('[API Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing sensor data'
    });
  }
});

/**
 * GET /api/sensor-data
 * Returns the latest sensor readings stored in memory
 */
app.get('/api/sensor-data', (req, res) => {
  // Check if hardware has sent data in the last 15 seconds
  const isFresh = (Date.now() - latestSensorData.lastUpdatedMs) < 15000 && latestSensorData.packetCount > 0;
  
  res.status(200).json({
    ...latestSensorData,
    isHardwareConnected: isFresh,
    history: dataHistory
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * Helper: make a JSON POST/GET request to Telegram Bot API via Node.js https module
 */
function telegramRequest(method, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ ok: false, error: 'Invalid JSON from Telegram' }); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * GET /api/telegram/updates
 * Fetches latest Telegram updates (to auto-discover chat_id)
 */
app.get('/api/telegram/updates', async (req, res) => {
  try {
    const data = await telegramRequest('getUpdates?limit=20');
    res.status(200).json(data);
  } catch (err) {
    console.error('[Telegram Proxy] getUpdates error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/telegram/send
 * Proxy for sendMessage — forwards the request to Telegram API
 * Body: { chat_id, text, parse_mode }
 */
app.post('/api/telegram/send', async (req, res) => {
  try {
    const { chat_id, text, parse_mode } = req.body;
    if (!chat_id || !text) {
      return res.status(400).json({ ok: false, error: 'chat_id and text are required' });
    }
    const data = await telegramRequest('sendMessage', {
      chat_id,
      text,
      parse_mode: parse_mode || 'HTML',
      disable_web_page_preview: true,
    });
    console.log(`[Telegram] Message sent to chat ${chat_id}: ${data.ok ? 'OK' : 'FAILED'}`);
    res.status(200).json(data);
  } catch (err) {
    console.error('[Telegram Proxy] sendMessage error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  POULTRYGUARD AI — ESP32 Sensor API Backend`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  POST endpoint: http://localhost:${PORT}/api/sensor-data`);
  console.log(`  GET  endpoint: http://localhost:${PORT}/api/sensor-data`);
  console.log(`====================================================`);
});
