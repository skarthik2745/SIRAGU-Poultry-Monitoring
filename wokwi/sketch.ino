/*
  POULTRYGUARD AI — ESP32 Wokwi Firmware Bridge
  Smart Poultry Farm Automation, Health & Safety System

  Based on your Wokwi Circuit Diagram:
  - DHT22 Sensor:    Data pin -> GPIO 15
  - MQ Gas Sensor:   AOUT pin -> GPIO 34 (Analog ADC)
  - Feeder Servo:    PWM pin  -> GPIO 18
  - Flame / IR:      Transmitted as 0 (safe) in JSON payload, ready for physical pins

  Sends HTTP POST to PoultryGuard AI Backend:
  POST /api/sensor-data
  {
    "temperature": number,
    "humidity": number,
    "gas": number,
    "flame": number,
    "ir": number,
    "feeder": number
  }
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

// Wi-Fi Configuration for Wokwi Simulator
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Backend API Server URL
// Replace with your computer's LAN IP (run 'ipconfig' in terminal):
// e.g., "http://192.168.1.100:5000/api/sensor-data" or "http://10.17.74.192:5000/api/sensor-data"
// Or use Wokwi IoT Gateway / Tunnel: "http://host.wokwi.internal:5000/api/sensor-data"
const char* serverUrl = "http://10.17.74.192:5000/api/sensor-data";

// Pin Configurations based on your diagram.json
#define DHTPIN 15        // DHT22 connected to GPIO 15
#define DHTTYPE DHT22    // DHT22 (AM2302)
#define GAS_PIN 34       // Gas sensor AOUT connected to GPIO 34 (ADC)
#define SERVO_PIN 18     // Servo PWM connected to GPIO 18

// Optional Pins for Flame and IR (if you add them later to your diagram):
#define OPTIONAL_FLAME_PIN 4
#define OPTIONAL_IR_PIN 5

DHT dht(DHTPIN, DHTTYPE);
Servo feederServo;

int currentServoAngle = 0;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 2000; // Send telemetry every 2 seconds (2000ms)

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("   POULTRYGUARD AI — Wokwi ESP32 Connected Firmware   ");
  Serial.println("=======================================================");
  Serial.println("Sensors Initialized:");
  Serial.println(" • DHT22 on GPIO 15");
  Serial.println(" • Gas Sensor AOUT on GPIO 34");
  Serial.println(" • Feeder Servo on GPIO 18");
  Serial.println("=======================================================\n");

  // 1. Initialize DHT sensor
  dht.begin();

  // 2. Initialize Servo Motor on GPIO 18
  ESP32PWM::allocateTimer(0);
  feederServo.setPeriodHertz(50);             // Standard 50Hz servo
  feederServo.attach(SERVO_PIN, 500, 2400);   // Attach servo on GPIO 18
  feederServo.write(0);                       // Start closed (0 degrees)
  currentServoAngle = 0;

  // 3. Connect to Wokwi Virtual Wi-Fi
  Serial.print("Connecting to Wi-Fi '");
  Serial.print(ssid);
  Serial.print("'");

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Target Server: ");
    Serial.println(serverUrl);
  } else {
    Serial.println("\n[WiFi] Could not connect immediately. Telemetry will retry...");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // Send telemetry at configured interval (every 2 seconds)
  if (currentMillis - lastSendTime >= sendInterval) {
    lastSendTime = currentMillis;

    // 1. Read DHT22 Temperature & Humidity (GPIO 15)
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    // Fallback if sensor is warming up in simulation
    if (isnan(temperature) || isnan(humidity)) {
      temperature = 28.4;
      humidity = 66.0;
    }

    // 2. Read Wokwi Gas Sensor AOUT (GPIO 34)
    // ESP32 ADC reads 0 to 4095. Map to realistic ppm (120 to 650 ppm):
    int rawGas = analogRead(GAS_PIN);
    int gasPpm = map(rawGas, 0, 4095, 120, 650);

    // 3. Flame & IR status
    // Default to 0 (SAFE / SECURE). If temperature is extreme (> 50°C), simulate flame warning.
    int flame = (temperature > 50.0) ? 1 : 0;
    int ir = 0;

    // 4. Feeder Servo demonstration cycle on GPIO 18:
    // Every 15 cycles (approx 30s), simulate a scheduled feeding dispense
    static int cycleCounter = 0;
    cycleCounter++;
    if (cycleCounter % 15 == 0) {
      currentServoAngle = 90;              // Dispense feed: rotate servo to 90°
      feederServo.write(currentServoAngle);
      Serial.println("[Feeder] SERVO OPENED (90°) - Dispensing feed pellets");
    } else if (cycleCounter % 15 == 2) {
      currentServoAngle = 0;               // Close feeder door: return to 0°
      feederServo.write(currentServoAngle);
      Serial.println("[Feeder] SERVO CLOSED (0°) - Cycle complete");
    }

    // 5. Construct JSON Payload
    // Expected format:
    // { "temperature": 28.4, "humidity": 66.0, "gas": 245, "flame": 0, "ir": 0, "feeder": 0 }
    String jsonPayload = "{";
    jsonPayload += "\"temperature\":" + String(temperature, 1) + ",";
    jsonPayload += "\"humidity\":" + String(humidity, 1) + ",";
    jsonPayload += "\"gas\":" + String(gasPpm) + ",";
    jsonPayload += "\"flame\":" + String(flame) + ",";
    jsonPayload += "\"ir\":" + String(ir) + ",";
    jsonPayload += "\"feeder\":" + String(currentServoAngle);
    jsonPayload += "}";

    Serial.println("\n-------------------------------------------------------");
    Serial.print("[Sensors] Temp: ");
    Serial.print(temperature, 1);
    Serial.print(" °C | Hum: ");
    Serial.print(humidity, 1);
    Serial.print(" % | Gas: ");
    Serial.print(gasPpm);
    Serial.print(" ppm | Servo: ");
    Serial.print(currentServoAngle);
    Serial.println("°");
    Serial.println("[Payload] " + jsonPayload);

    // 6. Transmit HTTP POST to PoultryGuard AI Backend
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("[HTTP Success] Code: ");
        Serial.println(httpResponseCode);
        Serial.println("[Server Response] " + response);
      } else {
        Serial.print("[HTTP Warning] Could not reach server: ");
        Serial.println(http.errorToString(httpResponseCode).c_str());
        Serial.println("Check that 'serverUrl' matches your PC's IP address and the server is running.");
      }
      http.end();
    } else {
      Serial.println("[WiFi] Reconnecting...");
      WiFi.begin(ssid, password);
    }
  }
}
