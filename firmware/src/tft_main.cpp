// RoadLink colour map firmware: ESP32-S3 + ST7789 240x240 + OSM vector pack on SD.
// Pins are defaults for a common GMT130-V1.0 wiring; override with build flags.
#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <SD.h>
#include <SPI.h>
#define LGFX_USE_V1
#include <LovyanGFX.hpp>

#ifndef TFT_SCLK
#define TFT_SCLK 12
#endif
#ifndef TFT_MOSI
#define TFT_MOSI 11
#endif
#ifndef TFT_DC
#define TFT_DC 9
#endif
#ifndef TFT_CS
#define TFT_CS 10
#endif
#ifndef TFT_RST
#define TFT_RST 8
#endif
#ifndef TFT_BL
#define TFT_BL 7
#endif
#ifndef SD_SCLK
#define SD_SCLK 39
#endif
#ifndef SD_MOSI
#define SD_MOSI 40
#endif
#ifndef SD_MISO
#define SD_MISO 41
#endif
#ifndef SD_CS
#define SD_CS 42
#endif
#ifndef ROADLINK_ROUND
#define ROADLINK_ROUND 0
#endif

constexpr const char* SERVICE_UUID = "7b2e0001-6a5b-4c3d-9e8f-1029384756ab";
constexpr const char* WRITE_UUID = "7b2e0002-6a5b-4c3d-9e8f-1029384756ab";
constexpr const char* STATUS_UUID = "7b2e0003-6a5b-4c3d-9e8f-1029384756ab";
constexpr size_t MAX_LINE = 1536;
constexpr uint16_t MAX_POINTS = 192;

constexpr uint16_t BG = 0x18E3;
constexpr uint16_t GREEN = 0x0B64;
constexpr uint16_t BLUE = 0x2C7F;
constexpr uint16_t BLUE_DIM = 0x8D3F;
constexpr uint16_t WHITE = 0xFFFF;
constexpr uint16_t YELLOW = 0xFE80;
constexpr uint16_t RED = 0xE1E6;
constexpr uint16_t AMBER = 0xFD20;
constexpr uint16_t GRAY = 0x9CD3;
constexpr uint16_t DARK = 0x2945;
constexpr int VEHICLE_Y = ROADLINK_ROUND ? 138 : 158;
constexpr int MAP_TOP = ROADLINK_ROUND ? 72 : 40;
constexpr int MAP_BOTTOM = ROADLINK_ROUND ? 174 : 240;

class LGFX : public lgfx::LGFX_Device {
#if ROADLINK_ROUND
  lgfx::Panel_GC9A01 panel;
#else
  lgfx::Panel_ST7789 panel;
#endif
  lgfx::Bus_SPI bus;
 public:
  LGFX() {
    {
      auto cfg = bus.config();
      cfg.spi_host = SPI2_HOST;
      cfg.spi_mode = 0;
      cfg.freq_write = 40000000;
      cfg.freq_read = 16000000;
      cfg.spi_3wire = false;
      cfg.use_lock = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;
      cfg.pin_sclk = TFT_SCLK;
      cfg.pin_mosi = TFT_MOSI;
      cfg.pin_miso = -1;
      cfg.pin_dc = TFT_DC;
      bus.config(cfg);
      panel.setBus(&bus);
    }
    {
      auto cfg = panel.config();
      cfg.pin_cs = TFT_CS;
      cfg.pin_rst = TFT_RST;
      cfg.pin_busy = -1;
      cfg.panel_width = 240;
      cfg.panel_height = 240;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      cfg.offset_rotation = 0;
      cfg.readable = false;
      cfg.invert = true;
      cfg.rgb_order = false;
      cfg.dlen_16bit = false;
      cfg.bus_shared = false;
      panel.config(cfg);
    }
    setPanel(&panel);
  }
};

LGFX tft;
LGFX_Sprite canvas(&tft);
SPIClass sdSPI(SPI3_HOST);
bool sdReady = false;

struct Pt { int32_t lat, lng; };
struct State {
  Pt pts[MAX_POINTS];
  float cum[MAX_POINTS] = { 0 };
  float total = 0;
  uint16_t count = 0;
  String route, maneuver = "ready", featureKind;
  int turn = 0, remaining = 0, speed = 0, speedLimit = -1, featureM = -1, eta_s = 0;
  int32_t lat = 0, lng = 0;
  uint8_t heading = 0;
  bool headingValid = false, arrived = false, connected = false;
  uint32_t lastNav = 0, lastSeq = 0;
};
State state;
Pt staging[MAX_POINTS];
String stagingRoute;
uint16_t expected = 0, staged = 0;
char line[MAX_LINE];
size_t lineLength = 0;
bool dropping = false;
NimBLECharacteristic* statusCharacteristic;
SemaphoreHandle_t stateMutex;

