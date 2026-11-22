# Kế hoạch và trạng thái

Cập nhật ngày 22/11/2026.

- [x] App độc lập có bản đồ, tìm địa điểm Việt Nam, GPS, chỉ dẫn tiếng Việt, ETA, tính lại tuyến; không phụ thuộc ESP32.
- [x] Thẻ địa điểm → Chỉ đường → chọn tuyến thay thế nếu router có → Bắt đầu; sửa/đảo điểm đầu và ghim điểm.
- [x] Xóa mock và fixture dịch vụ, GPS, BLE, voice; không tạo tuyến/camera/biển mẫu. Theo yêu cầu mới, bổ sung riêng mô phỏng xe dọc tuyến thật, có nhãn, tạm dừng/tiếp tục và ×1/3/8, không thay GPS hoặc gửi vị trí mô phỏng qua BLE.
- [x] Chỉ dùng giọng Việt có sẵn; thiếu voice thì hiển thị thông báo, không dùng tiếng Anh thay.
- [x] Gói OSM Việt Nam từ Geofabrik 20/11/2026, bản trích xuất 20261120-r2: 45.059 way có tag tốc độ, 72.759 điểm, 1.346 shard; thêm qua đường/giảm tốc/đường sắt/nguy cơ từ nguồn, kiểm hash và tự tải theo vùng/tuyến, Overpass chỉ dự phòng lỗi.
- [x] Matching tốc độ theo thứ tự node/hướng OSM, điều kiện GPS và xử lý không rõ; không bịa mức thiếu dữ liệu.
- [x] Hình SVG biển/camera, chú giải đèn giao thông và mũi tên hướng GPS; chưa có hướng thì ghi rõ.
- [x] Giữ một lớp nền qua các bước; bỏ marker địa điểm cố định lúc mở; sửa biển tốc độ che nút dữ liệu trên điện thoại.
- [x] BLE tùy chọn; protocol và firmware từ chối dữ liệu mang cờ mô phỏng; build lại Serial/OLED.
- [x] Sửa định vị: tách vị trí gần đúng để xem tuyến khỏi GPS để dẫn đường; retry khởi động lại watch; phân biệt nguyên nhân lỗi; dùng course di chuyển và vẽ vòng sai số.
- [x] Bỏ toast nổi; đưa lỗi vào bảng tương ứng. Sửa lớp điểm đi che nút tìm kiếm trên desktop.
- [x] Bộ test không thay API: 20 unit/dữ liệu nguồn + 2 định tuyến trực tiếp + 14 E2E PASS; thêm xe mô phỏng qua cảnh báo không phải tốc độ, tạm dừng và dừng; build web, production worker/3D/toàn tuyến, ảnh desktop/mobile. Kết quả và giới hạn phần cứng ở docs/TEST_REPORT.md.
- [x] Nghiên cứu 27 nguồn/tài liệu; audit các bộ camera/tốc độ khác, lưu provenance và giới hạn giấy phép. Không đưa dữ liệu bên thứ ba chưa rõ quyền vào app.
- [ ] Tích hợp dữ liệu thương mại/VIETMAP: chưa có API key/hợp đồng và chưa kiểm chứng quyền sử dụng.
- [x] Chuyển sang một renderer MapLibre/nền vector OpenFreeMap Positron ít POI; nút 2D/3D, nhà khối theo dữ liệu chiều cao, nhãn tiếng Việt/tên địa phương và la bàn xoay.
- [x] Xem trước quét cả tuyến có tiến độ, loại trùng, hủy khi đổi tuyến; cảnh báo/GPS giữ cửa sổ riêng. Đã kiểm thử toàn tuyến Tiền Hải → Hà Nội và nhà 3D Hoàn Kiếm trên Chromium mobile/desktop.
- [x] Tuyến mô phỏng yêu cầu từ Ngõ 37 Bằng Liệt đến Hoàn Kiếm qua điểm STOP OSM; 338 điểm nguồn gần tuyến, không gọi các điểm sang đường/giảm tốc/đường sắt là biển đã lắp.
- [ ] Build/ký và test trên iPhone thật; thử BLE/OLED với ESP32 thật; kiểm chứng ngoài đường.

Phạm vi hiện tại: định tuyến ô tô qua OSRM, chưa có giao thông trực tiếp/xe máy/đi bộ/GPS nền. Gói metadata offline không biến bản đồ và router thành ngoại tuyến. ESP32 nhận tuyến và chỉ dẫn, chưa nhận bản đồ nền đường phố. Chưa cam kết tương đương đầy đủ Google Maps/VIETMAP.
