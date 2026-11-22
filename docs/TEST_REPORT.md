# Báo cáo kiểm thử

Lượt xác nhận ngày 22/11/2026: thêm mô phỏng riêng xe di chuyển theo yêu cầu, mở rộng trích xuất OSM r2 và giữ dữ liệu biển/điểm đường bộ từ nguồn thật. Không thay API/GPS/BLE/voice. Các kiểm tra định vị, toàn tuyến, một bản đồ vector và nhà 3D vẫn được giữ.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | **20/20 PASS**, 4 file: phép tính, chính sách độ chính xác, framing và file OSM nguồn r2/điểm STOP dùng trong tuyến mô phỏng |
| `npm run build` | **PASS**, TypeScript và Vite |
| `npm run test:live` | **2/2 PASS**, gọi OSRM thật; kiểm tra thêm waypoint giữa tuyến không bị đọc thành đã đến đích |
| `npm run test:e2e` | **14/14 PASS**, 7 kịch bản × mobile/desktop Chromium, không thay API hay cấp tọa độ thiết bị; sau sửa bố cục mô phỏng chạy lại riêng 2 ca Bằng Liệt |
| `node scripts/production-map-smoke.mjs` | **PASS**: worker đóng gói, 74 feature nhà 3D Hoàn Kiếm, 120 điểm toàn tuyến Tiền Hải → Hà Nội r2 và giữ pitch 55°; mô phỏng Bằng Liệt đọc 338 điểm nguồn gần tuyến, xe chạy/hiện cảnh báo không phải tốc độ/tạm dừng/dừng, xe không bị bảng che; không có lỗi JavaScript. Xem `PRODUCTION_MAP_REPORT.json` |
| `npx cap sync ios` | **PASS**, đã chép bundle mới và cập nhật 4 plugin native |
| `node scripts/verify-offline-pack.mjs` | **PASS**, toàn bộ 1.346 shard, 45.059 way, 72.759 điểm r2 |
| `node scripts/audit-production-data.mjs` | Kiểm tra source/test/script không thay API hoặc cấp vị trí vào trình duyệt; cho phép mô phỏng xe riêng có nhãn; bundle web/iOS không chứa fixture, manifest khớp bản public hiện tại; đối chiếu đủ 1.346 shard mỗi bundle. Kết quả lần mới ở `NO_DEMO_AUDIT.json` |
| `node scripts/road-data-smoke.mjs` | Lượt trước r2 **PASS**, tuyến OSRM thật; 2 shard cục bộ HTTP 200, không gọi Overpass; 12 điểm gần tuyến và 1 nhóm mức tốc độ. Lượt này kiểm nguồn r2 bằng verify/audit và production smoke ở trên |
| `node scripts/visual-smoke.mjs` | Kiểm tra desktop/mobile tải nền vector OpenFreeMap và vẽ tuyến OSRM thật; ảnh nguồn trực tiếp ở `docs/screenshots/` |
| PlatformIO `esp32dev`, `esp32-oled` | **PASS**, đã biên dịch lại firmware từ chối dữ liệu mang cờ demo |

## Phạm vi kiểm thử

Unit test hiện tại kiểm tra phép tính khoảng cách/hướng, đơn vị tiếng Việt, parse mức tốc độ/điều kiện, framing UTF-8 và chính sách độ chính xác/tuổi dữ liệu vị trí. Kiểm tra nguồn đọc trực tiếp manifest/shard OSM đã đóng gói và xác minh SHA-256. Không có route/camera tổng hợp hoặc SDK giả lập.

E2E gọi geocoder/router thật và kiểm tra: một MapLibre instance/một canvas/cùng nền OpenFreeMap/OSM khi tìm điểm và xem tuyến; không có vị trí/địa điểm gắn sẵn; tuyến thật từ tọa độ nhập qua UI; gói đường tự tải không gọi Overpass; phân biệt số điểm nguồn và bộ lọc ẩn, khôi phục bộ lọc; ký hiệu đèn/camera; không có toast; màn hình không tràn ngang; lỗi quyền vị trí thật hiển thị trong bảng và cho thử lại; tìm Chợ Bến Thành qua geocoder thực.

