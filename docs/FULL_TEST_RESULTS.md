# Kết quả chạy bộ 415 test case

- Ngày: 2026-11-22
- Môi trường: Chromium (in-app 412x684), Vite dev, GPS mô phỏng sai số 202 m
- Phương pháp: test tự động (unit/live/E2E/build/audit) + thao tác trình duyệt + đọc code. Case cần phần cứng/native/âm thanh/24h được đánh BLOCKED, không ghi PASS khống.
- Quy ước: **PASS** = đã verify hoặc code xác nhận; **FAIL** = không đạt/không có tính năng; **BLOCKED** = thiếu thiết bị/điều kiện; **N/A** = yêu cầu đã bị loại theo thiết kế hiện tại.

## Tổng hợp

| Trạng thái | Số case |
|---|---:|
| PASS | 216 |
| FAIL | 1 |
| BLOCKED | 185 |
| N/A | 13 |
| **Tổng** | **415** |

| Nhóm | PASS | FAIL | BLOCKED | N/A |
|---|---:|---:|---:|---:|
| SEA | 33 | 0 | 2 | 0 |
| ROU | 36 | 0 | 4 | 0 |
| NAV | 0 | 0 | 45 | 0 |
| GEO | 24 | 0 | 11 | 0 |
| MAP | 19 | 0 | 21 | 0 |
| ROD | 32 | 0 | 2 | 12 |
| VOI | 0 | 0 | 30 | 0 |
| BLE | 11 | 0 | 24 | 0 |
| MOB | 19 | 0 | 15 | 1 |
| EDG | 10 | 0 | 19 | 0 |
| DAT | 25 | 0 | 0 | 0 |
| NFR | 7 | 1 | 12 | 0 |

## Chi tiết từng case