struct Road { uint8_t cls, count; int32_t* pts; int32_t minLat, maxLat, minLng, maxLng; };
uint8_t* mapBuf = nullptr;
Road* roads = nullptr;
uint16_t roadCount = 0;
int mapLa = 9999, mapLo = 9999;
bool mapMissing = false;
int mapFailLa = 9999, mapFailLo = 9999;
uint32_t mapRetryAt = 0;
float smoothMapHeading = 0;
bool smoothMapHeadingInit = false;

void* psmalloc(size_t n) { void* p = ps_malloc(n); return p ? p : malloc(n); }

void status(const char* text) {
  statusCharacteristic->setValue(text);
  statusCharacteristic->notify();
}

double metersBetween(const Pt& a, const Pt& b) {
  const double cosLat = cos((double(a.lat) + b.lat) / 2.0 / 1e7 * PI / 180.0);
  const double dx = double(b.lng - a.lng) / 1e7 * cosLat;
  const double dy = double(b.lat - a.lat) / 1e7;
  return sqrt(dx * dx + dy * dy) * 111320.0;
}

bool validPoint(JsonVariantConst value, Pt& out) {
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
    memcpy(state.pts, staging, staged * sizeof(Pt));
    float total = 0;
    state.cum[0] = 0;
    for (uint16_t i = 1; i < staged; i++) {
      total += metersBetween(state.pts[i - 1], state.pts[i]);
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
    bool valid = false;
    for (const auto* m : allowed) if (maneuver == m) valid = true;
    const int turn = doc["turn_m"] | -1, remaining = doc["remaining_m"] | -1, speed = doc["speed_kmh"] | -1;
    if (!valid || turn < 0 || remaining < 0 || speed < 0 || speed > 500 || !doc["lat_e7"].is<int32_t>() || !doc["lng_e7"].is<int32_t>()) { status("bad-nav"); return; }
    const int32_t lat = doc["lat_e7"], lng = doc["lng_e7"];
    if (lat < -900000000 || lat > 900000000 || lng < -1800000000 || lng > 1800000000) { status("bad-coordinate"); return; }
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    if (id != state.route || seq <= state.lastSeq) { xSemaphoreGive(stateMutex); status("stale-nav"); return; }
    state.lastSeq = seq; state.maneuver = maneuver; state.turn = turn; state.remaining = remaining;
    state.speed = speed; state.lat = lat; state.lng = lng; state.eta_s = doc["eta_s"] | 0;
    state.speedLimit = doc["speed_limit_kmh"].is<int>() ? doc["speed_limit_kmh"].as<int>() : -1;
    if (state.speedLimit < 1 || state.speedLimit > 300) state.speedLimit = -1;
    state.headingValid = !doc["heading"].isNull() && (doc["heading_available"] | true) && doc["heading"].is<int>();
    state.heading = state.headingValid ? uint8_t((((doc["heading"].as<int>()) % 360) + 360) % 360) : 0;
    JsonVariantConst feature = doc["road_feature"];
    if (feature.isNull()) { state.featureKind = ""; state.featureM = -1; }
    else {
      state.featureKind = feature["kind"] | "";
      state.featureM = feature["distance_m"] | -1;
      if (state.featureM < 0) state.featureM = -1;
    }
    state.arrived = doc["arrived"] | false; state.lastNav = millis();
    xSemaphoreGive(stateMutex);
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
    Serial.println("BLE disconnected");
  }
};

