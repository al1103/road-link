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
  float cum[MAX_POINTS] = { 0 };
  float total = 0;
  uint16_t count = 0;
  String route;
  String maneuver = "ready";
  int turn = 0, remaining = 0, speed = 0;
  int speedLimit = -1;
  int32_t lat = 0, lng = 0;
  uint8_t heading = 0;
  bool headingValid = false;
  bool roadEnabled = false;
  String featureKind;
  int featureM = -1;
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
double metersBetween(const Point& a, const Point& b) {
  const double cosLat = cos((double(a.lat) + b.lat) / 2.0 / 1e7 * PI / 180.0);
  const double dx = double(b.lng - a.lng) / 1e7 * cosLat;
  const double dy = double(b.lat - a.lat) / 1e7;
  return sqrt(dx * dx + dy * dy) * 111320.0;
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
    float total = 0;
    state.cum[0] = 0;
    for (uint16_t i = 1; i < staged; i++) {
      total += metersBetween(state.points[i - 1], state.points[i]);
      state.cum[i] = total;
    }
    state.total = total;
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
    state.headingValid = !doc["heading"].isNull() && (doc["heading_available"] | true) && doc["heading"].is<int>();
    state.heading = state.headingValid ? uint8_t((((doc["heading"].as<int>()) % 360) + 360) % 360) : 0;
    state.roadEnabled = doc["road_data_enabled"] | false;
    JsonVariantConst feature = doc["road_feature"];
    if (feature.isNull()) { state.featureKind = ""; state.featureM = -1; }
    else {
      state.featureKind = feature["kind"] | "";
      state.featureM = feature["distance_m"] | -1;
      if (state.featureM < 0) state.featureM = -1;
    }
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
#if ROADLINK_OLED
float smoothHeading = 0;
bool smoothHeadingInit = false;
uint16_t pointAhead(const State& s, float ahead, int32_t& outLat, int32_t& outLng) {
  if (s.count < 2 || s.total <= 0) return 0;
  float fromStart = s.total - float(s.remaining);
  if (fromStart < 0) fromStart = 0;
  float target = fromStart + ahead;
  if (target < 0) target = 0;
  if (target >= s.total) { outLat = s.points[s.count - 1].lat; outLng = s.points[s.count - 1].lng; return s.count - 1; }
  uint16_t i = 1;
  while (i < s.count && s.cum[i] < target) i++;
  if (i >= s.count) { outLat = s.points[s.count - 1].lat; outLng = s.points[s.count - 1].lng; return s.count - 1; }
  const float span = s.cum[i] - s.cum[i - 1];
  const float t = span > 0 ? (target - s.cum[i - 1]) / span : 0;
  outLat = (int32_t)lround(s.points[i - 1].lat + (double(s.points[i].lat) - s.points[i - 1].lat) * t);
  outLng = (int32_t)lround(s.points[i - 1].lng + (double(s.points[i].lng) - s.points[i - 1].lng) * t);
  return i;
}
const char* maneuverLabel(const String& m) {
  if (m == "left") return "LEFT";
  if (m == "right") return "RIGHT";
  if (m == "slight-left") return "SLGT-L";
  if (m == "slight-right") return "SLGT-R";
  if (m == "uturn") return "U-TURN";
  if (m == "roundabout") return "R-ABOUT";
  if (m == "arrive") return "ARRIVE";
  if (m == "depart") return "START";
  return "AHEAD";
}
const char* featureLabel(const String& kind) {
  if (kind == "speed-camera" || kind == "traffic-camera" || kind == "camera") return "CAM";
  if (kind == "signals") return "LIGHT";
  if (kind == "stop") return "STOP";
  if (kind == "give-way") return "GIVE";
  if (kind == "rail-crossing") return "RAIL";
  if (kind == "pedestrian-crossing") return "CROSS";
  if (kind == "traffic-calming") return "BUMP";
  if (kind == "speed-sign") return "LIMIT";
  if (kind == "sign") return "SIGN";
  if (kind == "hazard") return "HAZARD";
  return "WARN";
}
void drawMap(const State& s) {
  display.drawFrame(0, 24, 128, 40);
  if (s.count < 2) return;
  const int left = 3, right = 124, top = 27, bottom = 61;
  const bool live = s.lastNav != 0;
  float fromStart = live ? s.total - float(s.remaining) : 0;
  if (fromStart < 0) fromStart = 0;
  float extra = 0;
  if (live) {
    extra = (float(s.speed) / 3.6f) * float(millis() - s.lastNav) / 1000.0f;
    if (extra > 2000.0f) extra = 2000.0f;
    if (extra > float(s.remaining)) extra = float(s.remaining);
  }
  float center = fromStart + extra;
  float startD = center - 150.0f;
  if (startD < 0) startD = 0;
  float aheadM = 400.0f;
  if (float(s.speed) * 8.0f > aheadM) aheadM = float(s.speed) * 8.0f;
  float endD = center + aheadM;
  if (endD > s.total) endD = s.total;
  if (endD <= startD) { startD = 0; endD = s.total; }
  uint16_t i0 = 0, i1 = s.count - 1;
  for (uint16_t i = 0; i < s.count; i++) { if (s.cum[i] >= startD) { i0 = i; break; } }
  for (uint16_t i = s.count; i-- > 0;) { if (s.cum[i] <= endD) { i1 = i; break; } }
  if (i1 < i0 + 1) { i0 = 0; i1 = s.count - 1; }
  int32_t minLat = s.points[i0].lat, maxLat = minLat, minLng = s.points[i0].lng, maxLng = minLng;
  for (uint16_t i = i0 + 1; i <= i1; i++) {
    if (s.points[i].lat < minLat) minLat = s.points[i].lat;
    if (s.points[i].lat > maxLat) maxLat = s.points[i].lat;
    if (s.points[i].lng < minLng) minLng = s.points[i].lng;
    if (s.points[i].lng > maxLng) maxLng = s.points[i].lng;
  }
  int32_t curLat = s.lat, curLng = s.lng;
  uint16_t curIdx = i0;
  if (live) {
    curIdx = pointAhead(s, extra, curLat, curLng);
    if (curLat < minLat) minLat = curLat;
    if (curLat > maxLat) maxLat = curLat;
    if (curLng < minLng) minLng = curLng;
    if (curLng > maxLng) maxLng = curLng;
  }
  const double cosLat = cos(double(curLat) / 1e7 * PI / 180.0);
  double spanX = double(maxLng - minLng) / 1e7 * cosLat;
  double spanY = double(maxLat - minLat) / 1e7;
  if (spanX < 1e-9) spanX = 1e-9;
  if (spanY < 1e-9) spanY = 1e-9;
  const double fitX = (right - left) / spanX, fitY = (bottom - top) / spanY;
  const double scale = (fitX < fitY ? fitX : fitY) * 0.9;
  const double offsetX = left + ((right - left) - spanX * scale) / 2.0;
  const double offsetY = top + ((bottom - top) - spanY * scale) / 2.0;
  auto mx = [&](int32_t lng) { return int16_t(offsetX + double(lng - minLng) / 1e7 * cosLat * scale); };
  auto my = [&](int32_t lat) { return int16_t(offsetY + double(maxLat - lat) / 1e7 * scale); };
  const uint16_t nearest = curIdx;
  for (uint16_t i = i0 + 1; i <= i1; i++) {
    if (live && i <= nearest && ((i - 1) % 2)) continue;
    display.drawLine(mx(s.points[i - 1].lng), my(s.points[i - 1].lat), mx(s.points[i].lng), my(s.points[i].lat));
  }
  if (live && !s.arrived) {
    if (s.turn > 0) {
      int32_t la = 0, ln = 0;
      const float ahead = float(s.turn) - extra > 0 ? float(s.turn) - extra : 0;
      const uint16_t idx = pointAhead(s, ahead, la, ln);
      if (idx >= i0 && idx <= i1) display.drawDisc(mx(ln), my(la), 2);
    }
    if (s.featureM >= 0 && s.featureM <= 900 && (millis() / 500) % 2 == 0) {
      int32_t la = 0, ln = 0;
      const float ahead = float(s.featureM) - extra > 0 ? float(s.featureM) - extra : 0;
      const uint16_t idx = pointAhead(s, ahead, la, ln);
      if (idx >= i0 && idx <= i1) {
        const int fx = mx(ln), fy = my(la);
        const bool above = fy - 9 >= 12;
        display.drawDisc(fx, fy, 1);
        if (above) display.drawTriangle(fx, fy - 8, fx - 4, fy - 3, fx + 4, fy - 3);
        else display.drawTriangle(fx, fy + 8, fx - 4, fy + 3, fx + 4, fy + 3);
      }
    }
    const int px = mx(curLng), py = my(curLat);
    if (s.headingValid) {
      if (!smoothHeadingInit) { smoothHeading = s.heading; smoothHeadingInit = true; }
      else {
        const float delta = fmodf(float(s.heading) - smoothHeading + 540.0f, 360.0f) - 180.0f;
        smoothHeading = fmodf(smoothHeading + delta * 0.25f + 360.0f, 360.0f);
      }
      const double rad = double(smoothHeading) * PI / 180.0;
      display.drawLine(px, py, px + int(sin(rad) * 7), py - int(cos(rad) * 7));
    }
    display.drawDisc(px, py, 2);
  }
}
#endif
void render(const State& s) {
#if ROADLINK_OLED
  display.clearBuffer();
  if (!s.connected) {
    display.setFont(u8g2_font_6x12_tf);
    display.drawStr(0, 12, "RoadLink BLE");
    display.drawStr(0, 32, "Waiting for phone");
    display.sendBuffer();
    return;
  }
  if (!s.count) {
    display.setFont(u8g2_font_6x12_tf);
    display.drawStr(0, 12, "Phone connected");
    display.drawStr(0, 32, "Start navigation");
    display.sendBuffer();
    return;
  }
  if (s.lastNav && millis() - s.lastNav > 10000) {
    display.setFont(u8g2_font_6x12_tf);
    display.drawStr(0, 12, "GPS / BLE stale");
    display.drawStr(0, 32, "Check your phone");
    display.sendBuffer();
    return;
  }
  display.setFont(u8g2_font_5x7_tf);
  display.drawStr(0, 7, (String(s.speed) + "km/h").c_str());
  const bool overLimit = s.speedLimit > 0 && s.speed >= s.speedLimit + 3;
  const bool overFlash = overLimit && (millis() / 350) % 2 == 0;
  if (s.speedLimit > 0) {
    char limit[4];
    snprintf(limit, sizeof(limit), "%d", s.speedLimit);
    if (overFlash) {
      display.drawBox(109, 0, 19, 11);
      display.setDrawColor(0);
      display.drawStr(112, 7, limit);
      display.setDrawColor(1);
    } else {
      display.drawFrame(110, 0, 18, 10);
      display.drawStr(112, 7, limit);
    }
  } else {
    display.drawStr(113, 7, "--");
  }
  if (s.lastNav && s.featureM >= 0 && s.featureM <= 900 && (millis() / 500) % 2 == 0) {
    char warning[20];
    snprintf(warning, sizeof(warning), "%s %dm", featureLabel(s.featureKind), s.featureM);
    display.drawStr(44, 7, warning);
  }
  if (s.lastNav && !s.arrived) {
    display.setFont(u8g2_font_7x13B_tf);
    char instruction[24];
    if (s.turn >= 1000) snprintf(instruction, sizeof(instruction), "%s %.1fkm", maneuverLabel(s.maneuver), float(s.turn) / 1000.0f);
    else snprintf(instruction, sizeof(instruction), "%s %dm", maneuverLabel(s.maneuver), s.turn);
    display.drawStr(2, 22, instruction);
  }
  drawMap(s);
  if (s.arrived) {
    display.drawBox(36, 38, 56, 13);
    display.setDrawColor(0);
    display.setFont(u8g2_font_6x12_tf);
    display.drawStr(42, 48, "ARRIVED");
    display.setDrawColor(1);
  }
  if (overFlash) display.drawFrame(0, 0, 128, 64);
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
  render(snapshot); delay(50);
}
