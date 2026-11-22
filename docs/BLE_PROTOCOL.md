# RoadLink BLE v1

Không dùng Wi-Fi. Điện thoại là BLE central; ESP32 là peripheral có tên `RoadLink ESP32`.

| GATT | UUID | Quyền |
|---|---|---|
| Service | `7b2e0001-6a5b-4c3d-9e8f-1029384756ab` | Advertised |
| Phone → ESP32 | `7b2e0002-6a5b-4c3d-9e8f-1029384756ab` | Write with response |
| ESP32 → Phone | `7b2e0003-6a5b-4c3d-9e8f-1029384756ab` | Read / Notify |

## Framing

Mỗi thông điệp là một đối tượng JSON UTF-8 + byte LF (`0x0A`). Một dòng tối đa **1536 byte, bao gồm LF**. MTU không phải kích thước thông điệp. App cắt dòng thành các gói tối đa `min(MTU − 3, 180)` byte; nếu không đọc được MTU hoặc dùng Web Bluetooth thì dùng 20 byte. Chờ từng write response trước khi gửi tiếp. Có thể cắt giữa một ký tự UTF-8; ESP32 chỉ parse sau khi đã nhận trọn dòng.

Khi tràn buffer, bỏ dữ liệu đến LF tiếp theo, rồi đọc lại. Ngắt kết nối phải xóa buffer chưa hoàn chỉnh. Chưa có ghép đôi/mã hóa ứng dụng: chỉ dùng prototype trên thiết bị của bạn; bổ sung bonding/passkey trước khi dùng với dữ liệu nhạy cảm.

## Gửi tuyến đường theo giao dịch

```json
{"v":1,"type":"hello","app":"RoadLink","protocol":1}
{"v":1,"type":"route.begin","route":"route-123","count":2}
{"v":1,"type":"route.points","route":"route-123","start":0,"points":[[107797500,1066990000],[107787500,1067010000]]}
{"v":1,"type":"route.end","route":"route-123","count":2}
```

`points` chứa `[latitude × 10^7, longitude × 10^7]`, là số nguyên. Tối đa 192 điểm, tối đa 12 điểm mỗi thông điệp. Nếu tuyến dài hơn, app lấy mẫu theo khoảng cách dọc tuyến. Đây là tuyến thu nhỏ để hiển thị tổng quan, không thay thế dữ liệu định tuyến đầy đủ trên điện thoại.

Firmware giữ tuyến đang nhận trong staging riêng, kiểm tra route ID, chỉ số `start`, số lượng và tọa độ. Chỉ commit khi `route.end` khớp hoàn toàn. Nếu cập nhật bị gián đoạn, tuyến đã commit trước đó vẫn nguyên vẹn.

## Cập nhật dẫn đường

```json
{"v":1,"type":"nav","route":"route-123","seq":1,"lat_e7":107797500,"lng_e7":1066990000,"heading":90,"speed_kmh":36,"maneuver":"right","turn_m":150,"remaining_m":1200,"eta_s":240,"arrived":false,"instruction":"Rẽ phải vào đường tiếp theo"}
{"v":1,"type":"stop"}
```

App gửi tối đa khoảng 1 nav/giây khi có dữ liệu mới, coalesce nav chậm. Khi đến nơi, gửi `arrived:true` ngay. `seq` tăng trong phiên app; firmware bỏ nav cũ hoặc sai route. Kết nối lại sẽ gửi lại tuyến đang dẫn trước khi gửi nav.

`maneuver`: `depart`, `straight`, `left`, `right`, `slight-left`, `slight-right`, `uturn`, `roundabout`, `arrive`.

Các field bổ sung tương thích ngược trong `nav`: `road_data_enabled`, `speed_limit_kmh` (số hoặc null), `speed_limit_source` (`osm` hoặc null), `road_feature` (`id`, `kind`, `distance_m`, `direction_verified:false`, hoặc null). Thiếu/không chắc phải gửi null, không giữ lại một mức cũ. `heading` là null và `heading_available:false` khi chưa xác định hướng. Firmware in đầy đủ JSON qua Serial; OLED có mức tốc độ nguồn OSM. Chưa có bộ icon/giọng Việt native trên ESP32.

App không còn trường hoặc luồng dữ liệu mô phỏng trong protocol gửi đi. Firmware tiếp tục từ chối gói mang cờ `demo:true` từ phiên bản cũ; không hiển thị DEMO/SIM hoặc tự phát vị trí mẫu. Các JSON trên là mô tả định dạng giao thức, không phải dữ liệu được gửi tự động khi mở app.

Status notify là chuỗi ASCII ngắn: `ready-v1`, `route-begin`, `route-ready`, `stopped`, hoặc lỗi như `bad-frame`, `bad-points`, `incomplete-route`. Write response xác nhận GATT đã nhận; không có cam kết hiển thị vật lý. Firmware ví dụ cảnh báo stale sau 10 giây không có nav.

## Những gì không truyền

Không truyền ảnh nền bản đồ đường phố, tile OSM hoặc ảnh màn hình iPhone ở bản đầu. ESP32 có thể vẽ đường tuyến và điểm hiện tại từ dữ liệu tọa độ. Bổ sung renderer/chế độ ảnh là một tính năng riêng, cần biết màn hình và băng thông thực tế.