Hai kịch bản mới kiểm tra tuyến Tiền Hải → Hà Nội được quét tới cuối, có điểm sau km 100 và marker khớp tổng số; nút 3D tăng pitch >45°, có building feature thực được render và chuyển lại 2D về pitch <1°. Đã xem ảnh desktop/mobile. Kiểm tra production bổ sung xác nhận worker xuất riêng trong `dist/assets`, không chỉ chạy được trên Vite dev. Xem `docs/PRODUCTION_MAP_REPORT.json`.

Kịch bản Bằng Liệt gọi OSRM thật và gói OSM r2: chọn tuyến → nguồn hoàn tất → phát xe ×8 → quãng đường tăng → hiện hình cảnh báo không phải tốc độ từ nguồn → tạm dừng giữ nguyên quãng đường → trạng thái BLE tắt → dừng xóa xe mô phỏng. Kiểm tra hình học xác nhận xe không bị bảng chỉ dẫn/bảng hành trình che. Ảnh ở `test-results/mobile-bang-liet-playback.png`, `test-results/desktop-bang-liet-playback.png` và bản production trong `docs/screenshots/production-bang-liet-playback.png`. Đây là kiểm tra phát lại vị trí có nhãn, không phải GPS phần cứng hoặc xác nhận chiều áp dụng biển.

Đã xóa các test dùng mock API/GPS/BLE/voice, toàn bộ `tests/fixtures` và bản sao test cũ. Không dùng `setGeolocation`, dữ liệu geolocation cấp sẵn, chặn/thay phản hồi mạng hoặc API speech/Bluetooth giả. Tọa độ đầu/cuối được nhập như người dùng chọn điểm đi thủ công, không được coi là vị trí thiết bị. Số 93 bài ở lượt trước không còn áp dụng cho bộ test mới này.

Kiểm tra loại bỏ dữ liệu giả được ghi trong `docs/NO_DEMO_AUDIT.json`. Protocol gửi đi không còn trường demo. Firmware chỉ giữ kiểm tra từ chối gói mang cờ mô phỏng từ app cũ. Các bài kiểm tra dựa trên dịch vụ thật phụ thuộc tình trạng mạng/nhà cung cấp, không có dữ liệu thay thế khi dịch vụ hỏng.

## Kiểm tra nguồn trực tiếp

Các script `scripts/visual-smoke.mjs` và `scripts/road-data-smoke.mjs` nhập hai đầu tuyến công khai ở TP.HCM qua UI, gọi OSRM và tải bản đồ thật. Không cấp vị trí cho trình duyệt. Báo cáo ở `docs/LIVE_ROAD_DATA_REPORT.json`; toàn bộ ảnh `docs/screenshots/` đã chụp lại từ luồng này. Đây vẫn **không phải GPS phần cứng** hoặc bằng chứng mọi biển/camera tồn tại ngoài đời.

Nguồn OSM là bản 20/11/2026 từ Geofabrik. Toàn bộ gói đã kiểm SHA-256, và attribution/ODbL được giữ trong manifest và giao diện. Đây là kiểm tra khả năng nạp dữ liệu, không phải xác nhận mọi biển/camera còn hiện hữu hay đang hoạt động.

## Chưa kiểm thử được

- Chưa build/ký IPA bằng Xcode hoặc chạy WebKit/native trên iPhone thật; Windows chỉ build web và đồng bộ cấu trúc iOS.
- Chưa kiểm thử WebGL/hiệu năng/bộ nhớ/worker trên iPhone thật. Các bài mobile chạy Chromium theo kích thước màn hình iPhone, không xác nhận GPU/WebKit iOS.
- Chưa lái xe kiểm tra GPS, hướng/nhắc rẽ, sai số và biển/camera thực tế.
- Chưa ghép iPhone–ESP32, đo tầm BLE, reconnect ngoài thực tế hoặc kiểm tra OLED vật lý.
- Đã bỏ adapter giả lập giọng/BLE; chưa nghe xác nhận giọng native hoặc ghép thiết bị thật. Không coi phần này đã được kiểm thử thay thế bằng phần cứng.
- Chưa có dữ liệu giao thông trực tiếp, giới hạn theo mọi loại xe hoặc dữ liệu thương mại VIETMAP.

Ứng dụng vẫn cần kiểm thử thiết bị và thực địa trước khi phát hành làm công cụ dẫn đường.