bool ensureMap(int32_t latE7, int32_t lngE7) {
  if (!sdReady) return false;
  const int la = (int)floor((double)latE7 / 1e7 * 10.0);
  const int lo = (int)floor((double)lngE7 / 1e7 * 10.0);
  if (mapBuf && la == mapLa && lo == mapLo) return true;
  if (mapMissing && la == mapFailLa && lo == mapFailLo && millis() < mapRetryAt) return false;
  char path[32];
  snprintf(path, sizeof path, "/map/%d_%d.rlm", la, lo);
  File f = SD.open(path, FILE_READ);
  if (!f) { mapMissing = true; mapFailLa = la; mapFailLo = lo; mapRetryAt = millis() + 2000; return false; }
  const size_t size = f.size();
  uint8_t* buf = (uint8_t*)psmalloc(size);
  if (!buf) { f.close(); mapRetryAt = millis() + 2000; return false; }
  const size_t got = f.read(buf, size);
  f.close();
  if (got != size || memcmp(buf, "RLM1", 4) != 0) { free(buf); mapMissing = true; mapFailLa = la; mapFailLo = lo; mapRetryAt = millis() + 2000; return false; }
  const uint16_t n = buf[4] | (buf[5] << 8);
  Road* list = (Road*)psmalloc(n * sizeof(Road));
  if (!list) { free(buf); mapRetryAt = millis() + 2000; return false; }
  size_t off = 8;
  uint16_t used = 0;
  for (uint16_t i = 0; i < n; i++) {
    if (off + 4 > size) break;
    const uint8_t cls = buf[off], count = buf[off + 1];
    if (off + 4 + count * 8 > size) break;
    list[used].cls = cls; list[used].count = count; list[used].pts = (int32_t*)(buf + off + 4);
    list[used].minLat = list[used].maxLat = list[used].pts[0];
    list[used].minLng = list[used].maxLng = list[used].pts[1];
    for (uint8_t k = 1; k < count; k++) {
      const int32_t plat = list[used].pts[k * 2], plng = list[used].pts[k * 2 + 1];
      if (plat < list[used].minLat) list[used].minLat = plat;
      if (plat > list[used].maxLat) list[used].maxLat = plat;
      if (plng < list[used].minLng) list[used].minLng = plng;
      if (plng > list[used].maxLng) list[used].maxLng = plng;
    }
    used++; off += 4 + count * 8;
  }
  if (mapBuf) free(mapBuf);
  if (roads) free(roads);
  mapBuf = buf; roads = list; roadCount = used; mapLa = la; mapLo = lo;
  mapMissing = false;
  return true;
}

uint16_t pointAhead(const State& s, float ahead, int32_t& outLat, int32_t& outLng) {
  if (s.count < 2 || s.total <= 0) { outLat = s.lat; outLng = s.lng; return 0; }
  float fromStart = s.total - float(s.remaining);
  if (fromStart < 0) fromStart = 0;
  float target = fromStart + ahead;
  if (target < 0) target = 0;
  if (target >= s.total) { outLat = s.pts[s.count - 1].lat; outLng = s.pts[s.count - 1].lng; return s.count - 1; }
  uint16_t i = 1;
  while (i < s.count && s.cum[i] < target) i++;
  if (i >= s.count) { outLat = s.pts[s.count - 1].lat; outLng = s.pts[s.count - 1].lng; return s.count - 1; }
  const float span = s.cum[i] - s.cum[i - 1];
  const float t = span > 0 ? (target - s.cum[i - 1]) / span : 0;
  outLat = (int32_t)lround(s.pts[i - 1].lat + (double(s.pts[i].lat) - s.pts[i - 1].lat) * t);
  outLng = (int32_t)lround(s.pts[i - 1].lng + (double(s.pts[i].lng) - s.pts[i - 1].lng) * t);
  return i;
}

void drawManeuver(const String& maneuver, int x, int y) {
  canvas.drawLine(x, y - 12, x, y + 8, WHITE);
  if (maneuver == "left" || maneuver == "slight-left") {
    canvas.drawLine(x, y - 4, x - 9, y - 4, WHITE);
    canvas.fillTriangle(x - 9, y - 10, x - 9, y + 2, x - 17, y - 4, WHITE);
  } else if (maneuver == "right" || maneuver == "slight-right") {
    canvas.drawLine(x, y - 4, x + 9, y - 4, WHITE);
    canvas.fillTriangle(x + 9, y - 10, x + 9, y + 2, x + 17, y - 4, WHITE);
  } else if (maneuver == "uturn") {
    canvas.drawCircle(x, y - 2, 7, WHITE);
    canvas.fillTriangle(x - 7, y - 6, x + 1, y - 10, x - 7, y - 12, WHITE);
  } else if (maneuver == "roundabout") {
    canvas.drawCircle(x, y - 2, 8, WHITE);
    canvas.fillTriangle(x + 3, y - 12, x + 11, y - 8, x + 3, y - 4, WHITE);
  } else if (maneuver == "arrive") {
    canvas.drawRect(x - 7, y - 12, 14, 16, WHITE);
    canvas.fillRect(x - 5, y - 10, 4, 4, WHITE);
  } else {
    canvas.fillTriangle(x, y - 14, x - 7, y - 2, x + 7, y - 2, WHITE);
  }
}

