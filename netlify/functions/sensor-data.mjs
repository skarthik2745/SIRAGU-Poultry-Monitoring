/**
 * POULTRYGUARD AI — Netlify Serverless Function
 * Replaces the Express backend for Netlify deployment.
 *
 * Handles:
 *   POST /.netlify/functions/sensor-data  (receive ESP32 telemetry)
 *   GET  /.netlify/functions/sensor-data  (return latest readings)
 *
 * Note: Netlify Functions are stateless — in-memory storage resets between
 * cold starts. For production persistence, swap the in-memory store for
 * a database (e.g. Netlify Blobs, Supabase, Firebase, etc.).
 * For hackathon / demo purposes, this works fine with the ESP32 posting
 * frequently enough to keep the function warm.
 */

// ── In-memory store (persists while the function instance is warm) ──────────
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
  isHardwareConnected: false,
};

const dataHistory = [];

// ── CORS headers (allow ESP32 / Wokwi / any origin) ────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

// ── Main handler ────────────────────────────────────────────────────────────
export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── POST: Receive sensor data from ESP32 / Wokwi ─────────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { temperature, humidity, gas, flame, ir, feeder } = body;

      // Validate required fields
      if (
        temperature === undefined ||
        humidity === undefined ||
        gas === undefined
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Missing required sensor fields. Expected: temperature, humidity, gas, flame, ir, feeder.",
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      const now = new Date();

      const parsedData = {
        temperature: Number(Number(temperature).toFixed(1)),
        humidity: Number(Number(humidity).toFixed(1)),
        gas: Math.round(Number(gas)),
        flame: Number(flame) || 0,
        ir: Number(ir) || 0,
        feeder: Number(feeder) || 0,
        timestamp: now.toISOString(),
        formattedTime: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        lastUpdatedMs: Date.now(),
        packetCount: latestSensorData.packetCount + 1,
        isHardwareConnected: true,
      };

      // Update in-memory store
      latestSensorData = parsedData;

      // Append to history ring buffer (max 50)
      dataHistory.push({
        time: parsedData.formattedTime,
        temperature: parsedData.temperature,
        humidity: parsedData.humidity,
        gasPpm: parsedData.gas,
        activityIndex: parsedData.ir === 1 ? 92 : 72,
      });
      if (dataHistory.length > 50) {
        dataHistory.shift();
      }

      console.log(
        `[ESP32/Wokwi] Packet #${parsedData.packetCount}: Temp=${parsedData.temperature}°C, Hum=${parsedData.humidity}%, Gas=${parsedData.gas}ppm`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Sensor data updated successfully",
          data: latestSensorData,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      console.error("[API Error]", err);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error processing sensor data",
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // ── GET: Return latest sensor readings ────────────────────────────────
  if (req.method === "GET") {
    const isFresh =
      Date.now() - latestSensorData.lastUpdatedMs < 15000 &&
      latestSensorData.packetCount > 0;

    return new Response(
      JSON.stringify({
        ...latestSensorData,
        isHardwareConnected: isFresh,
        history: dataHistory,
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // ── Fallback: Method not allowed ──────────────────────────────────────
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: corsHeaders }
  );
};

// ── Netlify Function config ─────────────────────────────────────────────────
export const config = {
  path: "/api/sensor-data",
};
