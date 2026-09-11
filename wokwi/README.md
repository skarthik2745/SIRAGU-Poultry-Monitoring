# PoultryGuard AI — Wokwi ESP32 Simulator Bridge Guide

This folder contains the firmware and wiring schematic matched to your custom Wokwi circuit diagram.

---

## 📌 Hardware Pinout (From Your `diagram.json`)

| Sensor / Actuator | Wokwi Part | ESP32 Pin | Interface |
|---|---|---|---|
| **DHT22 (Temperature & Humidity)** | `wokwi-dht22` | **GPIO 15** | Digital Bus (SDA) |
| **Gas Sensor (Ammonia / MQ-2)** | `wokwi-gas-sensor` | **GPIO 34** | Analog Input (AOUT) |
| **Feeder Servo Motor** | `wokwi-servo` | **GPIO 18** | PWM Signal |

*Flame and IR statuses are included in the JSON payload as `0` (Safe/Secure) by default, or you can connect additional pins as needed.*

---

## 🚀 How to Run in Wokwi Simulator

### Step 1: Open Wokwi
1. Go to [https://wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
2. Click on the **`diagram.json`** tab and paste the exact contents of [`wokwi/diagram.json`](file:///C:/Users/NCS/.gemini/antigravity/scratch/poultryguard-ai/wokwi/diagram.json).
3. Click on the **`sketch.ino`** tab and paste the contents of [`wokwi/sketch.ino`](file:///C:/Users/NCS/.gemini/antigravity/scratch/poultryguard-ai/wokwi/sketch.ino).

---

### Step 2: Configure Server URL

In `sketch.ino` line 30:
```cpp
const char* serverUrl = "http://10.17.74.192:5000/api/sensor-data";
```
- Replace `10.17.74.192` with your computer's local IP address (find it by running `ipconfig` in Command Prompt / PowerShell).
- Ensure your PoultryGuard AI backend server is running (`node server.js` on port 5000).

> **Alternative via Free Tunnel (Ngrok or LocalTunnel)**:
> If Wokwi in your browser cannot reach your local LAN IP directly:
> Run:
> ```bash
> npx localtunnel --port 5000
> ```
> Copy the provided URL (e.g. `https://cool-farm-42.loca.lt/api/sensor-data`) and paste it as `serverUrl` in `sketch.ino`.

---

### Step 3: Run & Watch Live Updates

1. Click the **Start the simulation** button (green play icon) in Wokwi.
2. In the Wokwi Serial Monitor, observe:
   ```
   Connecting to Wi-Fi 'Wokwi-GUEST'...
   [WiFi] Connected successfully!
   [Sensors] Temp: 28.5 °C | Hum: 67.0 % | Gas: 240 ppm | Servo: 0°
   [HTTP Success] Code: 200
   [Server Response] {"success":true,"message":"Sensor data updated successfully",...}
   ```
3. Open your PoultryGuard AI website at [http://localhost:5173/](http://localhost:5173/):
   - The top banner will immediately show **`🟢 LIVE WOKWI / ESP32`**.
   - Change the DHT22 temperature slider in Wokwi -> the dashboard and Digital Twin update within 2 seconds without page refresh!
   - Turn the Gas potentiometer knob -> the MQ-2 gauge and volumetric gas cloud in the Digital Twin react!
   - Watch the Servo motor rotate -> the feeder status opens and closes automatically!