const char* featureTag(const String& kind) {
  if (kind == "speed-camera" || kind == "traffic-camera" || kind == "camera") return "CAM";
  if (kind == "signals") return "LIGHT";
  if (kind == "stop") return "STOP";
  if (kind == "give-way") return "GIVE";
  if (kind == "rail-crossing") return "RAIL";
  if (kind == "pedestrian-crossing") return "CROSS";
  if (kind == "traffic-calming") return "BUMP";
  if (kind == "speed-sign") return "LIMIT";
  if (kind == "sign") return "SIGN";
  if (kind == "hazard") return "HAZ";
  return "WARN";
}

void drawMap(const State& s, int32_t cLat, int32_t cLng, float heading, float extra) {
  const float scale = 0.42f;
  const double cosLat = cos(double(cLat) / 1e7 * PI / 180.0);
  const float rad = heading * PI / 180.0f;
  const float ch = cosf(rad), sh = sinf(rad);
  auto px = [&](int32_t lng, int32_t lat) {
    const double dx = (double(lng - cLng) / 1e7) * cosLat * 111320.0;
    const double dy = (double(lat - cLat) / 1e7) * 111320.0;
    return int(120 + (dx * ch - dy * sh) * scale);
  };
  auto py = [&](int32_t lng, int32_t lat) {
    const double dx = (double(lng - cLng) / 1e7) * cosLat * 111320.0;
    const double dy = (double(lat - cLat) / 1e7) * 111320.0;
    return int(VEHICLE_Y - (dx * sh + dy * ch) * scale);
  };
  auto style = [](uint8_t cls, uint16_t& color, uint8_t& width) {
    switch (cls) {
      case 0: color = AMBER; width = 4; break;
      case 1: color = 0xFE60; width = 3; break;
      case 2: color = 0xE71C; width = 3; break;
      case 3: color = 0xBDF7; width = 2; break;
      case 4: color = 0x8430; width = 1; break;
      default: color = 0x5AEB; width = 1; break;
    }
  };
  for (uint16_t i = 0; i < roadCount; i++) {
    const Road& r = roads[i];
    uint16_t color; uint8_t width;
    style(r.cls, color, width);
    const int x0 = px(r.minLng, r.minLat), x1 = px(r.maxLng, r.minLat), x2 = px(r.minLng, r.maxLat), x3 = px(r.maxLng, r.maxLat);
    const int y0 = py(r.minLng, r.minLat), y1 = py(r.maxLng, r.minLat), y2 = py(r.minLng, r.maxLat), y3 = py(r.maxLng, r.maxLat);
    const int minX = min(min(x0, x1), min(x2, x3)), maxX = max(max(x0, x1), max(x2, x3));
    const int minY = min(min(y0, y1), min(y2, y3)), maxY = max(max(y0, y1), max(y2, y3));
    if (maxX < -10 || minX > 250 || maxY < MAP_TOP || minY > MAP_BOTTOM + 5) continue;
    int prevX = px(r.pts[1], r.pts[0]), prevY = py(r.pts[1], r.pts[0]);
    for (uint8_t k = 1; k < r.count; k++) {
      const int x = px(r.pts[k * 2 + 1], r.pts[k * 2]);
      const int y = py(r.pts[k * 2 + 1], r.pts[k * 2]);
      if (width >= 3) canvas.drawWideLine(prevX, prevY, x, y, width + 2.0f, DARK);
      if (width >= 3) canvas.drawWideLine(prevX, prevY, x, y, width, color);
      else canvas.drawLine(prevX, prevY, x, y, color);
      prevX = x; prevY = y;
    }
  }
  if (s.count >= 2) {
    int32_t curLat, curLng;
    const uint16_t curIdx = pointAhead(s, extra, curLat, curLng);
    for (uint16_t i = 1; i < s.count; i++) {
      const int x0 = px(s.pts[i - 1].lng, s.pts[i - 1].lat);
      const int y0 = py(s.pts[i - 1].lng, s.pts[i - 1].lat);
      const int x1 = px(s.pts[i].lng, s.pts[i].lat);
      const int y1 = py(s.pts[i].lng, s.pts[i].lat);
      if (i <= curIdx) {
        canvas.drawLine(x0, y0, x1, y1, BLUE_DIM);
      } else {
        canvas.drawWideLine(x0, y0, x1, y1, 9.0f, 0x0B4A);
        canvas.drawWideLine(x0, y0, x1, y1, 6.0f, BLUE);
      }
    }
    if (s.turn > 0 && !s.arrived) {
      int32_t la, ln;
      pointAhead(s, max(0.0f, float(s.turn) - extra), la, ln);
      const int tx = px(ln, la), ty = py(ln, la);
      if (tx > 0 && tx < 240 && ty > MAP_TOP && ty < MAP_BOTTOM + 5) canvas.fillCircle(tx, ty, 4, WHITE);
    }
    const float visibleAhead = float(VEHICLE_Y - MAP_TOP) / scale;
    if (s.featureM >= 0 && s.featureM <= int(visibleAhead) && (millis() / 500) % 2 == 0) {
      int32_t la, ln;
      pointAhead(s, max(0.0f, float(s.featureM) - extra), la, ln);
      const int fx = px(ln, la), fy = py(ln, la);
      if (fx > 6 && fx < 234 && fy > MAP_TOP + 6 && fy < MAP_BOTTOM - 6) {
        canvas.fillTriangle(fx, fy - 10, fx - 7, fy + 2, fx + 7, fy + 2, YELLOW);
        canvas.fillTriangle(fx, fy, fx - 3, fy + 1, fx + 3, fy + 1, 0x0000);
      }
    }
  }
  // Vehicle arrow fixed near the bottom, map rotates around it.
  canvas.fillCircle(120, VEHICLE_Y, 12, 0x0A2D);
  canvas.fillCircle(120, VEHICLE_Y, 8, BLUE);
  canvas.fillTriangle(120, VEHICLE_Y - 14, 111, VEHICLE_Y + 5, 129, VEHICLE_Y + 5, WHITE);
}

