#if !defined(ESP32)
#error This code is intended to run only on the ESP32 boards ! Please check your Tools->Board setting.
#endif

#define _WEBSOCKETS_LOGLEVEL_ 2

#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>

#include <WebSocketsClient_Generic.h>

#include <ArduinoJson.h>
#include <ESP32Servo.h>

WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

#define WS_SERVER "192.168.254.113"
#define WS_PORT 8081
#define WS_PATH "/ws"

#define SSID "GFiber_F2A5E"
#define WIFIPW "dGu2zeTS"

Servo a1;
bool alreadyConnected = false;

// hardware pins
#define LED 25  // on when connected else off
#define SERVO_PIN_A1 32

void hexdump(const void* mem, const uint32_t& len, const uint8_t& cols = 16) {
  const uint8_t* src = (const uint8_t*)mem;

  Serial.printf("\n[HEXDUMP] Address: 0x%08X len: 0x%X (%d)", (ptrdiff_t)src, len, len);

  for (uint32_t i = 0; i < len; i++) {
    if (i % cols == 0) {
      Serial.printf("\n[0x%08X] 0x%08X: ", (ptrdiff_t)src, i);
    }

    Serial.printf("%02X ", *src);
    src++;
  }

  Serial.printf("\n");
}

void webSocketEvent(const WStype_t& type, uint8_t* payload, const size_t& length) {
  switch (type) {
    case WStype_DISCONNECTED:
      if (alreadyConnected) {
        Serial.println("[WSc] Disconnected!");
        alreadyConnected = false;
        digitalWrite(LED, LOW);
      }

      break;

    case WStype_CONNECTED:
      {
        alreadyConnected = true;
        digitalWrite(LED, HIGH);
        Serial.print("[WSc] Connected to url: ");
        Serial.println((char*)payload);

        // send message to server when Connected
        webSocket.sendTXT("Connected");
      }

      break;

    case WStype_TEXT:
      Serial.printf("[WSc] get text: %s\n", payload);

      //  when message received; if purchase; determine location
      onWebSocketMessage(payload);

      break;

    case WStype_BIN:
      Serial.printf("[WSc] get binary length: %u\n", length);
      hexdump(payload, length);

      // send data to server
      webSocket.sendBIN(payload, length);

      break;

    case WStype_PING:
      // pong will be send automatically
      Serial.printf("[WSc] get ping\n");

      break;

    case WStype_PONG:
      // answer to a ping we send
      Serial.printf("[WSc] get pong\n");

      break;

    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:

      break;

    default:
      break;
  }
}

void setup() {
  // setup hardware
  pinMode(LED, OUTPUT);

  Serial.begin(115200);

  while (!Serial)
    ;

  delay(200);

  Serial.print("\nStarting ESP32_WebSocketClient on ");
  Serial.println(ARDUINO_BOARD);
  Serial.println(WEBSOCKETS_GENERIC_VERSION);

  Serial.setDebugOutput(true);

  WiFiMulti.addAP(SSID, WIFIPW);

  //WiFi.disconnect();
  while (WiFiMulti.run() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }

  Serial.println();

  // Client address
  Serial.print("WebSockets Client started @ IP address: ");
  Serial.println(WiFi.localIP());

  // server address, port and URL
  Serial.print("Connecting to WebSockets Server @ ");
  Serial.print(WS_SERVER);
  Serial.print(":");
  Serial.print(WS_PORT);
  Serial.println(WS_PATH);

  // server address, port and URL; we wont use SSL
  webSocket.begin(WS_SERVER, WS_PORT, WS_PATH);

  // event handler
  webSocket.onEvent(webSocketEvent);

  // use HTTP Basic Authorization this is optional remove if not needed
  //webSocket.setAuthorization("user", "Password");

  // try ever 5000 again if connection has failed
  webSocket.setReconnectInterval(5000);

  // start heartbeat (optional)
  // ping server every 15000 ms
  // expect pong from server within 3000 ms
  // consider connection disconnected if pong is not received 2 times
  webSocket.enableHeartbeat(15000, 3000, 2);

  // server address, port and URL
  Serial.print("Connected to WebSockets Server @ IP address: ");
  Serial.println(WS_SERVER);
}

void loop() {
  webSocket.loop();
}


void onWebSocketMessage(uint8_t* payload) {
  const char* json = (char*)payload;

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, json);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  bool is_purchase = doc["is_purchase"];
  String location = String(doc["location"]);
  location.toLowerCase();

  if (is_purchase) {
    Serial.print("Location: ");
    Serial.println(location);

    if (location == "a-1") rotateA1(SERVO_PIN_A1);
  }
}

void rotateA1(int pin) {
  if (!a1.attached()) a1.attach(pin);

  a1.write(40);  // rotate
  delay(6000);

  a1.detach();
}