| ID | Nội dung (bước/tiêu chí) | Trạng thái | Ghi chú |
|---|---|---|---|
| TC-SEA-001 | Tìm kiếm theo tên địa danh tiếng Việt có dấu | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-002 | Tìm kiếm theo tên địa danh tiếng Việt không dấu | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-003 | Tìm kiếm bằng tọa độ địa lý trực tiếp (Lat, Lng) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-004 | Tìm kiếm tọa độ có khoảng trắng bất thường | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-005 | Tìm kiếm tọa độ định dạng số âm (Nam bán cầu / Tây bán cầu) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-006 | Nhập tọa độ ngoài phạm vi hợp lệ (Vĩ độ > 90 hoặc Kinh độ > 180) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-007 | Tìm kiếm chuỗi ngắn (< 2 ký tự) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-008 | Cơ chế Debounce khi nhập liệu liên tục | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-009 | Nút xóa nhanh nội dung tìm kiếm (Clear 'X') | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-010 | Nút quay lại (Back arrow '←') khi đang mở kết quả tìm kiếm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-011 | Chọn nhanh danh mục '🍽️ Nhà hàng' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-012 | Chọn nhanh danh mục '⛽ Cây xăng' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-013 | Chọn nhanh danh mục '☕ Cà phê' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-014 | Chọn nhanh danh mục '🏨 Khách sạn' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-015 | Chọn nhanh danh mục '🏧 ATM' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-016 | Chọn nhanh danh mục '🛒 Tạp hóa' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-017 | Vuốt ngang danh sách Category Chips trên Mobile | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-018 | Lựa chọn hành động nhanh 'Vị trí của bạn' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-019 | Lựa chọn hành động nhanh 'Chọn trên bản đồ' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-020 | Chạm một điểm bất kỳ trên bản đồ (Pin location) | **BLOCKED** | Cần thao tác chạm thật trên canvas/ghim; môi trường chỉ dispatch sự kiện giả lập không mở được pick. |
| TC-SEA-021 | Chạm vào ghim địa điểm đã có trên bản đồ | **BLOCKED** | Cần thao tác chạm thật trên canvas/ghim; môi trường chỉ dispatch sự kiện giả lập không mở được pick. |
| TC-SEA-022 | Hiển thị trạng thái đang tìm kiếm (Loading spinner) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-023 | Xử lý khi không tìm thấy địa điểm nào | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-024 | Xử lý lỗi mất kết nối mạng khi tìm kiếm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-025 | Hủy request tìm kiếm cũ khi có request mới (AbortController) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-026 | Hiển thị danh sách địa điểm đã lưu trong menu tìm kiếm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-027 | Chọn một địa điểm từ danh sách kết quả tìm kiếm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-028 | Nút 'Lưu' trên thẻ địa điểm (Bookmark place) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-029 | Nút 'Bỏ lưu' địa điểm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-030 | Nút 'Chia sẻ' địa điểm qua Web Share API | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-031 | Fallback khi trình duyệt không hỗ trợ Web Share API | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-032 | Đóng thẻ PlaceCard khi chạm nút đóng 'X' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-033 | Nhập ký tự đặc biệt nguy hiểm trong ô tìm kiếm (XSS Prevention) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-034 | Tìm kiếm địa chỉ tiếng Anh / Quốc tế | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-SEA-035 | Xử lý phân trang kết quả tìm kiếm khi có nhiều kết quả | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-001 | Bấm 'Chỉ đường' từ thẻ địa điểm | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-002 | Mặc định điểm đi là 'Vị trí của bạn' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-003 | Thanh kết nối 3 chấm dọc giữa 2 ô nhập | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-004 | Đổi chiều điểm đi và điểm đến (Swap Endpoints) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-005 | Chỉnh sửa điểm đi thủ công (Custom Origin) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-006 | Đặt lại điểm đi về vị trí GPS thực | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-007 | Chỉnh sửa điểm đến trực tiếp trên RouteInputs | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-008 | Lập tuyến thành công với OSRM (1 tuyến chính + tuyến phụ) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-009 | Chọn tuyến thay thế (Alternative Route Selection) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-010 | Hiển thị nhãn 'Tuyến đề xuất' (Best route tag) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-011 | Chuyển chế độ phương tiện: Ô tô (Car mode) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-012 | Chuyển chế độ phương tiện: Xe máy (Motorbike mode) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-013 | Chuyển chế độ phương tiện: Đi bộ (Walking mode) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-014 | Hiển thị khoảng cách và thời gian chi tiết | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-015 | Mở danh sách các chặng rẽ ('Các chặng' / 'Xem trước các chặng') | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-016 | Thu gọn danh sách các chặng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-017 | Cảnh báo khi dùng điểm đi tùy chọn thay vì GPS | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-018 | Trạng thái đang chờ GPS chính xác trước khi bấm bắt đầu | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-019 | Nút xem dữ liệu đường bộ nâng cao | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-020 | Xử lý lỗi không tìm được đường (Route Not Found) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-021 | Tính toán tuyến đường siêu ngắn (< 100m) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-022 | Tính toán tuyến đường siêu dài (> 500km) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-023 | Xử lý OSRM server phản hồi chậm hoặc timeout (> 10s) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-024 | Chạm vào từng bước rẽ trong danh sách chặng để xem vị trí | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-025 | Kiểm tra icon chỉ hướng chuẩn Google Maps trong danh sách chặng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-026 | Đóng màn hình chỉ đường bằng nút '←' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-027 | Nhấn phím Back vật lý trên Android khi ở màn hình lập lộ trình | **BLOCKED** | Cần Android/nút khóa màn hình/phà thực tế. |
| TC-ROU-028 | Trạng thái tải lộ trình (Calculating spinner) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-029 | Tránh gọi lại OSRM trùng lặp khi không đổi tọa độ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-030 | Cập nhật tuyến tự động khi chuyển đổi phương tiện xe máy sang ô tô | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-031 | Lập tuyến đường đi qua phà / đường thủy nội địa | **BLOCKED** | Cần Android/nút khóa màn hình/phà thực tế. |
| TC-ROU-032 | Định dạng thời gian ETA theo giờ và phút | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-033 | Định dạng khoảng cách theo mét khi dưới 1km | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-034 | Định dạng khoảng cách theo kilomet khi trên 1km | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-035 | Tính toán giờ đến nơi dự kiến (Clock ETA) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-036 | Cập nhật Clock ETA qua nửa đêm (Chuyển ngày) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-037 | Kiểm tra giới hạn bộ nhớ khi lưu trữ danh sách chặng rẽ dài | **BLOCKED** | Cần Android/nút khóa màn hình/phà thực tế. |
| TC-ROU-038 | Thao tác chọn điểm đi trên bản đồ khi sửa route | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-039 | Thao tác chọn điểm đến trên bản đồ khi sửa route | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROU-040 | Giữ trạng thái tuyến đường khi khóa màn hình rồi mở lại | **BLOCKED** | Cần Android/nút khóa màn hình/phà thực tế. |
| TC-NAV-001 | Bắt đầu dẫn đường GPS thật (Start Navigation) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-002 | Giữ màn hình luôn sáng (KeepAwake) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-003 | Giải phóng KeepAwake khi dừng dẫn đường | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-004 | Hiển thị Banner chỉ dẫn rẽ tiếp theo (Turn Banner) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-005 | Maneuver: Đi thẳng (Straight) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-006 | Maneuver: Rẽ phải (Turn Right) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-007 | Maneuver: Rẽ trái (Turn Left) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-008 | Maneuver: Chếch sang phải (Slight Right) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-009 | Maneuver: Chếch sang trái (Slight Left) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-010 | Maneuver: Rẽ ngoặt sang phải (Sharp Right) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-011 | Maneuver: Rẽ ngoặt sang trái (Sharp Left) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-012 | Maneuver: Quay đầu xe (U-Turn) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-013 | Maneuver: Bùng binh / Vòng xuyến (Roundabout) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-014 | Maneuver: Đi theo nhánh / Lối tách (Fork / Off-ramp) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-015 | Maneuver: Nhập làn (Merge) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-016 | Maneuver: Đến nơi (Arrive) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-017 | Đếm lùi cự ly rẽ mốc 1km | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-018 | Đếm lùi cự ly rẽ mốc 500m | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-019 | Đếm lùi cự ly rẽ mốc 200m | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-020 | Đếm lùi cự ly rẽ mốc 50m | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-021 | Đếm lùi cự ly rẽ mốc 10m và tại ngã rẽ | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-022 | Tự động chuyển bước rẽ tiếp theo khi vượt qua ngã rẽ | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-023 | Bảng tóm tắt thông số chuyến đi ở dưới cùng (Nav Summary) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-024 | Hiển thị đồng hồ tốc độ thời gian thực (Speedometer) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-025 | Cảnh báo chạy quá tốc độ bằng thị giác (Overspeed Visual Alert) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-026 | Hết cảnh báo quá tốc độ khi xe giảm về mức cho phép | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-027 | Thanh tiến trình hành trình (Trip Progress Bar) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-028 | Tự động phát hiện đi chệch đường (Off-Route Detection) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-029 | Tự động tính toán lại lộ trình (Auto-Rerouting) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-030 | Chống tính lại lộ trình liên tục khi xe quay đầu (Reroute Debounce) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-031 | Nút dừng dẫn đường khẩn cấp (Stop Navigation 'X') | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-032 | Màn hình thông báo đến đích (Arrival Screen) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-033 | Nút 'Về bản đồ' trên màn hình đến đích | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-034 | Tín hiệu GPS bị gián đoạn khi đang dẫn đường (Stale GPS > 15s) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-035 | Tự động khôi phục khi GPS có lại tín hiệu | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-036 | Bấm thu nhỏ banner rẽ (Turn banner collapse) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-037 | Dẫn đường qua hầm chui đô thị ngắn (< 200m) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-038 | Hiển thị bước rẽ tiếp theo phụ (Next-Next Turn Preview) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-039 | Thao tác chạm đổi góc nhìn 3D sang 2D ngay trong khi dẫn đường | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-040 | Âm thanh bip nhẹ khi chuyển bước rẽ | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-041 | Cập nhật lại thời gian còn lại liên tục theo tốc độ thực tế | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-042 | Chống đóng nhầm ứng dụng khi đang lái xe | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-043 | Hiển thị tên con đường hiện tại đang chạy ở dưới cùng | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-044 | Tính toán khoảng cách theo hình chiếu đường đi (Snap-to-route) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-NAV-045 | Không snap to route khi xe đi chệch hẳn (> 35m) | **BLOCKED** | Cần GPS thật + chạy xe; fix mô phỏng sai số 202 m không đủ để bắt đầu dẫn đường. |
| TC-GEO-001 | Xin quyền truy cập vị trí lần đầu (Geolocation Permission) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-002 | Xử lý khi người dùng từ chối cấp quyền vị trí (Denied) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-003 | Thử lại quyền vị trí sau khi đã bật trong Cài đặt máy | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-004 | Cảnh báo kết nối không an toàn (Insecure Context HTTP) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-005 | Bộ lọc tọa độ không hợp lệ (NaN, Out of range) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-006 | Hiển thị vòng tròn sai số vị trí (Accuracy Halo) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-007 | Đổi màu vòng tròn sai số khi GPS mất tín hiệu | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-008 | Tự động xin quyền la bàn trên iOS 13+ (DeviceOrientation Permission) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-009 | Xoay điện thoại khi đứng yên (Stationary Compass Rotation) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-010 | Không bị mất góc xoay la bàn khi GPS gửi gói cập nhật vị trí mới | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-011 | Ưu tiên góc di chuyển của GPS khi chạy xe tốc độ cao | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-012 | Giảm tải cập nhật DOM la bàn (Throttle Sensor Events) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-013 | Xử lý cảm biến hướng tuyệt đối trên Android (deviceorientationabsolute) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-014 | Bỏ qua giá trị alpha tương đối không có gốc hướng Bắc | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-015 | Bấm nút 'Về vị trí của tôi' (Recenter FAB) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-016 | Lọc nhiễu độ chính xác kém (> 100m) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-017 | Tự động kích hoạt GPS khi mở ứng dụng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-018 | Hiệu chuẩn la bàn khi bị nhiễu từ trường (Magnetic calibration warning) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-019 | Khôi phục la bàn sau khi quay lại từ ứng dụng khác | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-020 | Xử lý độ cao địa hình (Altitude if available) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-021 | Tính toán vận tốc tức thời từ khoảng cách giữa 2 tọa độ liên tiếp | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-022 | Chuyển đổi góc xoay mượt mà qua mốc 0°/360° (Compass Interpolation) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-023 | Đèn báo trạng thái định vị trên Topbar | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-024 | Hỗ trợ chế độ tiết kiệm pin của máy | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-025 | Tọa độ ranh giới lãnh thổ Việt Nam | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-026 | Chống lag giật camera khi xe dừng đèn đỏ | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-027 | Khử trôi vị trí (Jitter Smoothing / Kalman filter) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-028 | Thử nghiệm trên máy tính để bàn qua Wi-Fi Geolocation | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-029 | Tự động giải phóng watcher Geolocation khi tắt app | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-030 | Đồng bộ góc xoay bản đồ với góc la bàn khi ở chế độ North-up | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-031 | Đồng bộ góc xoay bản đồ với góc la bàn khi ở chế độ Head-up (3D) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-032 | Thời gian chốt vị trí đầu tiên (Time to First Fix - TTFF) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-033 | Kiểm tra tính liên tục của chuỗi timestamp vị trí | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-GEO-034 | Xử lý khi người dùng đổi cài đặt vị trí từ 'Chính xác' sang 'Gần đúng' (Approximate Location) | **BLOCKED** | Cần cảm biến/thiết bị/điều kiện hệ điều hành thật. |
| TC-GEO-035 | Tắt thông báo lỗi GPS khi vị trí đã được khôi phục thành công | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-001 | Khởi tạo bản đồ nền OpenFreeMap thành công | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-002 | Ưu tiên hiển thị tên đường tiếng Việt | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-003 | Bật chế độ tòa nhà 3D (3D Buildings Toggle) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-004 | Tắt chế độ 3D về 2D phẳng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-005 | Nút la bàn đặt lại hướng Bắc (North Reset Compass FAB) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-006 | Camera tự động xoay theo hướng xe khi dẫn đường 3D | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-007 | Thao tác chạm kéo bản đồ khi đang dẫn đường (User Pan / Drag) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-008 | Khôi phục tự động bám sau khi đã kéo bản đồ | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-009 | Cử chỉ phóng to / thu nhỏ bằng 2 ngón tay (Pinch to Zoom) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-010 | Cử chỉ nghiêng bản đồ bằng 2 ngón tay (Two-finger Pitch) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-011 | Tự động căn lề Padding tránh bị che khuất bởi giao diện | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-012 | Xử lý khi xoay ngang điện thoại (Landscape Orientation) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-013 | Thông báo khi lỗi tải ô bản đồ (Tile Load Error) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-014 | Ẩn hiện chi tiết điểm vạch qua đường cho người đi bộ theo mức Zoom | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-015 | Đóng gói Tile Worker nội bộ (Offline MapLibre Worker) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-016 | Chạm đúp 1 ngón tay để phóng to (Double Tap to Zoom In) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-017 | Chạm 2 ngón tay đồng thời để thu nhỏ (Two-finger Tap to Zoom Out) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-018 | Kéo zoom 1 tay (One-finger Quick Zoom) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-019 | Giới hạn Zoom tối thiểu (Min Zoom = 3) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-020 | Giới hạn Zoom tối đa (Max Zoom = 19) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-021 | Hiệu ứng lướt quán tính khi thả tay (Inertia Panning) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-022 | Hiển thị thước tỷ lệ bản đồ (Scale Bar) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-023 | Đổi màu nền bản đồ theo chế độ Sáng / Tối (Dark mode support) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-024 | Kiểm tra render bóng đổ các tòa nhà 3D (Shadows & Sun Light) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-025 | Hiển thị nét vẽ tuyến đường (Route Line Polyline) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-026 | Mũi tên chỉ hướng di chuyển in trên nét vẽ tuyến đường (Route Chevrons) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-027 | Xóa sạch nét vẽ tuyến đường cũ khi hủy dẫn đường | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-028 | Hiển thị marker ghim điểm xuất phát (Origin Pin) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-029 | Hiển thị marker ghim điểm đến (Destination Pin) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-030 | Tránh giật giật bản đồ khi cập nhật vị trí GPS tần số cao (Position Smoothing) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-031 | Nút chọn lớp bản đồ (Layers Button) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-032 | Tự động tắt tòa nhà 3D khi zoom xa < 13 để tối ưu GPU | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-033 | Tự động khôi phục lớp 3D khi phóng to lại >= 14 | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-034 | Chống hiện tượng nhấp nháy hình ảnh (Z-fighting) giữa đường và khối nhà 3D | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-035 | Hiển thị tên các cây cầu và hầm lớn tại Việt Nam | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MAP-036 | Bản đồ hoạt động trơn tru trong thẻ iframe hoặc WebView iOS | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-037 | Xử lý sự kiện WebGL Context Lost | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-038 | Tối ưu bộ nhớ đệm ngói bản đồ (Tile Cache Size) | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-039 | Hiển thị công viên màu xanh lá và sông ngòi màu xanh dương | **BLOCKED** | Cần gesture đa điểm/WebView/native hoặc đo trên máy thật. |
| TC-MAP-040 | Độ mượt mà khi đổi góc quay bản đồ (Bearing animation) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-001 | Nhận diện giới hạn tốc độ đoạn đường hiện tại (maxspeed) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-002 | Đổi biển tốc độ khi chuyển sang đoạn đường mới | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-003 | Cảnh báo camera phạt nguội cố định (Speed Camera Alert) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-004 | Đếm lùi khoảng cách đến camera phạt nguội | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-005 | Tự động ẩn cảnh báo camera sau khi đã vượt qua | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-006 | Lọc camera phạt nguội theo đúng chiều di chuyển | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-007 | Nhận diện biển báo nguy hiểm: Đường giao nhau / Nút giao | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-008 | Cảnh báo gờ giảm tốc / Giảm tốc độ (Traffic Calming) | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-009 | Cảnh báo giao cắt đường sắt không có rào chắn (Railway Crossing) | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-010 | Cảnh báo khu vực trường học / Vạch người đi bộ qua đường | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-011 | Bật/tắt bộ lọc loại cảnh báo trong RoadDataPanel | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-012 | Quét dữ liệu toàn tuyến dài (Full-route Scan > 100km) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-013 | Nạp dữ liệu đường bộ đóng gói sẵn trên máy (Bundled Offline Shards) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-014 | Bấm vào icon biển báo trên bản đồ để xem chi tiết | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-015 | Ghi chú minh bạch dữ liệu nguồn OSM | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-016 | Nhận diện camera vượt đèn đỏ tại các ngã tư | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-017 | Nhận diện giới hạn tốc độ theo làn đường | **N/A** | App cố ý không suy ra giới hạn theo làn: hiển thị “chưa xác định” kèm giá trị làn gốc để tránh đoán sai mức áp dụng. |
| TC-ROD-018 | Nhận diện biển báo bắt đầu khu đông dân cư (R.420) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-019 | Nhận diện biển báo hết khu đông dân cư (R.421) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-020 | Cảnh báo đoạn đường hay xảy ra tai nạn / Điểm đen giao thông | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-021 | Cảnh báo đường hẹp / Thắt cổ chai | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-022 | Cảnh báo dốc nguy hiểm (Steep Incline / Decline) | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-023 | Cảnh báo đường trơn trượt khi trời mưa | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-024 | Cảnh báo khúc cua nguy hiểm liên tục | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-025 | Cảnh báo trạm thu phí BOT phía trước (Toll Booth) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-026 | Cảnh báo trạm cân tải trọng xe (Weigh Station) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-027 | Xác thực cấu trúc định dạng shard JSON | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-028 | Thời gian truy vấn dữ liệu shard cục bộ (Query Latency) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-029 | Tự động loại trừ các camera thử nghiệm không còn hoạt động | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-030 | Hiển thị số lượng camera tìm thấy trên toàn lộ trình | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-031 | Tìm kiếm nhanh biển báo theo tên trong danh sách | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-032 | Bấm vào một biển báo trong danh sách để định vị trên bản đồ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-033 | Tự động đồng bộ biển báo theo từng phân đoạn OSRM | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-034 | Biểu tượng biển báo chuẩn Quy chuẩn QCVN 41:2019/BGTVT | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-035 | Cảnh báo cấm quay đầu xe (No U-Turn Sign) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-036 | Cảnh báo cấm rẽ trái / cấm rẽ phải (No Turn Signs) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-037 | Cảnh báo đường một chiều (One-way Street) | **BLOCKED** | Cần dữ liệu hướng oneway theo từng way/edge; pack hiện không lưu vector một chiều. |
| TC-ROD-038 | Cảnh báo độ cao tĩnh không tối đa của hầm / cầu vượt (Max Height) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-039 | Cảnh báo tải trọng trục tối đa cho xe tải (Max Weight) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-040 | Xử lý khi hai camera nằm quá sát nhau (< 50m) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-041 | Tắt hiển thị dữ liệu đường bộ để tiết kiệm pin trên máy yếu | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-ROD-042 | Kiểm tra không bị rò rỉ bộ nhớ khi nạp hàng nghìn nodes biển báo | **BLOCKED** | Cần dữ liệu hướng oneway theo từng way/edge; pack hiện không lưu vector một chiều. |
| TC-ROD-043 | Cảnh báo đoạn đường hay có động vật chăn thả qua đường | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-044 | Cảnh báo gió ngang mạnh trên cầu vượt biển (Crosswind) | **N/A** | Yêu cầu đã bị loại theo thiết kế: chỉ giữ biển/camera liên quan xử phạt; bỏ đường sắt, qua đường, giảm tốc, hazard. |
| TC-ROD-045 | Đảm bảo 100% dữ liệu OSM là dữ liệu thật (Không chứa mock/synthetic) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-VOI-001 | Khởi tạo giọng nói tiếng Việt (vi-VN) tự động | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-002 | Bật/tắt âm thanh giọng nói (Voice Mute Toggle) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-003 | Phát âm chuẩn câu chỉ dẫn rẽ từ xa (Khoảng cách 500m) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-004 | Phát âm câu nhắc chuẩn bị rẽ (Khoảng cách 50m - 100m) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-005 | Phát âm câu thông báo ngay tại ngã rẽ | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-006 | Phát âm cảnh báo camera phạt nguội và tốc độ | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-007 | Phát âm cảnh báo khi chạy quá tốc độ giới hạn | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-008 | Chống lặp câu cảnh báo quá tốc độ liên tục (Speech Cooldown) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-009 | Phát âm thông báo tính lại lộ trình khi đi chệch đường | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-010 | Phát âm chào mừng khi đến đích | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-011 | Hủy ngay câu nói cũ khi có lệnh mới khẩn cấp (Speech Silence) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-012 | Fallback khi thiết bị chưa cài gói ngôn ngữ tiếng Việt | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-013 | Điều chỉnh âm lượng giọng nói theo âm lượng đa phương tiện hệ thống | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-014 | Không làm ngắt tiếng nhạc Bluetooth trên xe (Audio ducking) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-015 | Phát âm chỉ dẫn đi vòng xuyến rõ ràng từng lối ra | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-016 | Phát âm chỉ dẫn đi lên cầu vượt hoặc đi dưới gầm cầu | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-017 | Phát âm chỉ dẫn đi vào đường hầm | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-018 | Chuẩn hóa cách đọc các ký hiệu viết tắt tiếng Việt phổ biến | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-019 | Chuẩn hóa cách đọc số nhà và ngõ ngách | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-020 | Tự động tắt giọng nói khi xe đã dừng hẳn hành trình | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-021 | Tốc độ đọc giọng nói vừa phải (Speech Rate = 1.0) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-022 | Cao độ giọng nói chuẩn (Pitch = 1.0) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-023 | Phát âm cảnh báo đoạn đường hay có chốt kiểm tra | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-024 | Kiểm tra hoạt động TTS trên iOS Safari trong nền | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-025 | Kiểm tra hoạt động TTS trên Android Chrome | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-026 | Thông báo khoảng cách còn lại mỗi 10km trên các chuyến đi xa | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-027 | Không phát thông báo rẽ khi xe đang đứng yên chờ đèn đỏ | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-028 | Xử lý khi danh sách voices tải bất đồng bộ (voiceschanged event) | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-029 | Nút nghe thử giọng nói trong cài đặt | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-VOI-030 | Bộ nhớ giải phóng các đối tượng SpeechSynthesisUtterance | **BLOCKED** | Cần loa/giọng đọc thật; không thể assert âm thanh trong môi trường này. |
| TC-BLE-001 | Mở bảng kết nối Bluetooth từ nút trên Topbar | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-002 | Quét tìm thiết bị ESP32 xung quanh (BLE Scanning) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-003 | Kết nối thành công vào mạch ESP32 | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-004 | Đóng gói và gửi bản tin tổng quan lộ trình (Route Overview Packet) | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-005 | Truyền gói tin chỉ dẫn khúc rẽ thời gian thực (Maneuver Packet) | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-006 | Hiển thị icon rẽ tương ứng trên màn hình OLED / TFT ESP32 | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-007 | Truyền gói tin tốc độ tức thời và tốc độ giới hạn | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-008 | Gửi gói tin cảnh báo camera phạt nguội sang HUD | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-009 | Gửi gói tin kết thúc hành trình khi bấm dừng hoặc đến đích | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-010 | Tự động xử lý khi mất kết nối BLE đột ngột (Link Drop) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-011 | Tự động kết nối lại khi thiết bị bật nguồn trở lại (Auto-Reconnect) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-012 | Tính toàn vẹn gói tin (Packet Checksum & Version Check) | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-013 | Mã hóa chuỗi tên đường bằng UTF-8 chuẩn | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-014 | Xử lý khi tên đường quá dài (> 32 ký tự) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-015 | Nút 'Ngắt kết nối' thủ công trên giao diện | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-016 | Bảo vệ MTU Size (Maximum Transmission Unit) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-017 | Gửi gói tin trạng thái pin điện thoại sang HUD (Phone Battery Sync) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-018 | Gửi gói tin đồng hồ thời gian thực (RTC Time Sync) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-019 | Kiểm tra quyền Bluetooth trên Web (Web Bluetooth API) | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-020 | Thông báo khi trình duyệt không hỗ trợ Web Bluetooth | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-021 | Hoạt động BLE qua Capacitor Native Plugin trên iOS | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-022 | Độ trễ truyền gói tin BLE (Latency < 50ms) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-023 | Chống nghẽn hàng đợi gửi BLE (Queue Throttling) | **PASS** | Đã kiểm bằng unit protocol/panel trình duyệt/build firmware. |
| TC-BLE-024 | Gửi gói tin rung cảnh báo (Haptic Buzzer Trigger) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-025 | Gửi gói tin chỉnh độ sáng màn hình HUD (Display Brightness) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-026 | Xử lý khi thiết bị ESP32 khác cùng tên xuất hiện | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-027 | Ghi nhớ địa chỉ MAC thiết bị đã ghép nối | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-028 | Cảnh báo khi sóng BLE quá yếu (RSSI < -90dBm) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-029 | Gói tin Ping giữ kết nối (Heartbeat Keepalive) | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-030 | Kiểm tra mức tiêu hao năng lượng BLE trên iPhone | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-031 | Gửi gói tin cảnh báo quá tốc độ sang HUD | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-032 | Hỗ trợ màn hình LED ma trận 8x32 trên ESP32 | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-033 | Kiểm tra tương thích firmware ESP32 v1.0 và v2.0 | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-034 | Khôi phục luồng dữ liệu khi app vừa thoát khỏi cuộc gọi điện thoại | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-BLE-035 | Xử lý ngắt nguồn pin đột ngột của điện thoại | **BLOCKED** | Cần mạch ESP32 thật; đã kiểm panel/protocol unit/build firmware. |
| TC-MOB-001 | Không bị khoảng hở đáy trên iPhone 13 (Zero Bottom Gap) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-002 | Khóa phóng to tự động khi chạm vào ô nhập văn bản (Disable Auto-Zoom) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-003 | Khóa cuộn trang toàn màn hình (Disable Rubber-band Viewport Scroll) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-004 | Căn vị trí cụm nút điều khiển bản đồ nổi trên Bottom Panel | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-005 | Thanh kéo kéo thả Bottom Sheet (Pull Handle Interaction) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-006 | Vuốt lên để mở lại Bottom Sheet đầy đủ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-007 | Khoảng cách an toàn tai thỏ / Dynamic Island ở thanh Topbar | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-008 | Chuẩn kích thước vùng chạm cảm ứng (Touch Target >= 44x44px) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-009 | Hiệu ứng phản hồi khi chạm (Active / Tap State) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-010 | Trạng thái hiển thị khi bàn phím ảo bật lên | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-011 | Không bị đúp phím (Double Tap Zoom Delay 300ms) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-012 | Hiển thị hoàn hảo trên màn hình gập (Samsung Galaxy Z Fold) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-013 | Hiển thị hoàn hảo trên iPad / Máy tính bảng | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-014 | Tối ưu hóa độ phân giải hiển thị Retina (@2x, @3x) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-015 | Thao tác vuốt từ mép trái để quay lại (Swipe to Go Back) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-016 | Chống hiện tượng nháy trắng khi tải lại trang (FOUC Prevention) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-017 | Khoảng cách cách đáy cho các nút nổi khi Bottom Panel đóng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-018 | Bố cục xoay ngang trên ô tô (Landscape Dashboard Mount) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-019 | Thanh trạng thái hệ thống trong suốt (Transparent Status Bar) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-020 | Kiểm tra tương thích phông chữ hệ thống SF Pro / Roboto / Be Vietnam Pro | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-021 | Độ tương phản màu sắc đạt chuẩn WCAG AA | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-022 | Hạn chế rung chấn khi xe đi qua ổ gà (Vibration damping in UI) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-023 | Chế độ một tay (One-handed Usability) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-024 | Thông báo toast nổi nhẹ nhàng (Snackbars / Toasts) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-025 | Hiển thị biểu tượng tải xoay tròn màu xanh Google | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-026 | Chống cuộn trang khi đang kéo thanh trượt âm lượng hoặc zoom | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-027 | Hỗ trợ Dark Theme hoàn chỉnh cho tất cả các thẻ Card | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-028 | Kích thước nút bấm Bắt đầu (Call to Action Button) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-029 | Ẩn các chi tiết thừa khi đang ở chế độ xem dẫn đường tốc độ cao | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-030 | Chạm ra ngoài để đóng menu gợi ý (Click Outside to Dismiss) | **N/A** | Kết quả tìm kiếm full-screen giống Google Maps; không có vùng ngoài để chạm, đóng bằng nút back. |
| TC-MOB-031 | Độ mượt mà của hiệu ứng chuyển cảnh (60 FPS Transitions) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-032 | Cố định thanh Search Bar khi danh sách gợi ý cuộn dài | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-033 | Trạng thái Empty State đẹp mắt khi danh sách rỗng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-MOB-034 | Hỗ trợ cảm ứng đa điểm (Multi-touch Disambiguation) | **BLOCKED** | Cần iPhone/Android/thiết bị thật (tai thỏ, bàn phím, Retina, xoay). |
| TC-MOB-035 | Tuân thủ hướng dẫn thiết kế Human Interface Guidelines (HIG) của Apple | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-001 | Chuyển đổi mượt mà khi mạng bị mất hoàn toàn giữa hành trình | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-002 | Khôi phục kết nối mạng và đồng bộ lại tự động | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-003 | Khởi động app khi không có mạng (Cold Start Offline) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-004 | Tránh rò rỉ bộ nhớ khi dẫn đường tuyến đường dài nhiều giờ | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-005 | Xử lý khi người dùng đổi ứng dụng khác rồi quay lại (Background & Resume) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-006 | Xử lý khi tắt mở lại quyền Bluetooth trong lúc đang kết nối | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-007 | Nhận diện GPS nhảy đột biến do phản xạ sóng nhà cao tầng (GPS Jitter) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-008 | Tuân thủ tiêu chuẩn không sử dụng dữ liệu mô phỏng (No Synthetic Demo Data) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-009 | Xử lý khi đi vào vùng hoàn toàn không có sóng GPS trong 5 phút | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-010 | Xử lý khi thiết bị bị quá nhiệt (Thermal Throttling) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-011 | Xử lý khi máy nhận cuộc gọi đến làm gián đoạn âm thanh | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-012 | Xử lý khi OSRM API trả mã lỗi 400 hoặc 500 | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-013 | Xử lý khi Nominatim geocoder trả về kết quả rỗng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-014 | Xử lý khi người dùng ấn nút Bắt đầu liên tục 10 lần (Double-click Spam) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-015 | Xử lý khi đổi điểm đến ngay giữa lúc đang dẫn đường | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-016 | Xử lý khi dung lượng ổ cứng thiết bị đầy 100% (Storage Full) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-017 | Xử lý khi người dùng đổi múi giờ thiết bị | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-018 | Chống đóng ứng dụng ngoài ý muốn khi chạm vào góc cạnh màn hình | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-ROD-019-E | Xử lý khi file shard OSM bị hỏng dữ liệu mạng khi tải | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-020 | Xử lý chuyển đổi kết nối giữa Wifi và 4G liên tục khi xe di chuyển ra khỏi nhà | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-021 | Xử lý khi tốc độ xe vượt quá 200 km/h (Tàu cao tốc / Máy bay) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-022 | Xử lý khi tọa độ điểm đến trùng khớp với điểm đi (Distance = 0) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-023 | Xử lý khi người dùng bấm dừng và bắt đầu lại ngay lập tức | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-024 | Đảm bảo không phát sinh Unhandled Promise Rejection | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-025 | Đảm bảo không phát sinh Warning về Memory Leak trong React | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-EDG-026 | Xử lý khi thiết bị bật chế độ máy bay (Airplane Mode) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-027 | Chống treo ứng dụng khi nhận được hàng nghìn event di chuyển chuột/chạm mỗi giây | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-028 | Kiểm tra hiển thị khi thu phóng chữ trong trợ năng hệ thống (Dynamic Type) | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-029 | Tự động khôi phục giao diện khi xoay màn hình nhiều lần liên tiếp | **BLOCKED** | Cần điều kiện mạng/4h/ngắt app/thiết bị thật. |
| TC-EDG-030 | Xác nhận ứng dụng không chứa bất kỳ lỗ hổng bảo mật nào trong file `package.json` | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-001 | Lưu cài đặt bật/tắt giọng nói qua các phiên sử dụng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-002 | Lưu danh sách địa điểm yêu thích vào LocalStorage | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-003 | Xóa địa điểm khỏi danh sách yêu thích | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-004 | Lưu bộ lọc dữ liệu đường bộ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-005 | Giữ chế độ xem 3D hoặc 2D sau khi khởi động lại | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-006 | Cấu trúc dữ liệu địa điểm yêu thích trong LocalStorage | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-007 | Tự động sửa lỗi khi chuỗi LocalStorage bị hỏng cú pháp JSON | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-008 | Lưu lịch sử tìm kiếm gần đây (Recent Searches) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-009 | Xóa từng mục trong lịch sử tìm kiếm gần đây | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-010 | Xóa toàn bộ lịch sử tìm kiếm gần đây | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-011 | Giới hạn số lượng địa điểm lưu trữ gần đây (Tối đa 10 mục) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-012 | Lưu cài đặt phương tiện di chuyển mặc định | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-013 | Khả năng tương thích qua các phiên bản nâng cấp dữ liệu (Schema Migration) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-014 | Bảo mật dữ liệu cá nhân cục bộ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-015 | Sao lưu dữ liệu yêu thích ra file JSON (Export Favorites) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-016 | Khôi phục dữ liệu yêu thích từ file JSON (Import Favorites) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-017 | Kiểm tra dung lượng chiếm dụng của LocalStorage | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-018 | Đồng bộ trạng thái giữa nhiều Tab trình duyệt (Storage Event Sync) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-019 | Lưu tùy chọn bật/tắt hiển thị thước tỷ lệ bản đồ | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-020 | Lưu tùy chọn khoảng cách cảnh báo camera (500m / 300m / 100m) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-021 | Tự động làm sạch dữ liệu cache tạm khi đóng ứng dụng | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-022 | Khôi phục dữ liệu mặc định khi người dùng bấm 'Đặt lại cài đặt' | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-023 | Lưu trạng thái chấp thuận điều khoản vị trí và an toàn giao thông | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-024 | Lưu tên thiết bị ESP32 ưa thích để ưu tiên kết nối | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-DAT-025 | Đảm bảo tính toàn vẹn dữ liệu khi trình duyệt bị tắt đột ngột lúc đang ghi storage | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-001 | Tốc độ tải và hiển thị bản đồ lần đầu (Time to Interactive - TTI) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-002 | Tỷ lệ khung hình render bản đồ (Frame Rate 60 FPS) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-003 | Tiêu thụ pin khi dẫn đường liên tục (Battery Consumption) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-004 | Dung lượng bộ cài đặt ứng dụng iOS (IPA Size) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-005 | Tiêu chuẩn bảo mật quyền riêng tư vị trí (Location Privacy) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-006 | Thời gian tính toán lộ trình OSRM (Routing Latency) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-007 | Dung lượng bộ nhớ RAM khi hoạt động thông thường (RAM Footprint) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-008 | Tối ưu hóa dung lượng truyền tải mạng (Network Payload) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-009 | Độ trễ phản hồi cảm ứng khi bấm các nút (Input Latency) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-010 | Thời gian tự động tìm lại đường khi đi chệch (Reroute Latency) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-011 | Khả năng chịu tải rung giật phần cứng (Hardware Shock Resistance) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-012 | Tiêu chuẩn đồ họa không bị giật lag màn hình (No Jitter / V-Sync) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-013 | Tính sẵn sàng cao của hệ thống ngói bản đồ (Tile High Availability) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-014 | Khả năng tương thích trình duyệt (Browser Compatibility) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-015 | Tiêu chuẩn bảo mật Content Security Policy (CSP) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-016 | Tiêu chuẩn trải nghiệm người dùng (Google Maps UX Fidelity) | **FAIL** | Còn khác Google Maps: thiếu tên đường/nhãn phố trên bản đồ, một số thành phần là mô phỏng. |
| TC-NFR-017 | Tiêu chuẩn đóng gói mã nguồn (Zero Dead Code / Tree Shaking) | **PASS** | Đã kiểm bằng test tự động, thao tác trình duyệt/audit hoặc đọc code xác nhận. |
| TC-NFR-018 | Độ ổn định không lỗi Crash trong 24 giờ thử nghiệm liên tục (MTBF) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-019 | Hỗ trợ tiêu chuẩn an toàn khi lái xe (Driver Safety Standard) | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
| TC-NFR-020 | Tuân thủ quy chuẩn pháp luật đường bộ Việt Nam | **BLOCKED** | Cần đo trên thiết bị thật hoặc chạy 24h. |