void render(const State& s) {
  canvas.fillScreen(BG);
  if (!s.connected) {
    canvas.setTextColor(WHITE);
    canvas.setFont(&fonts::Font4);
    canvas.drawString("RoadLink", 16, 84);
    canvas.setFont(&fonts::Font2);
    canvas.drawString("Waiting for phone", 16, 120);
    canvas.pushSprite(0, 0);
    return;
  }
  if (!s.count) {
    canvas.setTextColor(WHITE);
    canvas.setFont(&fonts::Font4);
    canvas.drawString("Phone connected", 16, 84);
    canvas.setFont(&fonts::Font2);
    canvas.drawString("Start navigation", 16, 120);
    canvas.pushSprite(0, 0);
    return;
  }
  if (s.lastNav && millis() - s.lastNav > 10000) {
    canvas.setTextColor(WHITE);
    canvas.setFont(&fonts::Font4);
    canvas.drawString("GPS / BLE stale", 16, 84);
    canvas.setFont(&fonts::Font2);
    canvas.drawString("Check your phone", 16, 120);
    canvas.pushSprite(0, 0);
    return;
  }
  uint32_t age = s.lastNav ? millis() - s.lastNav : 0;
  if (age > 2000) age = 2000;
  float extra = s.lastNav ? (float(s.speed) / 3.6f) * float(age) / 1000.0f : 0;
  if (extra > float(s.remaining)) extra = float(s.remaining);
  int32_t cLat = s.lat, cLng = s.lng;
  if (s.lastNav) pointAhead(s, extra, cLat, cLng);
  else { cLat = s.pts[0].lat; cLng = s.pts[0].lng; }
  const float targetHeading = s.headingValid ? s.heading : 0;
  if (!smoothMapHeadingInit) { smoothMapHeading = targetHeading; smoothMapHeadingInit = true; }
  else {
    const float delta = fmodf(targetHeading - smoothMapHeading + 540.0f, 360.0f) - 180.0f;
    smoothMapHeading = fmodf(smoothMapHeading + delta * 0.2f + 360.0f, 360.0f);
  }
  ensureMap(cLat, cLng);
  drawMap(s, cLat, cLng, smoothMapHeading, extra);
  if (!sdReady || !mapBuf) {
    canvas.setTextColor(GRAY);
    canvas.setFont(&fonts::Font2);
    canvas.drawString(!sdReady ? "NO SD CARD" : "NO MAP DATA", 62, MAP_TOP + 6);
  }

  char main[24], left[28], mid[28], right[28];
  snprintf(left, sizeof left, "%d km/h", s.speed);
  snprintf(mid, sizeof mid, "%d.%d km", s.remaining / 1000, (s.remaining % 1000) / 100);
  snprintf(right, sizeof right, "%d min", (s.eta_s + 59) / 60);
#if ROADLINK_ROUND
  canvas.fillRoundRect(26, 14, 188, 56, 28, GREEN);
  drawManeuver(s.maneuver, 52, 42);
  canvas.setTextColor(WHITE);
  canvas.setFont(&fonts::Font4);
  snprintf(main, sizeof main, "%dm", s.turn);
  canvas.drawString(main, 76, 20);
  canvas.setFont(&fonts::Font2);
  if (s.lastNav && s.featureM >= 0 && s.featureM <= 900 && (millis() / 500) % 2 == 0) {
    canvas.setTextColor(YELLOW);
    snprintf(main, sizeof main, "%s %dm", featureTag(s.featureKind), s.featureM);
    canvas.drawString(main, 76, 44);
    canvas.setTextColor(WHITE);
  } else {
    canvas.drawString(s.arrived ? "ARRIVED" : "next", 76, 44);
  }
  if (s.speedLimit > 0) {
    canvas.fillRoundRect(166, 26, 40, 30, 8, WHITE);
    canvas.setTextColor(0x0000);
    canvas.setFont(&fonts::Font4);
    snprintf(main, sizeof main, "%d", s.speedLimit);
    canvas.drawString(main, 174, 30);
  }

  canvas.fillRoundRect(20, 176, 200, 52, 26, GREEN);
  canvas.setTextColor(WHITE);
  canvas.setFont(&fonts::Font2);
  canvas.drawString(left, 32, 190);
  canvas.drawString(mid, 94, 190);
  canvas.drawString(right, 164, 190);
#else
  canvas.fillRect(0, 0, 240, 38, GREEN);
  drawManeuver(s.maneuver, 22, 20);
  canvas.setTextColor(WHITE);
  canvas.setFont(&fonts::Font4);
  snprintf(main, sizeof main, "%dm", s.turn);
  canvas.drawString(main, 48, 6);
  canvas.setFont(&fonts::Font2);
  canvas.drawString(s.arrived ? "ARRIVED" : "next", 48, 24);
  if (s.lastNav && s.featureM >= 0 && s.featureM <= 900 && (millis() / 500) % 2 == 0) {
    canvas.setTextColor(YELLOW);
    snprintf(main, sizeof main, "%s %dm", featureTag(s.featureKind), s.featureM);
    canvas.drawString(main, 104, 8);
    canvas.setTextColor(WHITE);
  }
  if (s.speedLimit > 0) {
    canvas.fillRoundRect(186, 5, 46, 28, 6, WHITE);
    canvas.setTextColor(0x0000);
    canvas.setFont(&fonts::Font4);
    snprintf(main, sizeof main, "%d", s.speedLimit);
    canvas.drawString(main, 195, 7);
  }

  canvas.fillRect(0, 204, 240, 36, GREEN);
  canvas.setTextColor(WHITE);
  canvas.setFont(&fonts::Font2);
  canvas.drawString(left, 8, 214);
  canvas.drawString(mid, 82, 214);
  canvas.drawString(right, 180, 214);
#endif
  canvas.pushSprite(0, 0);
}

