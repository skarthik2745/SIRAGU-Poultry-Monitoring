/********************************************************
   SMART FACTORY MONITORING SYSTEM
   ESP32 + Blynk IoT

   Sensors:
   - DHT11
   - MQ-2
   - IR Sensor
   - Flame Sensor

   Output:
   - Servo Feeder
   - Buzzer
********************************************************/


#define BLYNK_TEMPLATE_ID "TMPL3A4_LsyKc"
#define BLYNK_TEMPLATE_NAME "Smart Poultry"
#define BLYNK_AUTH_TOKEN "TZegflZN0E3XTFZnn5tUC1TS4UFTM_as"


#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ===== ADDED FOR WEBSITE DASHBOARD =====
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Your Netlify website API endpoint
const char* serverUrl = "https://poultry2745.netlify.app/api/sensor-data";
// ========================================

// =====================================
// WIFI DETAILS
// =====================================

char ssid[] = "ATT Argus";
char pass[] = "";

// =====================================



// ---------------- PINS ----------------

#define DHTPIN 4
#define DHTTYPE DHT11

#define MQ2_PIN 34
#define IR_PIN 27
#define FLAME_PIN 26

#define SERVO_PIN 13
#define BUZZER_PIN 14

// ---------------- OBJECTS ----------------

DHT dht(DHTPIN, DHTTYPE);
Servo feederServo;

BlynkTimer timer;

// ---------------- VARIABLES ----------------

float temperature;
float humidity;
int gasValue;

bool irDetected;
bool flameDetected;

// ===== ADDED: Track servo position for website =====
int currentServoAngle = 0;
// ====================================================

// =================================================
// BLYNK SERVO CONTROL
// V5: Switch
// 0 = CLOSE
// 1 = OPEN
// =================================================

BLYNK_WRITE(V5)
{
  int value = param.asInt();

  Serial.print("Blynk Servo Value: ");
  Serial.println(value);

  if (value == 1)
  {
    Serial.println("SERVO OPENING");
    feederServo.write(90);
    currentServoAngle = 90;  // ADDED: track angle
  }
  else
  {
    Serial.println("SERVO CLOSING");
    feederServo.write(0);
    currentServoAngle = 0;   // ADDED: track angle
  }
}

// =================================================
// READ SENSORS
// =================================================

void readSensors()
{
  // DHT11
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  // MQ2
  gasValue = analogRead(MQ2_PIN);

  // IR
  int irValue = digitalRead(IR_PIN);

  // Flame
  int flameValue = digitalRead(FLAME_PIN);

  // Print RAW values first for testing
  Serial.println("\n========== SENSOR DATA ==========");

  Serial.print("IR RAW VALUE: ");
  Serial.println(irValue);

  Serial.print("FLAME RAW VALUE: ");
  Serial.println(flameValue);

  // Most modules use LOW for detection
  irDetected = (irValue == LOW);
  flameDetected = (flameValue == LOW);

  // DHT11
  if (!isnan(temperature) && !isnan(humidity))
  {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }
  else
  {
    Serial.println("DHT11 ERROR!");
  }

  // MQ2
  Serial.print("MQ2 Gas Value: ");
  Serial.println(gasValue);

  // IR STATUS
  Serial.print("IR Sensor: ");

  if (irDetected)
  {
    Serial.println("OBJECT DETECTED");
  }
  else
  {
    Serial.println("NO OBJECT");
  }

  // FLAME STATUS
  Serial.print("Flame Sensor: ");

  if (flameDetected)
  {
    Serial.println("FLAME DETECTED");
  }
  else
  {
    Serial.println("NO FLAME");
  }

  // =================================================
  // WARNING SYSTEM
  // =================================================

  bool warning = false;

  if (!isnan(temperature) && temperature > 35)
  {
    Serial.println("WARNING: HIGH TEMPERATURE!");
    warning = true;
  }

  if (gasValue > 2000)
  {
    Serial.println("WARNING: GAS/SMOKE DETECTED!");
    warning = true;
  }

  if (irDetected)
  {
    Serial.println("WARNING: OBJECT DETECTED!");
    warning = true;
  }

  if (flameDetected)
  {
    Serial.println("WARNING: FIRE DETECTED!");
    warning = true;
  }

  // BUZZER
  digitalWrite(BUZZER_PIN, warning ? HIGH : LOW);

  // =================================================
  // SEND TO BLYNK
  // =================================================

  if (!isnan(temperature))
    Blynk.virtualWrite(V0, temperature);

  if (!isnan(humidity))
    Blynk.virtualWrite(V1, humidity);

  Blynk.virtualWrite(V2, gasValue);

  Blynk.virtualWrite(V3, irDetected ? 1 : 0);

  Blynk.virtualWrite(V4, flameDetected ? 1 : 0);

  Serial.println("=================================");

  // =================================================
  // ADDED: SEND TO WEBSITE DASHBOARD
  // =================================================
  sendToWebsite();
}

// =================================================
// ADDED: SEND DATA TO NETLIFY WEBSITE
// =================================================

void sendToWebsite()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("[Website] WiFi not connected, skipping...");
    return;
  }

  // Build JSON payload matching the website's expected format
  String jsonPayload = "{";
  jsonPayload += "\"temperature\":" + String(isnan(temperature) ? 0.0 : temperature, 1) + ",";
  jsonPayload += "\"humidity\":" + String(isnan(humidity) ? 0.0 : humidity, 1) + ",";
  jsonPayload += "\"gas\":" + String(gasValue) + ",";
  jsonPayload += "\"flame\":" + String(flameDetected ? 1 : 0) + ",";
  jsonPayload += "\"ir\":" + String(irDetected ? 1 : 0) + ",";
  jsonPayload += "\"feeder\":" + String(currentServoAngle);
  jsonPayload += "}";

  Serial.println("[Website] Sending: " + jsonPayload);

  WiFiClientSecure client;
  client.setInsecure();  // Skip SSL certificate check (OK for demo)

  HTTPClient http;
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);  // 5 second timeout

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0)
  {
    Serial.print("[Website] Success! Code: ");
    Serial.println(httpResponseCode);
  }
  else
  {
    Serial.print("[Website] Failed: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}

// =================================================
// SERVO TEST
// =================================================

void servoTest()
{
  Serial.println("SERVO TEST: 0 degrees");
  feederServo.write(0);
  delay(1500);

  Serial.println("SERVO TEST: 90 degrees");
  feederServo.write(90);
  delay(1500);

  Serial.println("SERVO TEST: 0 degrees");
  feederServo.write(0);
}

// =================================================
// SETUP
// =================================================

void setup()
{
  Serial.begin(115200);

  // Sensors
  dht.begin();

  pinMode(IR_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);

  // Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Servo
  feederServo.setPeriodHertz(50);

  feederServo.attach(
    SERVO_PIN,
    500,
    2400
  );

  feederServo.write(0);

  delay(1000);

  // IMPORTANT SERVO TEST
  servoTest();

  // Blynk connection
  Blynk.begin(
    BLYNK_AUTH_TOKEN,
    ssid,
    pass
  );

  // Read sensors every 2 seconds
  timer.setInterval(2000L, readSensors);

  Serial.println("\nSMART FACTORY SYSTEM READY");
  Serial.println("[Website] Dashboard: https://poultry2745.netlify.app");
}

// =================================================
// LOOP
// =================================================

void loop()
{
  Blynk.run();
  timer.run();
}
