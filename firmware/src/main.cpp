#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#ifndef ROADLINK_OLED
#define ROADLINK_OLED 0
#endif
#if ROADLINK_OLED
#include <U8g2lib.h>
#include <Wire.h>
// SSD1306 128x64 I2C. Default ESP32 SDA=21, SCL=22; adapt for your board.
U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(U8G2_R0, U8X8_PIN_NONE);
#endif

constexpr const char* SERVICE_UUID = "7b2e0001-6a5b-4c3d-9e8f-1029384756ab";
constexpr const char* WRITE_UUID   = "7b2e0002-6a5b-4c3d-9e8f-1029384756ab";
constexpr const char* STATUS_UUID  = "7b2e0003-6a5b-4c3d-9e8f-1029384756ab";
constexpr size_t MAX_LINE = 1536;
constexpr uint16_t MAX_POINTS = 192;
struct Point { int32_t lat; int32_t lng; };
struct State {
  Point points[MAX_POINTS];
  uint16_t count = 0;
  String route;
  String maneuver = "ready";
  int turn = 0, remaining = 0, speed = 0;
  int speedLimit = -1;
  int32_t lat = 0, lng = 0;
  bool arrived = false, connected = false;
  uint32_t lastNav = 0, lastSeq = 0;
};
State state;
Point staging[MAX_POINTS];
String stagingRoute;
uint16_t expected = 0, staged = 0;
char line[MAX_LINE];
size_t lineLength = 0;
bool dropping = false;
NimBLECharacteristic* statusCharacteristic;
SemaphoreHandle_t stateMutex;