void setup() {
  Serial.begin(115200);
  stateMutex = xSemaphoreCreateMutex();
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);
  tft.init();
  tft.setRotation(0);
  canvas.setPsram(true);
  canvas.setColorDepth(16);
  canvas.createSprite(240, 240);
  sdSPI.begin(SD_SCLK, SD_MISO, SD_MOSI, SD_CS);
  sdReady = SD.begin(SD_CS, sdSPI, 20000000);
  Serial.printf("SD %s\n", sdReady ? "ready" : "missing");

  NimBLEDevice::init("RoadLink ESP32");
  NimBLEDevice::setMTU(185);
  auto* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());
  auto* service = server->createService(SERVICE_UUID);
  auto* write = service->createCharacteristic(WRITE_UUID, NIMBLE_PROPERTY::WRITE);
  write->setCallbacks(new WriteCallbacks());
  statusCharacteristic = service->createCharacteristic(STATUS_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  statusCharacteristic->setValue("ready-v1");
  server->start();
  auto* advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  NimBLEAdvertisementData scanResponse;
  scanResponse.setName("RoadLink ESP32");
  advertising->setScanResponseData(scanResponse);
  advertising->enableScanResponse(true);
  advertising->start();
  Serial.println("RoadLink colour display ready");
}

void loop() {
  static State snapshot;
  xSemaphoreTake(stateMutex, portMAX_DELAY);
  snapshot = state;
  xSemaphoreGive(stateMutex);
  render(snapshot);
  delay(66);
}