void status(const char* text) {
  statusCharacteristic->setValue(text);
  statusCharacteristic->notify();
}
bool validPoint(JsonVariantConst value, Point& out) {
  if (!value.is<JsonArrayConst>()) return false;
  JsonArrayConst p = value.as<JsonArrayConst>();
  if (p.size() != 2 || !p[0].is<int32_t>() || !p[1].is<int32_t>()) return false;
  out = { p[0].as<int32_t>(), p[1].as<int32_t>() };
  return out.lat >= -900000000 && out.lat <= 900000000 && out.lng >= -1800000000 && out.lng <= 1800000000;
}
void handleLine() {
  JsonDocument doc;
  if (deserializeJson(doc, line, lineLength) || doc["v"].as<int>() != 1) { status("bad-frame"); return; }
  const String type = doc["type"] | "";
  if (doc["demo"] | false) { status("simulation-disabled"); return; }
  if (type == "hello") { status("ready-v1"); return; }
  if (type == "route.begin") {
    const int n = doc["count"] | 0;
    const String id = doc["route"] | "";
    // Clear staging even for malformed begin: never commit a stale transaction.
    expected = staged = 0; stagingRoute = "";
    if (n < 2 || n > MAX_POINTS || id.length() == 0 || id.length() > 64) { status("bad-route"); return; }
    expected = n; stagingRoute = id;
    status("route-begin"); return;
  }
  if (type == "route.points") {
    const String id = doc["route"] | "";
    const int start = doc["start"] | -1;
    JsonArrayConst points = doc["points"].as<JsonArrayConst>();
    if (!expected || id != stagingRoute || start != staged || points.isNull() || points.size() > 12 || !points.size() || staged + points.size() > expected) { expected = staged = 0; status("bad-points"); return; }
    for (JsonVariantConst p : points) {
      if (!validPoint(p, staging[staged])) { expected = staged = 0; status("bad-coordinate"); return; }
      staged++;
    }
    return;
  }
  if (type == "route.end") {
    const String id = doc["route"] | "";
    if (!expected || staged != expected || (doc["count"] | 0) != expected || id != stagingRoute) { status("incomplete-route"); return; }
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    memcpy(state.points, staging, staged * sizeof(Point));
    state.count = staged; state.route = id; state.lastSeq = 0;
    state.arrived = false; state.maneuver = "ready"; state.lastNav = 0;
    xSemaphoreGive(stateMutex);
    expected = staged = 0;
    status("route-ready"); return;
  }
  if (type == "nav") {
    const String id = doc["route"] | "";
    const uint32_t seq = doc["seq"] | 0;
    const String maneuver = doc["maneuver"] | "straight";
    const char* allowed[] = { "depart", "straight", "left", "right", "slight-left", "slight-right", "uturn", "roundabout", "arrive" };
    bool valid = false; for (const auto* m : allowed) if (maneuver == m) valid = true;
    const int turn = doc["turn_m"] | -1, remaining = doc["remaining_m"] | -1, speed = doc["speed_kmh"] | -1;
    if (!valid || turn < 0 || remaining < 0 || speed < 0 || speed > 500 || !doc["lat_e7"].is<int32_t>() || !doc["lng_e7"].is<int32_t>()) { status("bad-nav"); return; }
    const int32_t lat = doc["lat_e7"], lng = doc["lng_e7"];
    if (lat < -900000000 || lat > 900000000 || lng < -1800000000 || lng > 1800000000) { status("bad-coordinate"); return; }
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    if (id != state.route || seq <= state.lastSeq) { xSemaphoreGive(stateMutex); status("stale-nav"); return; }
    state.lastSeq = seq; state.maneuver = maneuver; state.turn = turn; state.remaining = remaining;
    state.speed = speed; state.lat = lat; state.lng = lng;
    state.speedLimit = doc["speed_limit_kmh"].is<int>() ? doc["speed_limit_kmh"].as<int>() : -1;
    if(state.speedLimit<1||state.speedLimit>300)state.speedLimit=-1;
    state.arrived = doc["arrived"] | false; state.lastNav = millis();
    xSemaphoreGive(stateMutex);
    // Full instruction remains UTF-8 in serial, even if your display font lacks Vietnamese.
    Serial.println(line);
    return;
  }
  if (type == "stop") {
    expected = staged = 0; stagingRoute = "";
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    state.count = 0; state.route = ""; state.maneuver = "ready"; state.lastNav = 0;
    state.arrived = false; state.turn = 0; state.speed = 0; state.remaining = 0;
    xSemaphoreGive(stateMutex);
    status("stopped"); return;
  }
  status("unknown-type");
}
class WriteCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo&) override {
    const std::string bytes = characteristic->getValue();
    for (const uint8_t b : bytes) {
      if (b == '\n') {
        if (!dropping && lineLength) { line[lineLength] = '\0'; handleLine(); }
        lineLength = 0; dropping = false;
      } else if (!dropping) {
        if (lineLength >= MAX_LINE - 1) { lineLength = 0; dropping = true; status("frame-too-long"); }
        else line[lineLength++] = static_cast<char>(b);
      }
    }
  }
};
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*, NimBLEConnInfo&) override {
    lineLength = 0; dropping = false; expected = staged = 0;
    xSemaphoreTake(stateMutex, portMAX_DELAY); state.connected = true; xSemaphoreGive(stateMutex);
    Serial.println("BLE connected");
  }
  void onDisconnect(NimBLEServer*, NimBLEConnInfo&, int) override {
    lineLength = 0; dropping = false; expected = staged = 0;
    xSemaphoreTake(stateMutex, portMAX_DELAY); state.connected = false; state.lastNav = 0; xSemaphoreGive(stateMutex);
    NimBLEDevice::startAdvertising();
    Serial.println("BLE disconnected; waiting for reconnect");
  }
};
void render(const State& s) {
#if ROADLINK_OLED
  display.clearBuffer(); display.setFont(u8g2_font_6x12_tf);
  if (!s.connected) {
    display.drawStr(0,12,"RoadLink BLE"); display.drawStr(0,32,"Waiting for phone");
  } else if (s.count && s.lastNav && millis() - s.lastNav > 10000) {
    display.drawStr(0,12,"GPS / BLE stale"); display.drawStr(0,32,"Check your phone");
  } else if (s.count && s.lastNav) {
    display.drawStr(0,10,"ROADLINK");
    display.drawStr(77,10,(String("OSM ")+(s.speedLimit>0?String(s.speedLimit):String("--"))).c_str());
    String label=s.arrived ? "ARRIVED" : s.maneuver; label.toUpperCase();
    display.drawStr(0,26,label.c_str());
    display.drawStr(0,42,(String(s.turn)+" m").c_str());
    display.drawStr(0,58,(String(s.speed)+" km/h").c_str());
    int32_t minLat=s.points[0].lat,maxLat=minLat,minLng=s.points[0].lng,maxLng=minLng;
    for(int i=1;i<s.count;i++) { minLat=min(minLat,s.points[i].lat); maxLat=max(maxLat,s.points[i].lat); minLng=min(minLng,s.points[i].lng); maxLng=max(maxLng,s.points[i].lng); }
    const double cosLat=cos(s.lat/1e7*PI/180.0);
    const double spanX=max(1.0,double(maxLng-minLng)*cosLat),spanY=max(1.0,double(maxLat-minLat));
    const double scale=42.0/max(spanX,spanY);
    auto x=[&](int32_t n){return int16_t(82+(n-minLng)*cosLat*scale);};
    auto y=[&](int32_t n){return int16_t(59-(n-minLat)*scale);};
    for(int i=1;i<s.count;i++) display.drawLine(x(s.points[i-1].lng),y(s.points[i-1].lat),x(s.points[i].lng),y(s.points[i].lat));
    display.drawDisc(constrain(x(s.lng),80,126),constrain(y(s.lat),14,62),2);
  } else {
    display.drawStr(0,12,"Phone connected"); display.drawStr(0,32,"Start navigation");
  }
  display.sendBuffer();
#else
  // Serial-only by default; no screen hardware is assumed.
  (void)s;
#endif
}
void setup() {
  Serial.begin(115200); stateMutex = xSemaphoreCreateMutex();
#if ROADLINK_OLED
  display.begin();
#endif
  NimBLEDevice::init("RoadLink ESP32"); NimBLEDevice::setMTU(185);
  auto* server=NimBLEDevice::createServer(); server->setCallbacks(new ServerCallbacks());
  auto* service=server->createService(SERVICE_UUID);
  auto* write=service->createCharacteristic(WRITE_UUID,NIMBLE_PROPERTY::WRITE);
  write->setCallbacks(new WriteCallbacks());
  statusCharacteristic=service->createCharacteristic(STATUS_UUID,NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  statusCharacteristic->setValue("ready-v1"); server->start();
  auto* advertising=NimBLEDevice::getAdvertising();
  // The 128-bit service UUID and full name cannot both fit the 31-byte primary advertisement.
  advertising->addServiceUUID(SERVICE_UUID);
  NimBLEAdvertisementData scanResponse; scanResponse.setName("RoadLink ESP32");
  advertising->setScanResponseData(scanResponse); advertising->enableScanResponse(true); advertising->start();
  Serial.println("RoadLink ready. No Wi-Fi or hotspot needed.");
}
void loop() {
  // Snapshot under a short mutex; slow display I/O never blocks BLE state updates.
  static State snapshot;
  xSemaphoreTake(stateMutex,portMAX_DELAY); snapshot=state; xSemaphoreGive(stateMutex);
  render(snapshot); delay(200);
}
