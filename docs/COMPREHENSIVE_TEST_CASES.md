# BỘ TEST CASE TOÀN DIỆN HỆ THỐNG ROADLINK (COMPREHENSIVE TEST SPECIFICATION)

> **Dự án:** RoadLink (Hệ thống dẫn đường thông minh độc lập & kết nối HUD ESP32 BLE)  
> **Phiên bản tài liệu:** 2.0.0 (Master Release Specification)  
> **Ngày lập:** 22/11/2026  
> **Mục tiêu:** Bao phủ 100% chức năng, luồng nghiệp vụ (End-to-End), giao diện chuẩn Google Maps, cảm biến la bàn, GPS, dữ liệu giao thông Việt Nam (OSM), giọng nói TTS, giao thức truyền tin BLE và các tiêu chuẩn phi chức năng (P0/P1/P2).  
> **Tổng số Test Cases:** 415 Test Cases chi tiết chia thành 12 phân hệ chuyên sâu.

---

## MỤC LỤC TỔNG QUAN

1. [Phân Nhóm 1: Tìm Kiếm & Khám Phá Địa Điểm (TC-SEA: 35 Cases)](#1-tìm-kiếm--khám-phá-địa-điểm-tc-sea)
2. [Phân Nhóm 2: Lập Lộ Trình & Chọn Phương Tiện (TC-ROU: 40 Cases)](#2-lập-lộ-trình--chọn-phương-tiện-tc-rou)
3. [Phân Nhóm 3: Dẫn Đường Turn-by-Turn Thời Gian Thực (TC-NAV: 45 Cases)](#3-dẫn-đường-turn-by-turn-thời-gian-thực-tc-nav)
4. [Phân Nhóm 4: Định Vị GPS, Độ Chính Xác & La Bàn Cảm Biến (TC-GEO: 35 Cases)](#4-định-vị-gps-độ-chính-xác--la-bàn-cảm-biến-tc-geo)
5. [Phân Nhóm 5: Bản Đồ MapLibre, Camera 3D Cockpit & Cử Chỉ (TC-MAP: 40 Cases)](#5-bản-đồ-maplibre-camera-3d-cockpit--cử-chỉ-tc-map)
6. [Phân Nhóm 6: Dữ Liệu Đường OSM, Giới Hạn Tốc Độ & Camera Phạt Nguội (TC-ROD: 45 Cases)](#6-dữ-liệu-đường-osm-giới-hạn-tốc-độ--camera-phạt-nguội-tc-rod)
7. [Phân Nhóm 7: Giọng Nói Tiếng Việt TTS & Phát Âm Cảnh Báo (TC-VOI: 30 Cases)](#7-giọng-nói-tiếng-việt-tts--phát-âm-cảnh-báo-tc-voi)
8. [Phân Nhóm 8: Kết Nối Phần Cứng HUD ESP32 Qua BLE (TC-BLE: 35 Cases)](#8-kết-nối-phần-cứng-hud-esp32-qua-ble-tc-ble)
9. [Phân Nhóm 9: Giao Diện Mobile, Trải Nghiệm Google Maps & Tối Ưu iPhone 13 (TC-MOB: 35 Cases)](#9-giao-diện-mobile-trải-nghiệm-google-maps--tối-ưu-iphone-13-tc-mob)
10. [Phân Nhóm 10: Xử Lý Ngoại Lệ, Mất Mạng & Dữ Liệu Offline (TC-EDG: 30 Cases)](#10-xử-lý-ngoại-lệ-mất-mạng--dữ-liệu-offline-tc-edg)
11. [Phân Nhóm 11: Lưu Trữ Cục Bộ & Quản Lý Địa Điểm Yêu Thích (TC-DAT: 25 Cases)](#11-lưu-trữ-cục-bộ--quản-lý-địa-điểm-yêu-thích-tc-dat)
12. [Phân Nhóm 12: Hiệu Năng, Tiêu Thụ Pin & Tiêu Chuẩn Phi Chức Năng (TC-NFR: 20 Cases)](#12-hiệu-năng-tiêu-thụ-pin--tiêu-chuẩn-phi-chức-năng-tc-nfr)

---

## 1. TÌM KIẾM & KHÁM PHÁ ĐỊA ĐIỂM (TC-SEA: 35 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SEA-001** | Tìm kiếm theo tên địa danh tiếng Việt có dấu | Thiết bị có internet | 1. Chạm vào ô tìm kiếm.<br>2. Nhập 'Chợ Bến Thành'.<br>3. Bấm icon tìm kiếm hoặc Enter. | Hiển thị danh sách kết quả chứa 'Chợ Bến Thành', Quận 1, TP.HCM với địa chỉ chi tiết. | P0 |
| **TC-SEA-002** | Tìm kiếm theo tên địa danh tiếng Việt không dấu | Thiết bị có internet | 1. Nhập 'Ho Hoan Kiem'.<br>2. Submit tìm kiếm. | Nominatim geocoder tự động chuẩn hóa và trả về kết quả Hồ Hoàn Kiếm, Hà Nội. | P0 |
| **TC-SEA-003** | Tìm kiếm bằng tọa độ địa lý trực tiếp (Lat, Lng) | Bản đồ đang mở | 1. Nhập '10.7721, 106.6983'.<br>2. Bấm tìm kiếm. | Hiển thị ngay mục kết quả 'Tọa độ đã nhập' với giá trị kinh/vĩ độ tương ứng, không gọi API geocoder. | P0 |
| **TC-SEA-004** | Tìm kiếm tọa độ có khoảng trắng bất thường | Bản đồ đang mở | 1. Nhập '  10.7721 ,  106.6983  '.<br>2. Bấm tìm kiếm. | Parser xử lý regex chuẩn, loại bỏ khoảng trắng dư thừa và nhận diện đúng tọa độ. | P1 |
| **TC-SEA-005** | Tìm kiếm tọa độ định dạng số âm (Nam bán cầu / Tây bán cầu) | Bản đồ đang mở | 1. Nhập '-33.8688, 151.2093'.<br>2. Bấm tìm kiếm. | Nhận diện tọa độ Sydney, hiển thị đúng vị trí hợp lệ. | P1 |
| **TC-SEA-006** | Nhập tọa độ ngoài phạm vi hợp lệ (Vĩ độ > 90 hoặc Kinh độ > 180) | Bản đồ đang mở | 1. Nhập '95.123, 200.456'.<br>2. Bấm tìm kiếm. | Không coi là tọa độ hợp lệ, chuyển sang tìm kiếm văn bản thông thường hoặc báo lỗi. | P1 |
| **TC-SEA-007** | Tìm kiếm chuỗi ngắn (< 2 ký tự) | Màn hình chính | 1. Nhập 1 ký tự 'A'. | Nút submit tìm kiếm bị disabled; không gửi request vô ích lên server. | P1 |
| **TC-SEA-008** | Cơ chế Debounce khi nhập liệu liên tục | Network tab mở | 1. Gõ liên tục cụm từ 'Nhà hát lớn Hà Nội'. | Chỉ phát sinh request tìm kiếm sau khi ngừng gõ 350ms, tránh spam request làm nghẽn mạng. | P0 |
| **TC-SEA-009** | Nút xóa nhanh nội dung tìm kiếm (Clear 'X') | Đã nhập văn bản | 1. Nhập văn bản bất kỳ.<br>2. Bấm vào nút 'X' trong thanh tìm kiếm. | Ô input được xóa trống ngay lập tức, focus vẫn giữ tại ô input, bàn phím không bị ẩn. | P0 |
| **TC-SEA-010** | Nút quay lại (Back arrow '←') khi đang mở kết quả tìm kiếm | Popup tìm kiếm mở | 1. Bấm vào nút mũi tên '←' bên trái thanh tìm kiếm. | Đóng popup tìm kiếm, quay về trạng thái hiển thị bản đồ tổng quan (Explore mode). | P0 |
| **TC-SEA-011** | Chọn nhanh danh mục '🍽️ Nhà hàng' | Màn hình chính | 1. Bấm vào chip '🍽️ Nhà hàng' dưới thanh tìm kiếm. | Tự động điền 'Nhà hàng' vào ô tìm kiếm và kích hoạt tìm các quán ăn lân cận vị trí hiện tại. | P1 |
| **TC-SEA-012** | Chọn nhanh danh mục '⛽ Cây xăng' | Màn hình chính | 1. Bấm chip '⛽ Cây xăng'. | Tìm kiếm các trạm xăng trong bán kính khu vực hiện tại, hiển thị kết quả gần nhất. | P0 |
| **TC-SEA-013** | Chọn nhanh danh mục '☕ Cà phê' | Màn hình chính | 1. Bấm chip '☕ Cà phê'. | Tìm kiếm danh sách quán cà phê gần nhất. | P1 |
| **TC-SEA-014** | Chọn nhanh danh mục '🏨 Khách sạn' | Màn hình chính | 1. Bấm chip '🏨 Khách sạn'. | Hiển thị các khách sạn, nhà nghỉ xung quanh. | P1 |
| **TC-SEA-015** | Chọn nhanh danh mục '🏧 ATM' | Màn hình chính | 1. Bấm chip '🏧 ATM'. | Hiển thị các cây ATM, điểm rút tiền ngân hàng lân cận. | P1 |
| **TC-SEA-016** | Chọn nhanh danh mục '🛒 Tạp hóa' | Màn hình chính | 1. Bấm chip '🛒 Tạp hóa'. | Hiển thị các cửa hàng tiện lợi, siêu thị mini xung quanh. | P1 |
| **TC-SEA-017** | Vuốt ngang danh sách Category Chips trên Mobile | Thiết bị iPhone 13 | 1. Dùng ngón tay vuốt ngang thanh chứa các chip danh mục. | Thanh trượt mượt mà (momentum scrolling), không bị khựng giật, không làm dịch chuyển bản đồ ngầm. | P1 |
| **TC-SEA-018** | Lựa chọn hành động nhanh 'Vị trí của bạn' | Menu tìm kiếm mở | 1. Chạm vào mục 'Vị trí của bạn'. | Bản đồ tự động căn giữa vị trí GPS hiện tại của người dùng, đóng menu tìm kiếm. | P0 |
| **TC-SEA-019** | Lựa chọn hành động nhanh 'Chọn trên bản đồ' | Menu tìm kiếm mở | 1. Chạm vào 'Chọn trên bản đồ'. | Menu gợi ý đóng lại, giao diện chuyển sang chế độ sẵn sàng nhận cú chạm điểm trên bản đồ. | P0 |
| **TC-SEA-020** | Chạm một điểm bất kỳ trên bản đồ (Pin location) | Bản đồ đang mở | 1. Chạm vào một vị trí ngẫu nhiên trên mặt đường. | Xuất hiện ghim đỏ tại vị trí chạm, thẻ địa điểm (PlaceCard) hiển thị tọa độ và nút 'Chỉ đường'. | P0 |
| **TC-SEA-021** | Chạm vào ghim địa điểm đã có trên bản đồ | Bản đồ có ghim | 1. Chạm vào ghim điểm đến đã cắm. | Mở thẻ thông tin chi tiết địa điểm (PlaceCard) với các tùy chọn tương tác. | P1 |
| **TC-SEA-022** | Hiển thị trạng thái đang tìm kiếm (Loading spinner) | Mạng 3G chậm | 1. Nhập từ khóa và bấm tìm. | Nút submit chuyển thành biểu tượng vòng xoay (spinner), có thông báo 'Đang tìm địa điểm…'. | P1 |
| **TC-SEA-023** | Xử lý khi không tìm thấy địa điểm nào | Thiết bị có internet | 1. Nhập từ khóa vô nghĩa 'asdfghjklqwerty12345'.<br>2. Bấm tìm kiếm. | Hiển thị thông báo thân thiện: 'Chưa tìm thấy địa điểm. Thử thêm tên thành phố hoặc địa chỉ.' | P1 |
| **TC-SEA-024** | Xử lý lỗi mất kết nối mạng khi tìm kiếm | Bật Airplane Mode | 1. Nhập từ khóa.<br>2. Bấm tìm kiếm. | Báo lỗi mạng rõ ràng: 'Không thể kết nối đến máy chủ tìm kiếm. Vui lòng kiểm tra mạng.' | P0 |
| **TC-SEA-025** | Hủy request tìm kiếm cũ khi có request mới (AbortController) | Mạng chập chờn | 1. Nhập từ khóa A rồi nhanh chóng sửa thành từ khóa B. | Request tìm từ khóa A bị hủy bỏ (aborted), chỉ hiển thị kết quả từ khóa B, không bị race condition. | P1 |
| **TC-SEA-026** | Hiển thị danh sách địa điểm đã lưu trong menu tìm kiếm | Có địa điểm đã lưu | 1. Bấm vào ô tìm kiếm khi chưa gõ chữ gì. | Hiển thị danh sách các địa điểm trong mục Yêu thích bên dưới các hành động nhanh. | P1 |
| **TC-SEA-027** | Chọn một địa điểm từ danh sách kết quả tìm kiếm | Danh sách kết quả mở | 1. Chạm vào kết quả đầu tiên. | Menu tìm kiếm đóng, camera bản đồ bay mượt mà (flyTo) đến vị trí địa điểm đó, mở thẻ PlaceCard. | P0 |
| **TC-SEA-028** | Nút 'Lưu' trên thẻ địa điểm (Bookmark place) | Thẻ địa điểm mở | 1. Bấm vào nút 'Lưu' (icon trái tim). | Trái tim chuyển sang màu đỏ, text đổi thành 'Đã lưu', địa điểm được ghi vào LocalStorage. | P0 |
| **TC-SEA-029** | Nút 'Bỏ lưu' địa điểm | Địa điểm đang lưu | 1. Bấm lại vào nút 'Đã lưu'. | Icon trái tim trở về dạng viền, địa điểm được xóa khỏi danh sách yêu thích. | P1 |
| **TC-SEA-030** | Nút 'Chia sẻ' địa điểm qua Web Share API | Trình duyệt hỗ trợ | 1. Bấm nút 'Chia sẻ'. | Mở bảng share native của iOS/Android với nội dung tên địa điểm và đường link tọa độ. | P1 |
| **TC-SEA-031** | Fallback khi trình duyệt không hỗ trợ Web Share API | Trình duyệt Desktop cũ | 1. Bấm nút 'Chia sẻ'. | Tự động copy tọa độ và tên địa điểm vào Clipboard, hiển thị toast 'Đã sao chép địa điểm'. | P1 |
| **TC-SEA-032** | Đóng thẻ PlaceCard khi chạm nút đóng 'X' | Thẻ địa điểm mở | 1. Bấm nút 'X' ở góc phải thẻ PlaceCard. | Thẻ đóng lại, xóa ghim tạm trên bản đồ, quay về Explore mode. | P1 |
| **TC-SEA-033** | Nhập ký tự đặc biệt nguy hiểm trong ô tìm kiếm (XSS Prevention) | Màn hình chính | 1. Nhập `<script>alert('xss')</script> & <img src=x onerror=...>`.<br>2. Bấm tìm kiếm. | Chuỗi được escape an toàn, không thực thi script, tìm kiếm an toàn. | P0 |
| **TC-SEA-034** | Tìm kiếm địa chỉ tiếng Anh / Quốc tế | Có internet | 1. Nhập 'Times Square, New York'.<br>2. Bấm tìm kiếm. | Trả về kết quả quốc tế chính xác với đầy đủ quốc gia và bang. | P2 |
| **TC-SEA-035** | Xử lý phân trang kết quả tìm kiếm khi có nhiều kết quả | Có internet | 1. Nhập 'Nguyễn Huệ'.<br>2. Quan sát danh sách kết quả. | Hiển thị tối đa 5-8 kết quả phù hợp nhất kèm cự ly ước tính từ vị trí người dùng. | P1 |

---

## 2. LẬP LỘ TRÌNH & CHỌN PHƯƠNG TIỆN (TC-ROU: 40 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ROU-001** | Bấm 'Chỉ đường' từ thẻ địa điểm | Đang xem PlaceCard | 1. Bấm nút 'Chỉ đường' (màu xanh Google Blue). | Giao diện chuyển sang màn hình lập lộ trình (Preview mode), xuất hiện thanh RouteInputs ở trên đỉnh. | P0 |
| **TC-ROU-002** | Mặc định điểm đi là 'Vị trí của bạn' | GPS đang hoạt động | 1. Vào màn hình chỉ đường. | Hàng Điểm đi hiển thị 'Vị trí của bạn' với icon vòng tròn xanh. Hàng Điểm đến là nơi vừa chọn. | P0 |
| **TC-ROU-003** | Thanh kết nối 3 chấm dọc giữa 2 ô nhập | RouteInputs mở | 1. Quan sát khu vực giữa điểm đi và điểm đến. | Hiển thị 3 chấm tròn nhỏ dọc đúng chuẩn giao diện Google Maps nối từ origin đến destination. | P2 |
| **TC-ROU-004** | Đổi chiều điểm đi và điểm đến (Swap Endpoints) | Tuyến đường đã có | 1. Bấm vào nút đảo chiều '⇅' bên phải thanh nhập lộ trình. | Điểm đi chuyển thành điểm đến và ngược lại, hệ thống tự động tính toán lại lộ trình chiều về. | P0 |
| **TC-ROU-005** | Chỉnh sửa điểm đi thủ công (Custom Origin) | RouteInputs mở | 1. Chạm vào hàng 'Vị trí của bạn'.<br>2. Ô nhập chuyển sang input văn bản có nhãn 'Tìm điểm đi'.<br>3. Nhập địa chỉ mới. | Menu gợi ý mở bên dưới, chọn địa điểm mới. Lộ trình được vẽ lại từ điểm xuất phát mới này. | P0 |
| **TC-ROU-006** | Đặt lại điểm đi về vị trí GPS thực | Đang chọn điểm đi tùy chọn | 1. Bấm nút 'X' cạnh điểm đi tùy chọn hoặc chọn 'Vị trí của bạn' trong menu. | Điểm đi được gán lại bằng tọa độ GPS hiện tại của điện thoại. | P0 |
| **TC-ROU-007** | Chỉnh sửa điểm đến trực tiếp trên RouteInputs | RouteInputs mở | 1. Chạm vào hàng Điểm đến.<br>2. Nhập tên địa chỉ mới và chọn từ danh sách. | Điểm đến được cập nhật, camera bản đồ zoom vừa vặn toàn bộ tuyến đường mới. | P0 |
| **TC-ROU-008** | Lập tuyến thành công với OSRM (1 tuyến chính + tuyến phụ) | Có kết nối mạng | 1. Chọn điểm đi & điểm đến cách nhau 5km. | Hiển thị tuyến đường chính màu xanh đậm `#1a73e8`, các tuyến phụ (nếu có) màu xám `#9da8b7`. | P0 |
| **TC-ROU-009** | Chọn tuyến thay thế (Alternative Route Selection) | Có > 1 tuyến | 1. Chạm vào dòng tuyến phụ trong danh sách hoặc chạm trực tiếp lên nét vẽ xám trên bản đồ. | Tuyến phụ được chọn chuyển sang màu xanh đậm, tuyến chính cũ chuyển xám, thời gian ETA cập nhật. | P0 |
| **TC-ROU-010** | Hiển thị nhãn 'Tuyến đề xuất' (Best route tag) | Đã có tuyến | 1. Xem danh sách các tuyến đường đề xuất. | Tuyến nhanh nhất luôn có huy hiệu 'Tuyến đề xuất' màu xanh lá hoặc nền nhạt nổi bật. | P1 |
| **TC-ROU-011** | Chuyển chế độ phương tiện: Ô tô (Car mode) | RoutePlanner mở | 1. Bấm tab '🚗 Ô tô'. | Tab sáng đèn, hiển thị thời gian dự kiến (ETA) chuẩn theo tốc độ xe hơi, né các đường cấm ô tô. | P0 |
| **TC-ROU-012** | Chuyển chế độ phương tiện: Xe máy (Motorbike mode) | RoutePlanner mở | 1. Bấm tab '🛵 Xe máy'. | Tab sáng đèn, thời gian tính toán lại phù hợp với xe máy tại đô thị Việt Nam (đi được ngõ nhỏ xe hơi cấm). | P0 |
| **TC-ROU-013** | Chuyển chế độ phương tiện: Đi bộ (Walking mode) | RoutePlanner mở | 1. Bấm tab '🚶 Đi bộ'. | Tab sáng đèn, tốc độ tính theo vận tốc đi bộ (~4-5 km/h), đi qua công viên, phố đi bộ, vạch sang đường. | P0 |
| **TC-ROU-014** | Hiển thị khoảng cách và thời gian chi tiết | Tuyến đã tính | 1. Xem thẻ tóm tắt tuyến. | Hiển thị rõ ràng dạng: '25 phút (12,4 km)' với màu xanh lá đặc trưng Google Maps. | P0 |
| **TC-ROU-015** | Mở danh sách các chặng rẽ ('Các chặng' / 'Xem trước các chặng') | Tuyến đã tính | 1. Bấm nút 'Các chặng' (hoặc 'Xem trước các chặng'). | Bảng mở rộng hiển thị từng bước đi: 'Rẽ trái vào đường Lê Lợi', kèm icon mũi tên và khoảng cách từng chặng. | P0 |
| **TC-ROU-016** | Thu gọn danh sách các chặng | Danh sách đang mở | 1. Bấm nút 'Thu gọn'. | Bảng danh sách cuộn lại, trả về giao diện xem tổng quan ban đầu. | P1 |
| **TC-ROU-017** | Cảnh báo khi dùng điểm đi tùy chọn thay vì GPS | Điểm đi là custom | 1. Quan sát thông báo trên thẻ. | Xuất hiện dòng thông báo: 'Điểm đi tùy chọn. Chọn Vị trí của bạn để dẫn đường bằng GPS thật.' | P1 |
| **TC-ROU-018** | Trạng thái đang chờ GPS chính xác trước khi bấm bắt đầu | GPS chưa có fix | 1. Đang đứng trong hầm hoặc chưa bật vị trí. | Nút 'Bắt đầu' hiển thị 'Đang chờ GPS…' và bị vô hiệu hóa để tránh dẫn đường sai lệch. | P0 |
| **TC-ROU-019** | Nút xem dữ liệu đường bộ nâng cao | RoutePlanner mở | 1. Bấm nút 'Giới hạn tốc độ, biển báo & camera'. | Mở bảng điều khiển RoadDataPanel hiển thị toàn bộ camera, đèn tín hiệu và biển báo trên tuyến. | P0 |
| **TC-ROU-020** | Xử lý lỗi không tìm được đường (Route Not Found) | Điểm đến giữa đảo/rừng | 1. Chọn điểm đến ở nơi không có mạng lưới đường bộ nối liền. | Hiển thị thông báo lỗi thân thiện: 'Không tìm thấy đường đi giữa hai điểm này.' kèm nút 'Thử lại'. | P1 |
| **TC-ROU-021** | Tính toán tuyến đường siêu ngắn (< 100m) | Có mạng | 1. Chọn 2 điểm cách nhau 50m trên cùng một phố. | Tính toán thành công, hiển thị ETA 1 phút, 1 bước rẽ hoặc đi thẳng. | P1 |
| **TC-ROU-022** | Tính toán tuyến đường siêu dài (> 500km) | Có mạng | 1. Chọn tuyến từ Hà Nội đi Đà Nẵng (~750km). | Tải toàn bộ polyline mượt mà, tính toán ETA chuẩn xác theo cao tốc và quốc lộ 1A. | P0 |
| **TC-ROU-023** | Xử lý OSRM server phản hồi chậm hoặc timeout (> 10s) | Mạng lag | 1. Mock OSRM timeout 10 giây. | Hiển thị thông báo: 'Không thể tính toán tuyến đường do máy chủ phản hồi chậm. Vui lòng thử lại.' | P1 |
| **TC-ROU-024** | Chạm vào từng bước rẽ trong danh sách chặng để xem vị trí | Danh sách chặng mở | 1. Chạm vào bước rẽ số 3. | Camera bản đồ bay đến tâm của ngã rẽ số 3 để người dùng xem trước hình dạng khúc rẽ. | P1 |
| **TC-ROU-025** | Kiểm tra icon chỉ hướng chuẩn Google Maps trong danh sách chặng | Danh sách chặng mở | 1. Quan sát các icon mũi tên. | Các icon rẽ trái, rẽ phải, đi thẳng, bùng binh hiển thị sắc nét bằng SVG vector. | P2 |
| **TC-ROU-026** | Đóng màn hình chỉ đường bằng nút '←' | Đang ở Preview mode | 1. Bấm nút mũi tên '←' trên thanh Topbar. | Hủy tuyến đường đang xem, xóa nét vẽ trên bản đồ, quay về Explore mode. | P0 |
| **TC-ROU-027** | Nhấn phím Back vật lý trên Android khi ở màn hình lập lộ trình | Thiết bị Android | 1. Nhấn nút Back của máy. | Quay lại màn hình Explore bản đồ, không thoát ứng dụng đột ngột. | P0 |
| **TC-ROU-028** | Trạng thái tải lộ trình (Calculating spinner) | Bấm chỉ đường | 1. Quan sát nút và panel trong 0.5s đầu. | Thẻ hiển thị trạng thái loading mượt mà trước khi dữ liệu OSRM render xong. | P1 |
| **TC-ROU-029** | Tránh gọi lại OSRM trùng lặp khi không đổi tọa độ | Đã có tuyến | 1. Chuyển qua lại các panel không đổi origin/destination. | Dữ liệu tuyến được cache lại, không gửi request OSRM thừa thãi. | P1 |
| **TC-ROU-030** | Cập nhật tuyến tự động khi chuyển đổi phương tiện xe máy sang ô tô | Đang ở màn hình xem tuyến | 1. Bấm từ tab Xe máy sang tab Ô tô. | Lập tức gọi lại profile ô tô để cập nhật lộ trình tránh các ngõ hẹp xe ô tô không vào được. | P0 |
| **TC-ROU-031** | Lập tuyến đường đi qua phà / đường thủy nội địa | Tuyến Cần Thơ - Đồng Tháp | 1. Lập tuyến qua bến phà. | Nhận diện chặng phà và hiển thị bước 'Đi phà' đúng chuẩn OSM ferry. | P2 |
| **TC-ROU-032** | Định dạng thời gian ETA theo giờ và phút | Tuyến > 60 phút | 1. Lập tuyến 125 phút. | Hiển thị '2 giờ 5 phút' thay vì '125 phút' tạo trải nghiệm đọc trực quan. | P1 |
| **TC-ROU-033** | Định dạng khoảng cách theo mét khi dưới 1km | Tuyến ngắn | 1. Lập tuyến 650m. | Hiển thị '650 m' thay vì '0,65 km'. | P1 |
| **TC-ROU-034** | Định dạng khoảng cách theo kilomet khi trên 1km | Tuyến dài | 1. Lập tuyến 14.8km. | Hiển thị '14,8 km' với dấu phẩy phân tách thập phân chuẩn tiếng Việt. | P1 |
| **TC-ROU-035** | Tính toán giờ đến nơi dự kiến (Clock ETA) | Đồng hồ hệ thống 14:00 | 1. Tuyến mất 35 phút. | Hiển thị giờ đến nơi: '14:35'. | P0 |
| **TC-ROU-036** | Cập nhật Clock ETA qua nửa đêm (Chuyển ngày) | Đồng hồ 23:45 | 1. Tuyến mất 30 phút. | Hiển thị giờ đến nơi: '00:15 (ngày mai)'. | P2 |
| **TC-ROU-037** | Kiểm tra giới hạn bộ nhớ khi lưu trữ danh sách chặng rẽ dài | Tuyến 150 bước rẽ | 1. Mở danh sách chặng rẽ. | Render bằng virtual list hoặc tối ưu DOM, cuộn mượt mà 60fps. | P1 |
| **TC-ROU-038** | Thao tác chọn điểm đi trên bản đồ khi sửa route | RouteInputs mở | 1. Chọn 'Chọn trên bản đồ' cho điểm đi.<br>2. Chạm điểm mới trên bản đồ. | Tọa độ chạm được gán làm điểm xuất phát mới ngay tức thì. | P0 |
| **TC-ROU-039** | Thao tác chọn điểm đến trên bản đồ khi sửa route | RouteInputs mở | 1. Chọn 'Chọn trên bản đồ' cho điểm đến.<br>2. Chạm điểm mới trên bản đồ. | Tọa độ chạm được gán làm điểm đến mới, cập nhật vẽ lại tuyến đường. | P0 |
| **TC-ROU-040** | Giữ trạng thái tuyến đường khi khóa màn hình rồi mở lại | Đã có tuyến | 1. Khóa màn hình điện thoại 10 giây.<br>2. Mở khóa máy. | Màn hình chỉ đường và tuyến đường đã tính vẫn giữ nguyên vẹn. | P0 |

---

## 3. DẪN ĐƯỜNG TURN-BY-TURN THỜI GIAN THỰC (TC-NAV: 45 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NAV-001** | Bắt đầu dẫn đường GPS thật (Start Navigation) | GPS có tín hiệu tốt | 1. Bấm nút 'Bắt đầu' (Google Green pill button). | Ứng dụng chuyển sang chế độ dẫn đường: Camera tự động nghiêng 50° (Cockpit 3D), bật bám theo vị trí xe. | P0 |
| **TC-NAV-002** | Giữ màn hình luôn sáng (KeepAwake) | Bắt đầu dẫn đường | 1. Bấm bắt đầu dẫn đường.<br>2. Để điện thoại không chạm trong 2 phút. | Màn hình không bị mờ hay tự động khóa (Sleep) nhờ plugin KeepAwake. | P0 |
| **TC-NAV-003** | Giải phóng KeepAwake khi dừng dẫn đường | Đang dẫn đường | 1. Bấm dừng dẫn đường. | KeepAwake giải phóng, cho phép màn hình tắt theo cài đặt tiết kiệm pin của máy. | P1 |
| **TC-NAV-004** | Hiển thị Banner chỉ dẫn rẽ tiếp theo (Turn Banner) | Đang dẫn đường | 1. Quan sát thanh banner xanh lục ở góc trên màn hình. | Hiển thị icon mũi tên chuẩn theo loại khúc rẽ, khoảng cách đến khúc rẽ và tên đường tiếp theo. | P0 |
| **TC-NAV-005** | Maneuver: Đi thẳng (Straight) | Đang dẫn đường | 1. Tuyến yêu cầu đi thẳng tiếp 2km. | Icon mũi tên đi thẳng chỉ lên trên, banner hiển thị 'Đi thẳng trên [Tên đường]'. | P0 |
| **TC-NAV-006** | Maneuver: Rẽ phải (Turn Right) | Đang dẫn đường | 1. Tuyến yêu cầu rẽ phải góc 90°. | Icon mũi tên rẽ phải vuông góc, text 'Rẽ phải vào [Tên đường]'. | P0 |
| **TC-NAV-007** | Maneuver: Rẽ trái (Turn Left) | Đang dẫn đường | 1. Tuyến yêu cầu rẽ trái góc 90°. | Icon mũi tên rẽ trái vuông góc, text 'Rẽ trái vào [Tên đường]'. | P0 |
| **TC-NAV-008** | Maneuver: Chếch sang phải (Slight Right) | Đang dẫn đường | 1. Ngã ba rẽ nhẹ sang phải. | Icon mũi tên chếch phải 45°, text 'Chếch sang phải vào [Tên đường]'. | P0 |
| **TC-NAV-009** | Maneuver: Chếch sang trái (Slight Left) | Đang dẫn đường | 1. Ngã ba rẽ nhẹ sang trái. | Icon mũi tên chếch trái 45°, text 'Chếch sang trái vào [Tên đường]'. | P0 |
| **TC-NAV-010** | Maneuver: Rẽ ngoặt sang phải (Sharp Right) | Đang dẫn đường | 1. Khúc cua gấp hơn 120° sang phải. | Icon mũi tên ngoặt gấp phải, text 'Rẽ ngoặt sang phải'. | P1 |
| **TC-NAV-011** | Maneuver: Rẽ ngoặt sang trái (Sharp Left) | Đang dẫn đường | 1. Khúc cua gấp hơn 120° sang trái. | Icon mũi tên ngoặt gấp trái, text 'Rẽ ngoặt sang trái'. | P1 |
| **TC-NAV-012** | Maneuver: Quay đầu xe (U-Turn) | Đang dẫn đường | 1. Tuyến yêu cầu quay đầu xe tại điểm mở dải phân cách. | Icon mũi tên u-turn quay đầu 180°, text 'Quay đầu xe trên [Tên đường]'. | P0 |
| **TC-NAV-013** | Maneuver: Bùng binh / Vòng xuyến (Roundabout) | Đang dẫn đường | 1. Tiến vào vòng xuyến, xuất phát ở lối ra thứ 2. | Icon vòng xuyến kèm số lối ra '2', text 'Tại vòng xuyến, đi theo lối ra thứ 2'. | P0 |
| **TC-NAV-014** | Maneuver: Đi theo nhánh / Lối tách (Fork / Off-ramp) | Đang dẫn đường | 1. Đi vào đường dẫn cao tốc. | Icon rẽ nhánh tách làn, text 'Đi theo lối ra/nhánh đường'. | P1 |
| **TC-NAV-015** | Maneuver: Nhập làn (Merge) | Đang dẫn đường | 1. Từ đường nhánh nhập vào cao tốc chính. | Icon hai mũi tên nhập làm một, text 'Nhập vào [Tên cao tốc]'. | P1 |
| **TC-NAV-016** | Maneuver: Đến nơi (Arrive) | Cách đích < 20m | 1. Tiếp cận điểm đến. | Icon cờ đích hoặc điểm ghim đỏ, text 'Bạn sắp đến đích bên phải/trái'. | P0 |
| **TC-NAV-017** | Đếm lùi cự ly rẽ mốc 1km | Cách ngã rẽ 1.2km | 1. Xe di chuyển tiến vào phạm vi 1000m. | Banner hiển thị 'Sau 1 km'. | P1 |
| **TC-NAV-018** | Đếm lùi cự ly rẽ mốc 500m | Xe tiến sát | 1. Xe cách ngã rẽ 500m. | Banner hiển thị 'Sau 500 m', giọng nói nhắc từ xa. | P0 |
| **TC-NAV-019** | Đếm lùi cự ly rẽ mốc 200m | Xe tiến sát | 1. Xe cách ngã rẽ 200m. | Banner hiển thị 'Sau 200 m'. | P0 |
| **TC-NAV-020** | Đếm lùi cự ly rẽ mốc 50m | Xe tiến sát | 1. Xe cách ngã rẽ 50m. | Banner hiển thị 'Sau 50 m', giọng nói nhắc chuẩn bị rẽ. | P0 |
| **TC-NAV-021** | Đếm lùi cự ly rẽ mốc 10m và tại ngã rẽ | Xe tại ngã rẽ | 1. Xe cách ngã rẽ 10m. | Banner hiển thị 'Sau 10 m' -> 'Rẽ ngay'. | P0 |
| **TC-NAV-022** | Tự động chuyển bước rẽ tiếp theo khi vượt qua ngã rẽ | Xe rẽ xong | 1. Xe hoàn thành khúc rẽ và nhập vào đường mới. | Banner rẽ lập tức cập nhật bước tiếp theo, giọng nói phát chỉ dẫn mới. | P0 |
| **TC-NAV-023** | Bảng tóm tắt thông số chuyến đi ở dưới cùng (Nav Summary) | Đang dẫn đường | 1. Quan sát thanh điều khiển đáy. | Hiển thị: Thời gian còn lại, Khoảng cách còn lại, Giờ đến nơi dự kiến, Cụm tốc độ và nút dừng X. | P0 |
| **TC-NAV-024** | Hiển thị đồng hồ tốc độ thời gian thực (Speedometer) | Xe đang chạy | 1. Di chuyển với vận tốc 40 km/h. | Cụm tốc độ hiển thị con số '40' km/h lấy trực tiếp từ GPS thiết bị. | P0 |
| **TC-NAV-025** | Cảnh báo chạy quá tốc độ bằng thị giác (Overspeed Visual Alert) | Đường giới hạn 50 | 1. Xe chạy đạt 55 km/h (> 50 km/h). | Cụm hiển thị tốc độ chuyển sang màu đỏ cảnh báo (nền đỏ/chữ trắng hoặc viền đỏ nhấp nháy). | P0 |
| **TC-NAV-026** | Hết cảnh báo quá tốc độ khi xe giảm về mức cho phép | Xe đang quá tốc độ | 1. Giảm ga về 48 km/h (< 50 km/h). | Cụm tốc độ trở về giao diện bình thường (chữ đen/xám, nền trắng). | P0 |
| **TC-NAV-027** | Thanh tiến trình hành trình (Trip Progress Bar) | Đang dẫn đường | 1. Xe đi được 50% quãng đường. | Thanh tiến trình màu xanh lấp đầy tương ứng 50% chiều rộng màn hình. | P1 |
| **TC-NAV-028** | Tự động phát hiện đi chệch đường (Off-Route Detection) | Đang dẫn đường | 1. Tại ngã ba rẽ phải, xe đi thẳng hoặc rẽ trái chệch > 40m so với tuyến. | Ứng dụng phát hiện chệch đường, banner rẽ hiện 'Đang tìm đường mới…'. | P0 |
| **TC-NAV-029** | Tự động tính toán lại lộ trình (Auto-Rerouting) | Đã chệch đường | 1. Chờ 1-2 giây sau khi chệch đường. | Tự động gọi OSRM từ vị trí hiện tại đến đích cũ, vẽ lại tuyến đường mới mà người dùng không cần bấm gì. | P0 |
| **TC-NAV-030** | Chống tính lại lộ trình liên tục khi xe quay đầu (Reroute Debounce) | Đang quay đầu xe | 1. Xe thực hiện quay đầu trong 3 giây. | Hệ thống chờ vị trí ổn định rồi mới gọi reroute, không gửi dồn dập nhiều request gây giật lag. | P1 |
| **TC-NAV-031** | Nút dừng dẫn đường khẩn cấp (Stop Navigation 'X') | Đang dẫn đường | 1. Bấm nút tròn 'X' ở góc phải thanh điều khiển đáy. | Dừng dẫn đường ngay lập tức, tắt âm thanh, trả camera về góc nhìn phẳng 2D, giải phóng KeepAwake. | P0 |
| **TC-NAV-032** | Màn hình thông báo đến đích (Arrival Screen) | Xe đến gần đích < 20m | 1. Xe di chuyển vào phạm vi đích đến. | Xuất hiện giao diện 'Bạn đã đến nơi.' kèm icon cờ hiệu xanh, chuông/giọng nói thông báo kết thúc hành trình. | P0 |
| **TC-NAV-033** | Nút 'Về bản đồ' trên màn hình đến đích | Màn hình đến đích mở | 1. Bấm 'Về bản đồ'. | Xóa toàn bộ tuyến đường vừa đi, đưa ứng dụng về trạng thái Explore ban đầu. | P0 |
| **TC-NAV-034** | Tín hiệu GPS bị gián đoạn khi đang dẫn đường (Stale GPS > 15s) | Vào đường hầm | 1. Không nhận được vị trí mới trong > 15 giây. | Vòng tròn định vị chuyển sang màu xám mờ, xuất hiện cảnh báo 'Tín hiệu GPS bị mất hoặc không ổn định'. | P0 |
| **TC-NAV-035** | Tự động khôi phục khi GPS có lại tín hiệu | Ra khỏi hầm | 1. Nhận lại tọa độ GPS chính xác. | Con trỏ chuyển về màu xanh lam, camera căn lại vị trí xe và tiếp tục dẫn đường mượt mà. | P0 |
| **TC-NAV-036** | Bấm thu nhỏ banner rẽ (Turn banner collapse) | Đang dẫn đường | 1. Chạm vào biểu tượng thu gọn trên banner rẽ. | Banner thu nhỏ thành một thanh mỏng chỉ hiện icon rẽ và khoảng cách, mở rộng tầm nhìn bản đồ. | P2 |
| **TC-NAV-037** | Dẫn đường qua hầm chui đô thị ngắn (< 200m) | Xe qua hầm Kim Liên / Thủ Thiêm | 1. Xe vào hầm trong 30 giây. | Ứng dụng giữ nguyên hướng đi suy đoán dựa trên vận tốc cuối (Dead Reckoning nhẹ), không báo lỗi nhảy cóc. | P1 |
| **TC-NAV-038** | Hiển thị bước rẽ tiếp theo phụ (Next-Next Turn Preview) | Hai khúc rẽ sát nhau < 100m | 1. Rẽ phải rồi phải rẽ trái ngay sau 30m. | Banner phụ nhỏ bên dưới hiện 'Sau đó rẽ trái' để tài xế chủ động chuyển làn xe. | P1 |
| **TC-NAV-039** | Thao tác chạm đổi góc nhìn 3D sang 2D ngay trong khi dẫn đường | Đang dẫn đường 3D | 1. Bấm nút '2D' trên bản đồ. | Camera chuyển sang nhìn thẳng từ trên xuống nhưng vẫn giữ chế độ xoay bám theo hướng xe. | P1 |
| **TC-NAV-040** | Âm thanh bip nhẹ khi chuyển bước rẽ | Bật âm thanh | 1. Xe vượt qua ngã rẽ. | Phát âm thanh bip ngắn báo hiệu bước rẽ đã hoàn thành thành công. | P2 |
| **TC-NAV-041** | Cập nhật lại thời gian còn lại liên tục theo tốc độ thực tế | Gặp tắc đường | 1. Xe giảm tốc độ từ 50km/h xuống 10km/h. | Thời gian còn lại tăng dần thích ứng với vận tốc thực tế của người dùng. | P0 |
| **TC-NAV-042** | Chống đóng nhầm ứng dụng khi đang lái xe | Đang dẫn đường | 1. Vuốt mép thoát ứng dụng. | Hệ thống hiển thị xác nhận hoặc hoạt động ở chế độ background nếu được cấp quyền. | P1 |
| **TC-NAV-043** | Hiển thị tên con đường hiện tại đang chạy ở dưới cùng | Đang dẫn đường | 1. Quan sát phía trên thanh tốc độ. | Hiển thị tên đường hiện tại: 'Đang đi trên Đường Giải Phóng'. | P1 |
| **TC-NAV-044** | Tính toán khoảng cách theo hình chiếu đường đi (Snap-to-route) | GPS có độ trôi nhẹ 5m | 1. Xe đi đúng làn đường nhưng GPS lệch 5m sang vỉa hè. | Con trỏ xe tự động gắn khớp vào tim đường (snap to route), không bị hiển thị chạy đâm vào nhà dân. | P0 |
| **TC-NAV-045** | Không snap to route khi xe đi chệch hẳn (> 35m) | Xe rẽ sang đường khác | 1. Xe rẽ cách lộ trình cũ 40m. | Nhả snap to route, hiển thị vị trí thực của GPS và kích hoạt tìm lại đường. | P0 |

---

## 4. ĐỊNH VỊ GPS, ĐỘ CHÍNH XÁC & LA BÀN CẢM BIẾN (TC-GEO: 35 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GEO-001** | Xin quyền truy cập vị trí lần đầu (Geolocation Permission) | App mới cài đặt | 1. Mở ứng dụng. | Xuất hiện hộp thoại cấp quyền vị trí của hệ thống (iOS / Android / Browser). | P0 |
| **TC-GEO-002** | Xử lý khi người dùng từ chối cấp quyền vị trí (Denied) | Người dùng bấm Từ chối | 1. Chọn 'Không cho phép'. | Hiển thị thông báo: 'Quyền vị trí đang bị chặn. Cho phép vị trí cho trang này hoặc ứng dụng, rồi bấm Thử lại.' | P0 |
| **TC-GEO-003** | Thử lại quyền vị trí sau khi đã bật trong Cài đặt máy | Đã bật lại vị trí | 1. Bấm nút 'Thử lại GPS'. | Ứng dụng gọi lại Geolocation.start() và nhận tọa độ GPS thành công. | P0 |
| **TC-GEO-004** | Cảnh báo kết nối không an toàn (Insecure Context HTTP) | Chạy trên IP LAN HTTP | 1. Truy cập qua `http://192.168.x.x:5173`. | Báo lỗi rõ: Định vị web cần HTTPS hoặc localhost trên chính thiết bị. | P0 |
| **TC-GEO-005** | Bộ lọc tọa độ không hợp lệ (NaN, Out of range) | Mock vị trí lỗi | 1. Nhận GPS với lat=999 hoặc timestamp quá khứ > 2 phút. | Hàm `validLocation()` từ chối bản ghi lỗi, không làm nhảy giật bản đồ. | P0 |
| **TC-GEO-006** | Hiển thị vòng tròn sai số vị trí (Accuracy Halo) | GPS có accuracy = 30m | 1. Quan sát xung quanh con trỏ vị trí. | Hiển thị vòng tròn xanh nhạt bán kính tương đương 30m thực tế trên bản đồ. | P1 |
| **TC-GEO-007** | Đổi màu vòng tròn sai số khi GPS mất tín hiệu | GPS stale > 15s | 1. Giả lập GPS ngưng gửi dữ liệu. | Vòng tròn sai số đổi từ màu xanh `#1a73e8` sang màu xám tro `#8d99a5`. | P1 |
| **TC-GEO-008** | Tự động xin quyền la bàn trên iOS 13+ (DeviceOrientation Permission) | Thiết bị iPhone (Safari) | 1. Chạm vào màn hình lần đầu (sự kiện click/touchend). | Kích hoạt `DeviceOrientationEvent.requestPermission()`, hệ thống hỏi quyền cảm biến chuyển động. | P0 |
| **TC-GEO-009** | Xoay điện thoại khi đứng yên (Stationary Compass Rotation) | Đứng yên tại chỗ (v < 2.5m/s) | 1. Cầm điện thoại xoay 360 độ từ Bắc sang Đông, Nam, Tây. | Mũi tên xanh trên con trỏ vị trí xoay mượt mà đúng theo hướng đầu điện thoại chỉ trong thời gian thực. | P0 |
| **TC-GEO-010** | Không bị mất góc xoay la bàn khi GPS gửi gói cập nhật vị trí mới | Đang xoay điện thoại | 1. Xoay điện thoại liên tục trong khi GPS gửi tọa độ mỗi giây. | Góc mũi tên không bị giật về 0° hoặc reset về dấu '?' mà giữ nguyên góc la bàn chuẩn xác. | P0 |
| **TC-GEO-011** | Ưu tiên góc di chuyển của GPS khi chạy xe tốc độ cao | Xe chạy > 15 km/h (> 2.5m/s) | 1. Xe di chuyển thẳng trên đường. | Mũi tên tự động khóa theo hướng vector di chuyển thực tế của xe (GPS course), giảm rung lắc la bàn. | P0 |
| **TC-GEO-012** | Giảm tải cập nhật DOM la bàn (Throttle Sensor Events) | Cảm biến phát ở 60Hz | 1. Điện thoại phát event orientation liên tục. | Logic throttle giữ khoảng cách cập nhật tối thiểu 100ms hoặc lệch > 1°, không gây quá tải CPU/pin. | P1 |
| **TC-GEO-013** | Xử lý cảm biến hướng tuyệt đối trên Android (deviceorientationabsolute) | Thiết bị Android | 1. Kiểm tra trên Chrome Android. | Lấy chuẩn `event.alpha` khi `event.absolute === true` để tính hướng Bắc thực chuẩn xác. | P1 |
| **TC-GEO-014** | Bỏ qua giá trị alpha tương đối không có gốc hướng Bắc | Máy không có từ kế | 1. Cảm biến phát alpha nhưng `absolute !== true`. | Hệ thống không dùng góc quay sai lệch, giữ con trỏ ở chế độ chấm tròn chuẩn. | P1 |
| **TC-GEO-015** | Bấm nút 'Về vị trí của tôi' (Recenter FAB) | Bản đồ đang bị kéo đi xa | 1. Kéo bản đồ ra khỏi vị trí hiện tại.<br>2. Bấm nút icon tâm ngắm LocateFixed. | Bản đồ tự động lướt êm về căn giữa vị trí GPS của người dùng với mức zoom thích hợp. | P0 |
| **TC-GEO-016** | Lọc nhiễu độ chính xác kém (> 100m) | GPS trôi sóng | 1. Tọa độ gửi về có accuracy = 250m. | Ứng dụng giữ vị trí cũ và cảnh báo độ chính xác thấp, không di dời con trỏ xe đột ngột. | P0 |
| **TC-GEO-017** | Tự động kích hoạt GPS khi mở ứng dụng | App mở | 1. Khởi động app. | Tự động gọi định vị mà không cần người dùng phải bấm thêm nút phụ nào. | P0 |
| **TC-GEO-018** | Hiệu chuẩn la bàn khi bị nhiễu từ trường (Magnetic calibration warning) | Gần nam châm | 1. Cảm biến phát tín hiệu độ tin cậy thấp. | Ứng dụng giảm trọng số cảm biến la bàn, chuyển sang ước tính theo hướng di chuyển. | P1 |
| **TC-GEO-019** | Khôi phục la bàn sau khi quay lại từ ứng dụng khác | Đổi tab | 1. Mở ứng dụng khác 10s rồi quay lại. | Bộ lắng nghe cảm biến tự động đăng ký lại và cập nhật góc xoay tức thì. | P0 |
| **TC-GEO-020** | Xử lý độ cao địa hình (Altitude if available) | GPS có altitude | 1. Lái xe trên đèo dốc. | Hệ thống nhận diện đúng cao độ, không ảnh hưởng đến độ dài khoảng cách mặt phẳng. | P2 |
| **TC-GEO-021** | Tính toán vận tốc tức thời từ khoảng cách giữa 2 tọa độ liên tiếp | GPS không cung cấp speed | 1. Tọa độ thay đổi 20m trong 1 giây. | Tự tính vận tốc ~72 km/h làm phương án dự phòng khi phần cứng không trả trường speed. | P1 |
| **TC-GEO-022** | Chuyển đổi góc xoay mượt mà qua mốc 0°/360° (Compass Interpolation) | Xoay từ 359° sang 1° | 1. Xoay nhẹ qua hướng Bắc. | Mũi tên xoay xuôi 2 độ mượt mà, không bị quay vòng ngược 358 độ. | P0 |
| **TC-GEO-023** | Đèn báo trạng thái định vị trên Topbar | GPS active | 1. Quan sát góc trên màn hình. | Hiển thị chấm xanh khi GPS ổn định (< 20m), chấm vàng khi GPS yếu (> 50m). | P1 |
| **TC-GEO-024** | Hỗ trợ chế độ tiết kiệm pin của máy | Low Power Mode | 1. Bật chế độ tiết kiệm pin trên iOS. | Tần số quét GPS tối ưu để vừa đảm bảo dẫn đường vừa tiết kiệm năng lượng. | P1 |
| **TC-GEO-025** | Tọa độ ranh giới lãnh thổ Việt Nam | Kiểm tra giới hạn | 1. Vị trí tại quần đảo Trường Sa, Hoàng Sa. | Bản đồ hiển thị đúng chủ quyền lãnh thổ Việt Nam, không có lỗi định vị ngoài biên giới. | P0 |
| **TC-GEO-026** | Chống lag giật camera khi xe dừng đèn đỏ | Xe dừng hẳn v = 0 | 1. Xe dừng chờ đèn đỏ 60 giây. | Camera đứng yên hoàn toàn, không rung lắc do GPS nhảy vài centimet. | P0 |
| **TC-GEO-027** | Khử trôi vị trí (Jitter Smoothing / Kalman filter) | Đứng yên trong nhà | 1. Để máy cố định trên bàn 5 phút. | Vị trí không bị chạy lung tung qua lại giữa các phòng lân cận. | P1 |
| **TC-GEO-028** | Thử nghiệm trên máy tính để bàn qua Wi-Fi Geolocation | PC không có chip GPS | 1. Mở web trên trình duyệt PC. | Lấy tọa độ gần đúng qua địa chỉ IP/WiFi của trình duyệt bình thường. | P1 |
| **TC-GEO-029** | Tự động giải phóng watcher Geolocation khi tắt app | Tắt app | 1. Đóng hẳn ứng dụng. | Gọi `clearWatch` giải phóng tài nguyên phần cứng GPS ngay lập tức. | P0 |
| **TC-GEO-030** | Đồng bộ góc xoay bản đồ với góc la bàn khi ở chế độ North-up | Bản đồ phẳng 2D | 1. Xoay máy khi bản đồ ở chế độ North-up. | Bản đồ giữ nguyên hướng Bắc lên trên, chỉ có mũi tên trên con trỏ xoay. | P0 |
| **TC-GEO-031** | Đồng bộ góc xoay bản đồ với góc la bàn khi ở chế độ Head-up (3D) | Chế độ dẫn đường 3D | 1. Xoay xe khi đang đi. | Bản đồ xoay đồng bộ sao cho hướng mũi tên luôn chỉ thẳng lên trên màn hình. | P0 |
| **TC-GEO-032** | Thời gian chốt vị trí đầu tiên (Time to First Fix - TTFF) | Bật app ngoài trời | 1. Đo thời gian từ khi mở app đến khi có tọa độ. | TTFF dưới 3 giây trong điều kiện trời quang. | P1 |
| **TC-GEO-033** | Kiểm tra tính liên tục của chuỗi timestamp vị trí | Đang chạy | 1. Ghi log các timestamp GPS. | Timestamp tăng đơn điệu (monotonic), không có bản ghi nào bị lùi thời gian. | P1 |
| **TC-GEO-034** | Xử lý khi người dùng đổi cài đặt vị trí từ 'Chính xác' sang 'Gần đúng' (Approximate Location) | iOS 14+ setting | 1. Chuyển cài đặt iOS sang Vị trí ước tính. | Hiển thị vùng sai số lớn và thông báo khuyến nghị bật Vị trí chính xác để dẫn đường. | P1 |
| **TC-GEO-035** | Tắt thông báo lỗi GPS khi vị trí đã được khôi phục thành công | GPS vừa có lại | 1. Nhận tọa độ hợp lệ sau khi lỗi. | Banner lỗi vị trí tự động biến mất ngay mà không cần người dùng tắt thủ công. | P0 |

---

## 5. BẢN ĐỒ MAPLIBRE, CAMERA 3D COCKPIT & CỬ CHỈ (TC-MAP: 40 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MAP-001** | Khởi tạo bản đồ nền OpenFreeMap thành công | Mở ứng dụng | 1. Vào app lần đầu. | Bản đồ vector MapLibre tải đầy đủ đường phố, công viên, sông ngòi; attribute `data-map-ready='true'`. | P0 |
| **TC-MAP-002** | Ưu tiên hiển thị tên đường tiếng Việt | Bản đồ tải xong | 1. Quan sát tên các tuyến đường tại Hà Nội / TP.HCM. | Các nhãn text ưu tiên thứ tự: `name:vi` ➔ `name` ➔ `name:latin` ➔ `name:en`, font Be Vietnam Pro sắc nét. | P0 |
| **TC-MAP-003** | Bật chế độ tòa nhà 3D (3D Buildings Toggle) | Zoom bản đồ >= 14 | 1. Bấm nút '3D' trên thanh điều khiển map. | Nút chuyển thành '2D', bản đồ nghiêng góc 55°, các khối nhà nổi 3D (fill-extrusion) hiện rõ chiều cao. | P0 |
| **TC-MAP-004** | Tắt chế độ 3D về 2D phẳng | Đang ở chế độ 3D | 1. Bấm nút '2D'. | Bản đồ hạ góc nghiêng về 0° (thẳng đứng từ trên xuống), ẩn lớp khối nhà 3D. | P0 |
| **TC-MAP-005** | Nút la bàn đặt lại hướng Bắc (North Reset Compass FAB) | Bản đồ đang bị xoay lệch | 1. Dùng 2 ngón tay xoay bản đồ 90°.<br>2. Quan sát icon la bàn Compass.<br>3. Bấm vào nút la bàn. | Kim la bàn quay đồng bộ góc xoay. Khi bấm vào, bản đồ tự động quay thẳng hướng Bắc lên trên (bearing = 0°). | P0 |
| **TC-MAP-006** | Camera tự động xoay theo hướng xe khi dẫn đường 3D | Bắt đầu dẫn đường | 1. Bật dẫn đường xe chạy qua khúc cua gắt 90°. | Toàn bộ bản đồ xoay mượt mà theo góc cua, đảm bảo con đường phía trước luôn hướng thẳng lên trên màn hình. | P0 |
| **TC-MAP-007** | Thao tác chạm kéo bản đồ khi đang dẫn đường (User Pan / Drag) | Đang dẫn đường tự bám | 1. Dùng ngón tay kéo bản đồ sang trái/phải để xem xung quanh. | Chế độ tự động bám bị tạm dừng (`follow = false`), nút định vị tâm ngắm sáng lên để người dùng bấm quay lại. | P0 |
| **TC-MAP-008** | Khôi phục tự động bám sau khi đã kéo bản đồ | Đang ở chế độ un-follow | 1. Bấm vào nút tâm ngắm LocateFixed. | Bản đồ tự động zoom và căn lại vào vị trí xe, khôi phục bám theo góc nhìn dẫn đường (`follow = true`). | P0 |
| **TC-MAP-009** | Cử chỉ phóng to / thu nhỏ bằng 2 ngón tay (Pinch to Zoom) | Màn hình cảm ứng | 1. Dùng 2 ngón tay kéo giãn ra hoặc chụm lại. | Bản đồ phóng to/thu nhỏ mượt mà không bị khựng, tỷ lệ scale chính xác. | P0 |
| **TC-MAP-010** | Cử chỉ nghiêng bản đồ bằng 2 ngón tay (Two-finger Pitch) | Bản đồ 3D | 1. Đặt 2 ngón tay trượt đồng thời lên/xuống. | Góc nghiêng bản đồ thay đổi mượt mà từ 0° đến tối đa 65°. | P1 |
| **TC-MAP-011** | Tự động căn lề Padding tránh bị che khuất bởi giao diện | Mở các panel | 1. Mở thẻ Bottom Panel hoặc Turn Banner. | Camera khi fit tuyến đường tự động tính padding trên, dưới, trái, phải để toàn bộ tuyến đường lọt trọn vào vùng nhìn thấy. | P0 |
| **TC-MAP-012** | Xử lý khi xoay ngang điện thoại (Landscape Orientation) | Xoay ngang máy | 1. Xoay điện thoại sang chiều ngang. | Bản đồ tự kích hoạt `map.resize()`, bố cục giao diện tái phân bổ gọn gàng sang hai bên cạnh màn hình. | P0 |
| **TC-MAP-013** | Thông báo khi lỗi tải ô bản đồ (Tile Load Error) | Mất mạng cục bộ | 1. Giả lập chặn domain `tiles.openfreemap.org`. | Xuất hiện thanh thông báo nhẹ nhàng: 'Một số ô bản đồ chưa tải được. Kiểm tra kết nối mạng.' | P1 |
| **TC-MAP-014** | Ẩn hiện chi tiết điểm vạch qua đường cho người đi bộ theo mức Zoom | Zoom xa < 15 | 1. Thu nhỏ bản đồ ra xa. | Các icon vạch qua đường tự động ẩn để tránh rối mắt; khi phóng to >= 15 tự động hiện lại. | P1 |
| **TC-MAP-015** | Đóng gói Tile Worker nội bộ (Offline MapLibre Worker) | Kiểm tra tài nguyên | 1. Kiểm tra network call của maplibre-gl-worker. | Worker bản đồ được bundle cục bộ từ file JS nội bộ, không phụ thuộc CDN nước ngoài. | P0 |
| **TC-MAP-016** | Chạm đúp 1 ngón tay để phóng to (Double Tap to Zoom In) | Màn hình cảm ứng | 1. Chạm đúp nhanh 2 lần bằng 1 ngón tay vào vị trí bất kỳ. | Bản đồ phóng to lên 1 cấp zoom mượt mà tại tâm điểm chạm. | P1 |
| **TC-MAP-017** | Chạm 2 ngón tay đồng thời để thu nhỏ (Two-finger Tap to Zoom Out) | Màn hình cảm ứng | 1. Chạm đồng thời 2 ngón tay vào bản đồ. | Bản đồ thu nhỏ lại 1 cấp zoom mượt mà. | P1 |
| **TC-MAP-018** | Kéo zoom 1 tay (One-finger Quick Zoom) | Màn hình cảm ứng | 1. Chạm đúp và giữ ngón tay ở lần chạm thứ 2 rồi trượt lên/xuống. | Bản đồ phóng to thu nhỏ liên tục theo chuyển động trượt của ngón tay. | P1 |
| **TC-MAP-019** | Giới hạn Zoom tối thiểu (Min Zoom = 3) | Thu nhỏ bản đồ | 1. Thu nhỏ hết cỡ. | Bản đồ dừng ở mức nhìn toàn cầu vừa vặn, không bị lặp vô hạn gây lỗi đồ họa. | P1 |
| **TC-MAP-020** | Giới hạn Zoom tối đa (Max Zoom = 19) | Phóng to bản đồ | 1. Phóng to hết cỡ. | Bản đồ dừng ở mức thấy rõ từng số nhà và lối đi, hình ảnh vector vẫn sắc nét không vỡ hạt. | P1 |
| **TC-MAP-021** | Hiệu ứng lướt quán tính khi thả tay (Inertia Panning) | Vuốt mạnh bản đồ | 1. Vuốt nhanh ngón tay và nhấc lên khỏi màn hình. | Bản đồ trượt tiếp một đoạn ngắn với gia tốc giảm dần tự nhiên. | P1 |
| **TC-MAP-022** | Hiển thị thước tỷ lệ bản đồ (Scale Bar) | Góc dưới bản đồ | 1. Quan sát thước đo khoảng cách. | Hiển thị thước đo chuẩn: 50m, 100m, 500m, 1km tương ứng mức zoom hiện thời. | P2 |
| **TC-MAP-023** | Đổi màu nền bản đồ theo chế độ Sáng / Tối (Dark mode support) | Đổi theme máy | 1. Bật Dark Mode hệ thống. | Bản đồ và các panel tự động áp dụng bảng màu tối dễ nhìn ban đêm, chống chói mắt lái xe. | P1 |
| **TC-MAP-024** | Kiểm tra render bóng đổ các tòa nhà 3D (Shadows & Sun Light) | Chế độ 3D bật | 1. Phóng to khu đô thị Landmark 81 / Keangnam. | Các khối nhà 3D có bóng đổ và độ chuyển màu theo góc sáng tạo cảm giác chiều sâu không gian. | P2 |
| **TC-MAP-025** | Hiển thị nét vẽ tuyến đường (Route Line Polyline) | Tuyến đã tạo | 1. Quan sát nét vẽ tuyến đường. | Đường vẽ màu xanh `#1a73e8`, bo tròn các đầu nối (`round-cap`, `round-join`), có viền xanh đậm `#1558b0`. | P0 |
| **TC-MAP-026** | Mũi tên chỉ hướng di chuyển in trên nét vẽ tuyến đường (Route Chevrons) | Đang dẫn đường | 1. Quan sát mặt đường trên nét vẽ tuyến. | Xuất hiện các mũi tên nhỏ chỉ hướng chạy dọc tim đường giúp nhận biết hướng đi một chiều. | P1 |
| **TC-MAP-027** | Xóa sạch nét vẽ tuyến đường cũ khi hủy dẫn đường | Hủy tuyến | 1. Bấm hủy tuyến. | Source và Layer của route trên MapLibre được gỡ bỏ sạch sẽ, không để lại vết mờ. | P0 |
| **TC-MAP-028** | Hiển thị marker ghim điểm xuất phát (Origin Pin) | Tuyến đã tạo | 1. Xem điểm đầu tuyến. | Marker tròn xanh viền trắng với vòng halo phát sáng đặc trưng vị trí xuất phát. | P0 |
| **TC-MAP-029** | Hiển thị marker ghim điểm đến (Destination Pin) | Tuyến đã tạo | 1. Xem điểm cuối tuyến. | Marker ghim màu đỏ hình giọt nước đặc trưng điểm đến của Google Maps. | P0 |
| **TC-MAP-030** | Tránh giật giật bản đồ khi cập nhật vị trí GPS tần số cao (Position Smoothing) | GPS 1Hz | 1. Di chuyển xe với tốc độ ổn định. | Con trỏ xe lướt mượt mà giữa các điểm tọa độ bằng phép nội suy tuyến tính, không bị khựng. | P0 |
| **TC-MAP-031** | Nút chọn lớp bản đồ (Layers Button) | Cụm nút FAB | 1. Bấm nút icon Layer. | Mở bảng tùy chọn: Bản đồ tiêu chuẩn, Tòa nhà 3D, Hiển thị camera, Hiển thị biển báo. | P1 |
| **TC-MAP-032** | Tự động tắt tòa nhà 3D khi zoom xa < 13 để tối ưu GPU | Đang ở 3D | 1. Thu nhỏ bản đồ ra xa tầm nhìn tỉnh/thành phố. | Lớp 3D tự động ẩn để tiết kiệm pin và bộ nhớ máy. | P1 |
| **TC-MAP-033** | Tự động khôi phục lớp 3D khi phóng to lại >= 14 | Phóng to lại | 1. Phóng to vào trung tâm thành phố. | Các khối nhà 3D tự động hiện lại đầy đủ. | P1 |
| **TC-MAP-034** | Chống hiện tượng nhấp nháy hình ảnh (Z-fighting) giữa đường và khối nhà 3D | Góc nghiêng 60° | 1. Nghiêng bản đồ ở khu vực cầu vượt và nhà san sát. | Không bị hiện tượng rách hình hay chớp nháy đè lớp đồ họa. | P1 |
| **TC-MAP-035** | Hiển thị tên các cây cầu và hầm lớn tại Việt Nam | Xem Cầu Nhật Tân / Cầu Rồng | 1. Xem khu vực cầu lớn. | Tên cầu hiển thị to rõ dọc theo thân cầu. | P1 |
| **TC-MAP-036** | Bản đồ hoạt động trơn tru trong thẻ iframe hoặc WebView iOS | Chạy trong Capacitor WKWebView | 1. Chạy trên ứng dụng iOS đóng gói. | WebGL 2.0 khởi chạy thành công, không bị đen màn hình. | P0 |
| **TC-MAP-037** | Xử lý sự kiện WebGL Context Lost | Giả lập GPU crash | 1. Kích hoạt mất context đồ họa. | Ứng dụng tự động phục hồi và vẽ lại bản đồ mà không cần tải lại toàn bộ app. | P1 |
| **TC-MAP-038** | Tối ưu bộ nhớ đệm ngói bản đồ (Tile Cache Size) | Di chuyển nhiều vùng | 1. Lướt qua 5 thành phố khác nhau. | Bộ nhớ cache ngói giới hạn thông minh, không làm phình RAM vượt quá 150MB. | P1 |
| **TC-MAP-039** | Hiển thị công viên màu xanh lá và sông ngòi màu xanh dương | Xem Hồ Tây / Sông Hồng | 1. Quan sát màu sắc địa vật. | Màu sắc tự nhiên chuẩn bảng màu Carto/Google Maps: Sông nước `#aad3df`, Công viên `#c8e6c9`. | P2 |
| **TC-MAP-040** | Độ mượt mà khi đổi góc quay bản đồ (Bearing animation) | Bấm xoay hướng Bắc | 1. Quan sát chuyển động quay. | Quay về 0° với hiệu ứng easing êm dịu, không giật gấp. | P1 |

---

## 6. DỮ LIỆU ĐƯỜNG OSM, GIỚI HẠN TỐC ĐỘ & CAMERA PHẠT NGUỘI (TC-ROD: 45 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ROD-001** | Nhận diện giới hạn tốc độ đoạn đường hiện tại (maxspeed) | Tuyến có data tốc độ | 1. Xe di chuyển trên đường có gắn tag maxspeed=60. | Xuất hiện biển tròn viền đỏ số '60' km/h chuẩn biển báo Việt Nam trên màn hình. | P0 |
| **TC-ROD-002** | Đổi biển tốc độ khi chuyển sang đoạn đường mới | Xe qua ngã rẽ | 1. Xe rẽ từ đường 60 km/h vào ngõ/đường gom 40 km/h. | Biển giới hạn tốc độ lập tức cập nhật từ '60' sang '40'. | P0 |
| **TC-ROD-003** | Cảnh báo camera phạt nguội cố định (Speed Camera Alert) | Tuyến có camera OSM | 1. Xe di chuyển cách camera phạt nguội 500m. | Xuất hiện icon camera và thông báo: 'Phía trước có camera phạt nguội. Đoạn đường tối đa X km/h.' | P0 |
| **TC-ROD-004** | Đếm lùi khoảng cách đến camera phạt nguội | Xe tiến gần camera | 1. Quan sát thẻ cảnh báo. | Khoảng cách giảm dần: 'Cách 500m' ➔ 'Cách 300m' ➔ 'Cách 100m'. | P0 |
| **TC-ROD-005** | Tự động ẩn cảnh báo camera sau khi đã vượt qua | Xe vượt qua camera | 1. Xe đi qua vị trí đặt camera 30m. | Cảnh báo camera tự động biến mất, trả lại giao diện thông thoáng. | P0 |
| **TC-ROD-006** | Lọc camera phạt nguội theo đúng chiều di chuyển | Camera có chiều | 1. Xe đi làn đường ngược chiều với hướng giám sát của camera. | Không phát cảnh báo sai lệch cho chiều đường không bị giám sát. | P1 |
| **TC-ROD-007** | Nhận diện biển báo nguy hiểm: Đường giao nhau / Nút giao | Tuyến có dữ liệu | 1. Xe đến gần điểm giao nguy hiểm. | Hiển thị biểu tượng biển tam giác viền đỏ cảnh báo đường giao nhau. | P1 |
| **TC-ROD-008** | Cảnh báo gờ giảm tốc / Giảm tốc độ (Traffic Calming) | Tuyến có gờ giảm tốc | 1. Xe cách gờ giảm tốc 150m. | Hiển thị cảnh báo gờ giảm tốc trên tuyến đường. | P1 |
| **TC-ROD-009** | Cảnh báo giao cắt đường sắt không có rào chắn (Railway Crossing) | Tuyến có đường sắt | 1. Xe tiến gần điểm giao cắt đường sắt. | Hiển thị biển cảnh báo đường sắt và nhắc nhở chú ý quan sát. | P1 |
| **TC-ROD-010** | Cảnh báo khu vực trường học / Vạch người đi bộ qua đường | Tuyến có vạch đi bộ | 1. Xe tiến vào khu dân cư đông đúc. | Hiển thị cảnh báo người đi bộ qua đường. | P2 |
| **TC-ROD-011** | Bật/tắt bộ lọc loại cảnh báo trong RoadDataPanel | Mở RoadDataPanel | 1. Bỏ chọn checkbox 'Camera'. | Toàn bộ các icon camera trên bản đồ tạm thời ẩn đi; các loại biển báo khác vẫn hiển thị. | P1 |
| **TC-ROD-012** | Quét dữ liệu toàn tuyến dài (Full-route Scan > 100km) | Lập tuyến Hà Nội - Tiền Hải | 1. Lập lộ trình từ Hà Nội về Tiền Hải (Thái Bình).<br>2. Mở bảng dữ liệu đường bộ. | Hệ thống tải thành công toàn bộ hàng trăm điểm cảnh báo trên suốt chiều dài 110km mà không bị tràn bộ nhớ. | P0 |
| **TC-ROD-013** | Nạp dữ liệu đường bộ đóng gói sẵn trên máy (Bundled Offline Shards) | Không có internet | 1. Bật chế độ máy bay, mở tuyến đường trong vùng dữ liệu đã nạp. | Tải đầy đủ 72.759 nodes từ 1.346 mảnh shard cục bộ mà không cần gửi request lên Overpass API. | P0 |
| **TC-ROD-014** | Bấm vào icon biển báo trên bản đồ để xem chi tiết | Chạm icon trên map | 1. Chạm vào 1 biểu tượng camera trên mặt đường. | Xuất hiện Popup thông tin: Tên đối tượng, mã biển báo, link xem nguồn gốc trực tiếp trên OpenStreetMap. | P1 |
| **TC-ROD-015** | Ghi chú minh bạch dữ liệu nguồn OSM | Xem popup | 1. Đọc nội dung mô tả trong popup. | Có dòng lưu ý: 'Nguồn OSM · gần tuyến · chưa xác nhận chiều áp dụng/chức năng xử phạt. Quan sát thực tế.' | P1 |
| **TC-ROD-016** | Nhận diện camera vượt đèn đỏ tại các ngã tư | Dữ liệu OSM có red light cam | 1. Xe đến gần ngã tư có gắn camera phạt vượt đèn đỏ. | Hiển thị icon camera đèn đỏ và cảnh báo chú ý tín hiệu giao thông. | P1 |
| **TC-ROD-017** | Nhận diện giới hạn tốc độ theo làn đường | Đường cao tốc nhiều làn | 1. Tuyến đi trên cao tốc Pháp Vân - Cầu Giẽ. | Hiển thị dải tốc độ tối đa 100-120 km/h và tốc độ tối thiểu 60 km/h. | P1 |
| **TC-ROD-018** | Nhận diện biển báo bắt đầu khu đông dân cư (R.420) | Vào ranh giới thị trấn | 1. Xe đi vào biển R.420. | Tốc độ tối đa tự động giới hạn ở 50 km/h (đường đôi 60 km/h). | P0 |
| **TC-ROD-019** | Nhận diện biển báo hết khu đông dân cư (R.421) | Ra khỏi thị trấn | 1. Xe đi qua biển R.421. | Tốc độ tối đa tự động tăng lên 80 km/h (đường ngoài đô thị). | P0 |
| **TC-ROD-020** | Cảnh báo đoạn đường hay xảy ra tai nạn / Điểm đen giao thông | OSM hazard tag | 1. Xe tiếp cận điểm đen nguy hiểm. | Hiển thị biểu tượng tam giác chấm than cảnh báo nguy hiểm chú ý giảm tốc. | P1 |
| **TC-ROD-021** | Cảnh báo đường hẹp / Thắt cổ chai | Đường hẹp | 1. Xe sắp vào cầu hẹp hoặc đường đang thi công. | Cảnh báo đường hẹp phía trước. | P2 |
| **TC-ROD-022** | Cảnh báo dốc nguy hiểm (Steep Incline / Decline) | Đường đèo dốc > 10% | 1. Xe lên/xuống đèo Hải Vân. | Hiển thị biển cảnh báo dốc đứng nguy hiểm, về số thấp. | P2 |
| **TC-ROD-023** | Cảnh báo đường trơn trượt khi trời mưa | Khu vực trơn | 1. Đoạn đường có biển xe trượt ngã. | Hiển thị biểu tượng đường trơn. | P2 |
| **TC-ROD-024** | Cảnh báo khúc cua nguy hiểm liên tục | Đường đèo | 1. Xe vào chuỗi khúc cua gấp chữ Z. | Hiển thị biển báo nhiều chỗ ngoặt nguy hiểm. | P1 |
| **TC-ROD-025** | Cảnh báo trạm thu phí BOT phía trước (Toll Booth) | Cách trạm BOT 1km | 1. Xe tiến gần trạm thu phí. | Hiển thị biểu tượng trạm thu phí kèm nhắc nhở chuẩn bị thẻ ETC / VETC. | P1 |
| **TC-ROD-026** | Cảnh báo trạm cân tải trọng xe (Weigh Station) | Tuyến xe tải | 1. Xe qua khu vực trạm cân kiểm tra tải trọng. | Hiển thị thông báo trạm kiểm tra tải trọng. | P2 |
| **TC-ROD-027** | Xác thực cấu trúc định dạng shard JSON | Kiểm tra file dữ liệu | 1. Kiểm tra cấu trúc các file trong thư mục `public/osm-data/`. | Đầy đủ các trường id, type, lat, lon, tags, không có file nào bị hỏng cú pháp JSON. | P0 |
| **TC-ROD-028** | Thời gian truy vấn dữ liệu shard cục bộ (Query Latency) | Có sẵn shard | 1. Truy vấn các điểm biển báo trên đoạn đường 20km. | Kết quả trả về dưới 50ms nhờ cơ chế băm chỉ mục không gian (Spatial Hashing / Bounding Box). | P0 |
| **TC-ROD-029** | Tự động loại trừ các camera thử nghiệm không còn hoạt động | Tag disused:surveillance | 1. Node có tag `disused=yes`. | Bộ lọc bỏ qua node này, không đưa vào danh sách cảnh báo gây phiền toái. | P1 |
| **TC-ROD-030** | Hiển thị số lượng camera tìm thấy trên toàn lộ trình | Lập tuyến xong | 1. Xem thông tin tóm tắt trên RoadDataPanel. | Hiển thị chuẩn: 'Đã tìm thấy 8 camera và 14 biển báo trên tuyến'. | P1 |
| **TC-ROD-031** | Tìm kiếm nhanh biển báo theo tên trong danh sách | RoadDataPanel mở | 1. Nhập từ khóa 'Camera' vào ô tìm kiếm biển báo. | Danh sách lập tức lọc chỉ hiển thị các đối tượng camera phạt nguội. | P2 |
| **TC-ROD-032** | Bấm vào một biển báo trong danh sách để định vị trên bản đồ | RoadDataPanel mở | 1. Chạm vào camera số 3 trong danh sách. | Bản đồ tự động căn giữa vào tọa độ camera số 3 và mở popup chi tiết. | P1 |
| **TC-ROD-033** | Tự động đồng bộ biển báo theo từng phân đoạn OSRM | Đang chạy xe | 1. Chạy từ chặng rẽ A sang chặng rẽ B. | Cập nhật danh sách các biển báo sắp tới của chặng B. | P1 |
| **TC-ROD-034** | Biểu tượng biển báo chuẩn Quy chuẩn QCVN 41:2019/BGTVT | Giao diện app | 1. So sánh hình ảnh biển giới hạn tốc độ và biển nguy hiểm. | Đúng quy chuẩn đồ họa biển báo đường bộ Việt Nam (màu đỏ, vàng, xanh, trắng sắc nét). | P1 |
| **TC-ROD-035** | Cảnh báo cấm quay đầu xe (No U-Turn Sign) | Tuyến có biển cấm | 1. Xe đến ngã tư có biển P.124a. | Hiển thị biển cấm quay đầu trên bản đồ. | P2 |
| **TC-ROD-036** | Cảnh báo cấm rẽ trái / cấm rẽ phải (No Turn Signs) | Đường cấm rẽ | 1. Tiếp cận ngã rẽ có biển P.123. | Hiển thị biển cấm rẽ tương ứng. | P2 |
| **TC-ROD-037** | Cảnh báo đường một chiều (One-way Street) | Phố một chiều | 1. Tuyến tiếp cận phố một chiều. | Hiển thị biển I.407a đường một chiều. | P1 |
| **TC-ROD-038** | Cảnh báo độ cao tĩnh không tối đa của hầm / cầu vượt (Max Height) | Cầu thấp | 1. Tuyến qua hầm chui có biển P.115 (3.5m). | Hiển thị chiều cao tối đa cho phép. | P2 |
| **TC-ROD-039** | Cảnh báo tải trọng trục tối đa cho xe tải (Max Weight) | Cầu yếu | 1. Tuyến qua cầu hạn chế tải trọng. | Hiển thị trọng lượng giới hạn. | P2 |
| **TC-ROD-040** | Xử lý khi hai camera nằm quá sát nhau (< 50m) | Hai camera đôi | 1. Hai camera đặt sát nhau chụp 2 làn. | Hệ thống gom nhóm (cluster) hoặc hiển thị cảnh báo tích hợp, không chồng chéo chữ. | P1 |
| **TC-ROD-041** | Tắt hiển thị dữ liệu đường bộ để tiết kiệm pin trên máy yếu | Cài đặt | 1. Tắt công tắc 'Hiển thị biển báo'. | Toàn bộ layer biển báo được gỡ khỏi bản đồ, giải phóng CPU. | P1 |
| **TC-ROD-042** | Kiểm tra không bị rò rỉ bộ nhớ khi nạp hàng nghìn nodes biển báo | Tuyến dài 300km | 1. Nạp và hủy tuyến liên tục 5 lần. | Bộ nhớ giải phóng hoàn toàn các mảng đối tượng cũ. | P0 |
| **TC-ROD-043** | Cảnh báo đoạn đường hay có động vật chăn thả qua đường | Đường nông thôn | 1. Xe qua biển W.234. | Hiển thị biểu tượng trâu bò qua đường. | P2 |
| **TC-ROD-044** | Cảnh báo gió ngang mạnh trên cầu vượt biển (Crosswind) | Cầu Bạch Đằng / Tân Vũ | 1. Xe lên cầu vượt biển lớn. | Hiển thị biển cảnh báo gió ngang nguy hiểm. | P2 |
| **TC-ROD-045** | Đảm bảo 100% dữ liệu OSM là dữ liệu thật (Không chứa mock/synthetic) | Kiểm tra audit | 1. Chạy script audit data. | Tất cả các bản ghi đều có OSM ID thực từ máy chủ OpenStreetMap. | P0 |

---

## 7. GIỌNG NÓI TIẾNG VIỆT TTS & PHÁT ÂM CẢNH BÁO (TC-VOI: 30 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-VOI-001** | Khởi tạo giọng nói tiếng Việt (vi-VN) tự động | Mở ứng dụng | 1. Khởi động app lần đầu. | Tự động quét danh sách giọng nói hệ thống và gán giọng `vi-VN` mặc định. | P0 |
| **TC-VOI-002** | Bật/tắt âm thanh giọng nói (Voice Mute Toggle) | Đang dẫn đường | 1. Bấm nút biểu tượng Loa Volume2 trên thanh điều khiển. | Icon đổi thành Loa gạch chéo VolumeX, tắt toàn bộ âm thanh giọng nói; bấm lại bật lại bình thường. | P0 |
| **TC-VOI-003** | Phát âm chuẩn câu chỉ dẫn rẽ từ xa (Khoảng cách 500m) | Xe cách ngã rẽ 500m | 1. Xe tiến vào phạm vi 500m. | Giọng nói phát rõ ràng: 'Sau 500 mét, rẽ phải vào đường Nguyễn Huệ.' | P0 |
| **TC-VOI-004** | Phát âm câu nhắc chuẩn bị rẽ (Khoảng cách 50m - 100m) | Xe cách ngã rẽ 70m | 1. Xe tiến sát ngã rẽ. | Giọng nói phát: 'Chuẩn bị rẽ phải vào đường Nguyễn Huệ.' | P0 |
| **TC-VOI-005** | Phát âm câu thông báo ngay tại ngã rẽ | Xe tại ngã rẽ | 1. Xe bắt đầu rẽ. | Giọng nói phát: 'Rẽ phải.' | P0 |
| **TC-VOI-006** | Phát âm cảnh báo camera phạt nguội và tốc độ | Cách camera 400m | 1. Xe tiến gần camera. | Giọng nói thông báo: 'Chú ý, phía trước có camera giám sát tốc độ. Tốc độ tối đa 50 kilômét một giờ.' | P0 |
| **TC-VOI-007** | Phát âm cảnh báo khi chạy quá tốc độ giới hạn | Xe vượt quá tốc độ | 1. Xe chạy 65 km/h ở đoạn đường 50 km/h. | Giọng nói cảnh báo: 'Bạn đang chạy quá tốc độ giới hạn! Vui lòng giảm tốc độ.' | P0 |
| **TC-VOI-008** | Chống lặp câu cảnh báo quá tốc độ liên tục (Speech Cooldown) | Xe duy trì tốc độ cao | 1. Xe tiếp tục chạy quá tốc độ trong 15 giây. | Không lặp lại câu cảnh báo liên tục gây ức chế; chỉ nhắc lại sau chu kỳ giãn cách tối thiểu 20 giây. | P1 |
| **TC-VOI-009** | Phát âm thông báo tính lại lộ trình khi đi chệch đường | Xe đi sai đường | 1. Xe rẽ nhầm nhánh khác. | Giọng nói phát ngay: 'Bạn đã đi chệch tuyến đường. Đang tìm đường mới.' | P0 |
| **TC-VOI-010** | Phát âm chào mừng khi đến đích | Xe vào phạm vi đích | 1. Xe dừng tại điểm đích. | Giọng nói phát: 'Bạn đã đến nơi. Hành trình kết thúc.' | P0 |
| **TC-VOI-011** | Hủy ngay câu nói cũ khi có lệnh mới khẩn cấp (Speech Silence) | Đang đọc câu dài | 1. Đang đọc câu A thì phát sinh sự kiện rẽ gấp B. | Lập tức ngắt câu A và phát câu B ngay lập tức, không để trễ lệnh điều hướng. | P0 |
| **TC-VOI-012** | Fallback khi thiết bị chưa cài gói ngôn ngữ tiếng Việt | Máy xách tay chưa có tiếng Việt | 1. Thiết bị không có voice tiếng Việt trong Web Speech API. | Hiển thị thông báo trên giao diện: 'Thiết bị chưa có giọng tiếng Việt. Hãy tải giọng tiếng Việt trong cài đặt giọng nói.' | P1 |
| **TC-VOI-013** | Điều chỉnh âm lượng giọng nói theo âm lượng đa phương tiện hệ thống | Tăng giảm nút Volume máy | 1. Tăng âm lượng máy lên 100%. | Giọng nói phát to rõ ràng tương ứng. | P0 |
| **TC-VOI-014** | Không làm ngắt tiếng nhạc Bluetooth trên xe (Audio ducking) | Đang phát nhạc trên ô tô | 1. Đến ngã rẽ có giọng nói phát lên. | Nhạc tự động giảm âm lượng vừa phải khi app nói và khôi phục âm lượng ngay khi dứt câu. | P1 |
| **TC-VOI-015** | Phát âm chỉ dẫn đi vòng xuyến rõ ràng từng lối ra | Vòng xuyến 4 nhánh | 1. Xe vào vòng xuyến. | Phát âm: 'Tại vòng xuyến, đi theo lối ra thứ 2 vào đường Cầu Giấy.' | P0 |
| **TC-VOI-016** | Phát âm chỉ dẫn đi lên cầu vượt hoặc đi dưới gầm cầu | Nút giao 2 tầng | 1. Lộ trình yêu cầu đi lên cầu vượt. | Phát âm: 'Đi thẳng lên cầu vượt.' | P1 |
| **TC-VOI-017** | Phát âm chỉ dẫn đi vào đường hầm | Tuyến qua hầm | 1. Xe sắp vào hầm. | Phát âm: 'Đi vào hầm chui.' | P1 |
| **TC-VOI-018** | Chuẩn hóa cách đọc các ký hiệu viết tắt tiếng Việt phổ biến | Tên đường có QL, ĐT, TP | 1. Tuyến đi qua 'QL1A', 'TP.HCM', 'P.Bến Nghé'. | Đọc chuẩn: 'Quốc lộ một A', 'Thành phố Hồ Chí Minh', 'Phường Bến Nghé'. | P0 |
| **TC-VOI-019** | Chuẩn hóa cách đọc số nhà và ngõ ngách | Địa chỉ 'Số 12/45' ngõ | 1. Điểm đến trong ngõ hẻm. | Đọc chuẩn: 'Số mười hai, ngõ bốn mươi lăm'. | P1 |
| **TC-VOI-020** | Tự động tắt giọng nói khi xe đã dừng hẳn hành trình | Đã bấm kết thúc | 1. Dừng dẫn đường. | Không phát thêm bất kỳ câu nói tồn dư nào trong hàng đợi. | P0 |
| **TC-VOI-021** | Tốc độ đọc giọng nói vừa phải (Speech Rate = 1.0) | Cấu hình TTS | 1. Nghe câu dẫn đường phát ra. | Tốc độ đọc tự nhiên, không bị nói quá nhanh gây khó nghe khi lái xe. | P1 |
| **TC-VOI-022** | Cao độ giọng nói chuẩn (Pitch = 1.0) | Cấu hình TTS | 1. Nghe chất giọng phát ra. | Âm sắc tự nhiên, không bị méo tiếng. | P2 |
| **TC-VOI-023** | Phát âm cảnh báo đoạn đường hay có chốt kiểm tra | Dữ liệu cảnh báo | 1. Xe tiếp cận điểm nhắc nhở. | Phát âm nhẹ nhàng: 'Chú ý đoạn đường này.' | P2 |
| **TC-VOI-024** | Kiểm tra hoạt động TTS trên iOS Safari trong nền | Khóa màn hình máy | 1. Khóa máy khi đang dẫn đường. | Vẫn phát âm câu rẽ khi đến ngã ba/ngã tư theo quyền WebKit Audio. | P0 |
| **TC-VOI-025** | Kiểm tra hoạt động TTS trên Android Chrome | Android | 1. Lái xe trên thiết bị Android. | Giọng đọc Google Text-to-Speech tiếng Việt phát âm mượt mà. | P0 |
| **TC-VOI-026** | Thông báo khoảng cách còn lại mỗi 10km trên các chuyến đi xa | Chuyến đi > 50km | 1. Xe đi qua mốc 10km tiếp theo. | Thông báo: 'Còn 40 kilômét nữa đến đích.' | P2 |
| **TC-VOI-027** | Không phát thông báo rẽ khi xe đang đứng yên chờ đèn đỏ | Cách ngã rẽ 20m nhưng đang dừng | 1. Đứng yên chờ đèn đỏ 40s. | Không lặp lại câu 'Chuẩn bị rẽ' liên tục nhiều lần trong khi đứng yên. | P1 |
| **TC-VOI-028** | Xử lý khi danh sách voices tải bất đồng bộ (voiceschanged event) | Trình duyệt tải voice trễ | 1. Khởi động app khi `window.speechSynthesis.getVoices()` rỗng lúc đầu. | Bắt sự kiện `onvoiceschanged` và tự gán lại giọng Việt ngay khi danh sách nạp xong. | P0 |
| **TC-VOI-029** | Nút nghe thử giọng nói trong cài đặt | Mở bảng cài đặt âm thanh | 1. Bấm 'Nghe thử'. | Phát câu: 'RoadLink đồng hành cùng bạn trên mọi nẻo đường.' | P2 |
| **TC-VOI-030** | Bộ nhớ giải phóng các đối tượng SpeechSynthesisUtterance | Dẫn đường 2 giờ | 1. Sau 100 câu nói được phát. | Không có hiện tượng rò rỉ bộ nhớ (leak) từ các đối tượng utterance. | P1 |

---

## 8. KẾT NỐI PHẦN CỨNG HUD ESP32 QUA BLE (TC-BLE: 35 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BLE-001** | Mở bảng kết nối Bluetooth từ nút trên Topbar | Màn hình chính | 1. Bấm nút 'Kết nối thiết bị' (icon Bluetooth). | Mở Modal bảng kết nối BluetoothPanel với hình ảnh radar quét sóng và thông tin kết nối. | P0 |
| **TC-BLE-002** | Quét tìm thiết bị ESP32 xung quanh (BLE Scanning) | Mạch ESP32 đang bật | 1. Bấm 'Quét tìm thiết bị'. | Quét và hiển thị tên thiết bị 'RoadLink HUD' hoặc UUID dịch vụ trong danh sách. | P0 |
| **TC-BLE-003** | Kết nối thành công vào mạch ESP32 | Thiết bị trong tầm phủ | 1. Chọn thiết bị và kết nối. | Kết nối thành công, nút trên Topbar chuyển sang màu xanh lá với chấm xanh và text 'ESP32 đã kết nối'. | P0 |
| **TC-BLE-004** | Đóng gói và gửi bản tin tổng quan lộ trình (Route Overview Packet) | Vừa lập xong tuyến | 1. Bấm chỉ đường khi BLE đang nối. | Gửi gói tin nhị phân loại `route` chứa tổng cự ly (mét), tổng thời gian (giây) và số bước rẽ sang ESP32. | P0 |
| **TC-BLE-005** | Truyền gói tin chỉ dẫn khúc rẽ thời gian thực (Maneuver Packet) | Đang dẫn đường | 1. Xe di chuyển đến gần khúc rẽ. | ESP32 nhận gói tin loại `turn` chứa: Mã icon rẽ (1 byte), cự ly đếm lùi (mét), chuỗi text tên đường UTF-8. | P0 |
| **TC-BLE-006** | Hiển thị icon rẽ tương ứng trên màn hình OLED / TFT ESP32 | Màn hình HUD bật | 1. Ứng dụng báo rẽ trái. | Màn hình phần cứng vẽ icon mũi tên rẽ trái đồng bộ với màn hình điện thoại. | P0 |
| **TC-BLE-007** | Truyền gói tin tốc độ tức thời và tốc độ giới hạn | Xe đang chạy | 1. Xe thay đổi vận tốc. | Gửi định kỳ mỗi 500ms gói tin chứa tốc độ xe hiện tại và giới hạn tốc độ đoạn đường sang ESP32. | P0 |
| **TC-BLE-008** | Gửi gói tin cảnh báo camera phạt nguội sang HUD | Cách camera 300m | 1. Xe tiếp cận camera. | ESP32 nhận gói tin cảnh báo, màn hình HUD nhấp nháy icon Camera và hiển thị cự ly 300m. | P0 |
| **TC-BLE-009** | Gửi gói tin kết thúc hành trình khi bấm dừng hoặc đến đích | Dừng dẫn đường | 1. Bấm nút 'X' dừng dẫn đường trên điện thoại. | Gửi gói tin loại `stop`, màn hình ESP32 xóa sạch thông tin điều hướng và trở về màn hình chờ. | P0 |
| **TC-BLE-010** | Tự động xử lý khi mất kết nối BLE đột ngột (Link Drop) | Rút nguồn ESP32 | 1. ESP32 đột ngột mất điện khi xe đang chạy. | App tự chuyển trạng thái về Disconnected, dẫn đường trên điện thoại tiếp tục bình thường không bị đứng hình. | P0 |
| **TC-BLE-011** | Tự động kết nối lại khi thiết bị bật nguồn trở lại (Auto-Reconnect) | Bật lại nguồn ESP32 | 1. Cấp điện lại cho mạch ESP32. | App tự nhận diện và khôi phục kênh BLE, tiếp tục truyền dữ liệu đang dang dở. | P1 |
| **TC-BLE-012** | Tính toàn vẹn gói tin (Packet Checksum & Version Check) | Môi trường nhiễu sóng | 1. Gửi gói tin trong môi trường nhiều sóng 2.4GHz. | ESP32 kiểm tra header version `v:1` và độ dài gói; loại bỏ các gói tin bị lỗi bit hoặc thiếu byte. | P0 |
| **TC-BLE-013** | Mã hóa chuỗi tên đường bằng UTF-8 chuẩn | Tên đường có dấu tiếng Việt | 1. Gửi tên đường 'Đường Trần Hưng Đạo' sang ESP32. | ESP32 nhận mảng byte UTF-8 và hiển thị đúng tiếng Việt có dấu trên font đồ họa u8g2. | P0 |
| **TC-BLE-014** | Xử lý khi tên đường quá dài (> 32 ký tự) | Tên phố dài | 1. Gửi tên đường dài 45 ký tự. | Cắt bớt an toàn ở 32 byte hoặc cuộn chữ (marquee scrolling) trên HUD, không làm tràn buffer ESP32. | P1 |
| **TC-BLE-015** | Nút 'Ngắt kết nối' thủ công trên giao diện | Đang kết nối | 1. Bấm nút 'Ngắt kết nối' trong BluetoothPanel. | Chủ động đóng GATT connection, ESP32 quay về trạng thái sẵn sàng nhận kết nối mới. | P0 |
| **TC-BLE-016** | Bảo vệ MTU Size (Maximum Transmission Unit) | Kênh BLE | 1. Gửi gói tin kích thước lớn. | App tự động chia nhỏ gói tin (fragmentation) hoặc thỏa thuận MTU 512 bytes thành công. | P1 |
| **TC-BLE-017** | Gửi gói tin trạng thái pin điện thoại sang HUD (Phone Battery Sync) | Điện thoại pin 25% | 1. Đồng bộ định kỳ 1 phút. | Màn hình ESP32 hiển thị icon pin điện thoại còn 25%. | P2 |
| **TC-BLE-018** | Gửi gói tin đồng hồ thời gian thực (RTC Time Sync) | Mỗi lần kết nối | 1. Kết nối BLE thành công. | Gửi giờ hiện tại của điện thoại để đồng bộ đồng hồ trên mạch HUD. | P1 |
| **TC-BLE-019** | Kiểm tra quyền Bluetooth trên Web (Web Bluetooth API) | Chrome trên PC/Android | 1. Bấm quét thiết bị. | Bật cửa sổ chọn thiết bị bluetooth của trình duyệt chuẩn xác. | P0 |
| **TC-BLE-020** | Thông báo khi trình duyệt không hỗ trợ Web Bluetooth | Safari iOS WebKit | 1. Mở web trên Safari iPhone. | Hiển thị thông báo: 'Tính năng HUD Bluetooth cần ứng dụng RoadLink trên App Store hoặc trình duyệt WebBLE.' | P0 |
| **TC-BLE-021** | Hoạt động BLE qua Capacitor Native Plugin trên iOS | Bản cài đặt IPA iOS | 1. Mở kết nối trên app iPhone native. | Sử dụng CoreBluetooth kết nối trực tiếp với ESP32 với độ ổn định cao nhất. | P0 |
| **TC-BLE-022** | Độ trễ truyền gói tin BLE (Latency < 50ms) | Kết nối tốt | 1. Đo thời gian từ lúc bấm rẽ trên điện thoại đến khi icon sáng trên OLED. | Độ trễ dưới 50ms, mắt thường thấy hiển thị tức thì. | P0 |
| **TC-BLE-023** | Chống nghẽn hàng đợi gửi BLE (Queue Throttling) | Vận tốc xe thay đổi liên tục | 1. Cập nhật tốc độ 20 lần/giây. | Hệ thống chỉ giữ lại gói tốc độ mới nhất trong hàng đợi gửi, không làm tràn bộ đệm BLE. | P0 |
| **TC-BLE-024** | Gửi gói tin rung cảnh báo (Haptic Buzzer Trigger) | Xe sắp đến ngã rẽ 50m | 1. Đến khoảng cách rẽ gấp. | Gửi lệnh kích hoạt còi chip buzzer trên mạch ESP32 kêu 'tít tít' cảnh báo. | P1 |
| **TC-BLE-025** | Gửi gói tin chỉnh độ sáng màn hình HUD (Display Brightness) | Trời tối | 1. App chuyển sang Dark mode. | Gửi lệnh hạ độ sáng đèn nền HUD xuống 30% để không làm chói mắt tài xế ban đêm. | P2 |
| **TC-BLE-026** | Xử lý khi thiết bị ESP32 khác cùng tên xuất hiện | Hai mạch ESP32 bật cùng lúc | 1. Quét tìm kiếm. | Hiển thị danh sách kèm địa chỉ MAC / RSSI để người dùng chọn đúng xe của mình. | P1 |
| **TC-BLE-027** | Ghi nhớ địa chỉ MAC thiết bị đã ghép nối | Đã từng kết nối | 1. Khởi động lại app. | Tự động kết nối nhanh vào thiết bị quen thuộc mà không cần quét lại từ đầu. | P1 |
| **TC-BLE-028** | Cảnh báo khi sóng BLE quá yếu (RSSI < -90dBm) | Điện thoại đặt xa mạch | 1. Di chuyển máy ra xa 10m. | Biểu tượng sóng Bluetooth chuyển sang màu vàng cảnh báo tín hiệu yếu. | P2 |
| **TC-BLE-029** | Gói tin Ping giữ kết nối (Heartbeat Keepalive) | Xe đứng yên không có rẽ | 1. Xe dừng 3 phút. | Gửi ping mỗi 5 giây để đảm bảo kênh truyền BLE không bị hệ điều hành đóng nhầm. | P1 |
| **TC-BLE-030** | Kiểm tra mức tiêu hao năng lượng BLE trên iPhone | Kết nối liên tục 1 giờ | 1. Kiểm tra Battery usage. | BLE chỉ tiêu hao dưới 1% tổng dung lượng pin nhờ chế độ Low Energy. | P1 |
| **TC-BLE-031** | Gửi gói tin cảnh báo quá tốc độ sang HUD | Xe chạy quá tốc độ | 1. Xe vượt tốc độ giới hạn. | Gửi gói tin đặc biệt, màn hình HUD nhấp nháy số tốc độ màu đỏ kèm tiếng bíp. | P0 |
| **TC-BLE-032** | Hỗ trợ màn hình LED ma trận 8x32 trên ESP32 | Phần cứng LED ma trận | 1. Kết nối với module LED ma trận. | Gửi dữ liệu hiển thị tương thích với font chữ ma trận điểm. | P2 |
| **TC-BLE-033** | Kiểm tra tương thích firmware ESP32 v1.0 và v2.0 | Firmware cũ/mới | 1. Kết nối mạch chạy bản nạp cũ. | Tương thích ngược hoàn toàn nhờ cấu trúc gói tin có header version rõ ràng. | P0 |
| **TC-BLE-034** | Khôi phục luồng dữ liệu khi app vừa thoát khỏi cuộc gọi điện thoại | Có cuộc gọi đến | 1. Đàm thoại 1 phút xong quay lại. | Kênh BLE tiếp tục truyền ngay mà không cần ấn kết nối lại. | P0 |
| **TC-BLE-035** | Xử lý ngắt nguồn pin đột ngột của điện thoại | Điện thoại sập nguồn | 1. Điện thoại tắt. | ESP32 timeout sau 3 giây và tự động trở về màn hình chờ an toàn. | P1 |

---

## 9. GIAO DIỆN MOBILE, TRẢI NGHIỆM GOOGLE MAPS & TỐI ƯU IPHONE 13 (TC-MOB: 35 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-001** | Không bị khoảng hở đáy trên iPhone 13 (Zero Bottom Gap) | Thiết bị iPhone 13 Safari | 1. Mở ứng dụng ở chế độ toàn màn hình. | Bảng điều khiển đáy `.bottom-panel` khít sát mép dưới, đệm đúng khoảng an toàn Home Bar (`var(--safe-bottom)`). | P0 |
| **TC-MOB-002** | Khóa phóng to tự động khi chạm vào ô nhập văn bản (Disable Auto-Zoom) | iPhone 13 WebKit | 1. Chạm liên tục vào các ô input tìm kiếm và ô sửa lộ trình. | Bàn phím ảo bật lên mượt mà, màn hình KHÔNG bị tự động phóng to (nhờ `font-size: 16px !important` và viewport meta). | P0 |
| **TC-MOB-003** | Khóa cuộn trang toàn màn hình (Disable Rubber-band Viewport Scroll) | iPhone 13 | 1. Dùng ngón tay vuốt mạnh vào vùng trống ngoài bản đồ. | Toàn bộ ứng dụng cố định ở `100dvh`, không bị hiệu ứng nảy trang làm lộ nền trắng của Safari. | P0 |
| **TC-MOB-004** | Căn vị trí cụm nút điều khiển bản đồ nổi trên Bottom Panel | Thay đổi độ cao panel | 1. Quan sát cụm nút FAB (3D, Layers, Compass, Recenter). | Nút FAB luôn nằm cách đỉnh của Bottom Panel đúng 10px, tự động nổi lên khi panel cao lên mà không bị đè che khuất. | P0 |
| **TC-MOB-005** | Thanh kéo kéo thả Bottom Sheet (Pull Handle Interaction) | Bottom Panel mở | 1. Chạm vào thanh ngang màu xám ở đỉnh panel đáy và vuốt xuống. | Panel thu gọn xuống mức tối thiểu (collapsed) để nhường không gian quan sát bản đồ. | P1 |
| **TC-MOB-006** | Vuốt lên để mở lại Bottom Sheet đầy đủ | Đang thu gọn | 1. Vuốt ngược từ thanh kéo lên trên. | Panel mở rộng mượt mà trở lại trạng thái ban đầu. | P1 |
| **TC-MOB-007** | Khoảng cách an toàn tai thỏ / Dynamic Island ở thanh Topbar | iPhone 13 Notch | 1. Quan sát thanh tìm kiếm và nút BLE trên đỉnh màn hình. | Nằm gọn gàng bên dưới khu vực tai thỏ nhờ `padding-top: calc(x + var(--safe-top))`, không bị che mất nội dung. | P0 |
| **TC-MOB-008** | Chuẩn kích thước vùng chạm cảm ứng (Touch Target >= 44x44px) | Kiểm tra CSS | 1. Đo kích thước các nút bấm icon, nút back, nút đóng, nút đổi chiều. | Toàn bộ nút tương tác chính đều đạt kích thước tối thiểu 44x44px theo tiêu chuẩn thiết kế Apple HIG. | P1 |
| **TC-MOB-009** | Hiệu ứng phản hồi khi chạm (Active / Tap State) | Màn hình cảm ứng | 1. Chạm giữ vào một mục kết quả hoặc nút bấm. | Mục chuyển màu nền nhẹ (`#f1f3f4`), mang lại cảm giác chạm chân thực như ứng dụng native Google Maps. | P1 |
| **TC-MOB-010** | Trạng thái hiển thị khi bàn phím ảo bật lên | Chạm ô tìm kiếm | 1. Bàn phím xuất hiện đẩy chiều cao màn hình thu hẹp. | Bản đồ và danh sách gợi ý co giãn linh hoạt theo `dvh`, thanh tìm kiếm không bị đẩy trôi khỏi màn hình. | P0 |
| **TC-MOB-011** | Không bị đúp phím (Double Tap Zoom Delay 300ms) | Chạm nút bấm | 1. Chạm nhanh vào nút Bắt đầu. | Phản hồi ngay lập tức nhờ `touch-action: manipulation`, không có độ trễ 300ms của trình duyệt. | P0 |
| **TC-MOB-012** | Hiển thị hoàn hảo trên màn hình gập (Samsung Galaxy Z Fold) | Màn hình gập | 1. Mở màn hình ngoài nhỏ sang màn hình trong lớn. | Giao diện thích ứng tức thì với kích thước mới mà không cần khởi động lại app. | P2 |
| **TC-MOB-013** | Hiển thị hoàn hảo trên iPad / Máy tính bảng | iPad Safari | 1. Mở app trên iPad. | Thanh tìm kiếm và RouteInputs hiển thị ở dạng cột nổi bên trái (Sidebar) chuẩn phong cách Google Maps iPad. | P1 |
| **TC-MOB-014** | Tối ưu hóa độ phân giải hiển thị Retina (@2x, @3x) | Màn hình OLED Super Retina XDR | 1. Quan sát độ sắc nét của icon SVG và font chữ. | Hình ảnh cực kỳ sắc nét, không bị mờ nhòe. | P0 |
| **TC-MOB-015** | Thao tác vuốt từ mép trái để quay lại (Swipe to Go Back) | Màn hình con | 1. Vuốt nhẹ từ mép trái màn hình sang phải. | Quay lại màn hình trước đó giống trải nghiệm ứng dụng iOS gốc. | P1 |
| **TC-MOB-016** | Chống hiện tượng nháy trắng khi tải lại trang (FOUC Prevention) | Tải trang | 1. Bấm reload. | Nền màn hình có màu xám bản đồ ngay từ đầu, không bị chớp trắng gây nhức mắt. | P1 |
| **TC-MOB-017** | Khoảng cách cách đáy cho các nút nổi khi Bottom Panel đóng | Bottom panel đóng | 1. Quan sát nút Recenter và North. | Tự động hạ xuống cách đáy màn hình 24px + safe-area, đảm bảo dễ chạm bằng ngón cái. | P1 |
| **TC-MOB-018** | Bố cục xoay ngang trên ô tô (Landscape Dashboard Mount) | Gắn giá đỡ xoay ngang | 1. Xoay ngang điện thoại gắn trên taplo. | Banner chỉ dẫn dồn sang góc trái, bản đồ hiển thị rộng rãi ở giữa và phải, tốc độ to rõ. | P0 |
| **TC-MOB-019** | Thanh trạng thái hệ thống trong suốt (Transparent Status Bar) | iOS Capacitor | 1. Quan sát đỉnh màn hình. | Bản đồ tràn viền lên tận đỉnh, giờ và pin hiển thị đè nhẹ lên bản đồ thẩm mỹ cao. | P1 |
| **TC-MOB-020** | Kiểm tra tương thích phông chữ hệ thống SF Pro / Roboto / Be Vietnam Pro | Đọc nội dung text | 1. Quan sát các nhãn chữ tiếng Việt. | Không bị lỗi hiển thị ký tự (tofu '□') ở bất kỳ từ ngữ nào. | P0 |
| **TC-MOB-021** | Độ tương phản màu sắc đạt chuẩn WCAG AA | Kiểm tra màu sắc | 1. Đo tương phản giữa chữ và nền. | Tỷ lệ tương phản tối thiểu đạt 4.5:1, tài xế dễ dàng nhìn thấy dưới ánh nắng gắt. | P0 |
| **TC-MOB-022** | Hạn chế rung chấn khi xe đi qua ổ gà (Vibration damping in UI) | Xe đi đường xóc | 1. Điện thoại rung lắc mạnh trên giá đỡ. | Giao diện không bị nhảy nút hay kích hoạt nhầm các cử chỉ nhạy cảm. | P1 |
| **TC-MOB-023** | Chế độ một tay (One-handed Usability) | Cầm máy bằng tay phải | 1. Thử chạm nút Recenter và nút Bắt đầu bằng ngón cái. | Nằm trong vùng với tay thuận tiện của ngón tay cái mà không cần với lên đỉnh. | P1 |
| **TC-MOB-024** | Thông báo toast nổi nhẹ nhàng (Snackbars / Toasts) | Sao chép vị trí | 1. Bấm chia sẻ/sao chép. | Toast nổi lên ở phần dưới và tự động biến mất sau 2.5 giây, không che các nút bấm chính. | P1 |
| **TC-MOB-025** | Hiển thị biểu tượng tải xoay tròn màu xanh Google | Khi đang tải OSRM | 1. Quan sát vòng xoay spinner. | Vòng quay vật liệu phẳng Material Design màu xanh `#1a73e8`. | P2 |
| **TC-MOB-026** | Chống cuộn trang khi đang kéo thanh trượt âm lượng hoặc zoom | Chạm thanh trượt | 1. Kéo điều chỉnh. | Chỉ thay đổi giá trị thanh trượt, trang web đứng yên. | P1 |
| **TC-MOB-027** | Hỗ trợ Dark Theme hoàn chỉnh cho tất cả các thẻ Card | Dark Mode | 1. Mở PlaceCard, RouteSummary, RoadDataPanel. | Tất cả các thẻ chuyển màu nền xám tối `#202124`, chữ trắng rõ nét. | P1 |
| **TC-MOB-028** | Kích thước nút bấm Bắt đầu (Call to Action Button) | Preview Mode | 1. Quan sát nút 'Bắt đầu'. | Nút lớn dạng viên thuốc tròn, chiều cao 48px, chữ to nổi bật trên nền xanh lá `#1e8e3e`. | P0 |
| **TC-MOB-029** | Ẩn các chi tiết thừa khi đang ở chế độ xem dẫn đường tốc độ cao | Xe chạy > 60km/h | 1. Tăng tốc. | Giao diện tối giản tối đa để người lái không bị phân tâm, chỉ giữ lại banner rẽ và tốc độ. | P1 |
| **TC-MOB-030** | Chạm ra ngoài để đóng menu gợi ý (Click Outside to Dismiss) | Menu gợi ý đang mở | 1. Chạm vào vùng bản đồ phía sau. | Menu gợi ý tự động đóng lại. | P0 |
| **TC-MOB-031** | Độ mượt mà của hiệu ứng chuyển cảnh (60 FPS Transitions) | Chuyển giữa các mode | 1. Chuyển từ Explore sang Preview sang Navigation. | Hiệu ứng trượt slide/fade mượt mà đạt chuẩn 60 khung hình/giây. | P0 |
| **TC-MOB-032** | Cố định thanh Search Bar khi danh sách gợi ý cuộn dài | Tìm thấy 10 kết quả | 1. Cuộn danh sách kết quả xuống dưới. | Thanh Search Bar ghim cố định ở đỉnh, chỉ có danh sách bên dưới cuộn. | P0 |
| **TC-MOB-033** | Trạng thái Empty State đẹp mắt khi danh sách rỗng | Chưa có địa điểm đã lưu | 1. Mở mục Yêu thích khi chưa lưu gì. | Hiển thị hình minh họa nhẹ nhàng và dòng chữ 'Chưa có địa điểm nào được lưu.' | P2 |
| **TC-MOB-034** | Hỗ trợ cảm ứng đa điểm (Multi-touch Disambiguation) | Chạm nhiều ngón | 1. Đặt ngón tay lên nút trong khi ngón khác chạm bản đồ. | Xử lý chuẩn xác, không bị kẹt gesture của bản đồ. | P1 |
| **TC-MOB-035** | Tuân thủ hướng dẫn thiết kế Human Interface Guidelines (HIG) của Apple | Toàn bộ app | 1. Đánh giá tổng thể giao diện trên iOS. | Trải nghiệm mượt mà, trực quan như một ứng dụng iOS native cao cấp. | P0 |

---

## 10. XỬ LÝ NGOẠI LỆ, MẤT MẠNG & DỮ LIỆU OFFLINE (TC-EDG: 30 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-EDG-001** | Chuyển đổi mượt mà khi mạng bị mất hoàn toàn giữa hành trình | Đang dẫn đường | 1. Tắt toàn bộ Wifi và 4G/5G khi đang chạy xe. | Hành trình không bị ngắt quãng, xe vẫn tiếp tục bám theo dữ liệu tuyến đường và dữ liệu offline đã tải trước đó. | P0 |
| **TC-EDG-002** | Khôi phục kết nối mạng và đồng bộ lại tự động | Bật lại mạng | 1. Bật lại 4G sau khi mất mạng. | Ứng dụng tự động khôi phục kết nối ngầm, không hiện popup làm phiền người lái xe. | P1 |
| **TC-EDG-003** | Khởi động app khi không có mạng (Cold Start Offline) | Không có mạng | 1. Mở app khi offline hoàn toàn. | Giao diện mở bình thường, dữ liệu các địa điểm yêu thích và dữ liệu OSM đóng gói sẵn vẫn hiển thị đầy đủ. | P0 |
| **TC-EDG-004** | Tránh rò rỉ bộ nhớ khi dẫn đường tuyến đường dài nhiều giờ | Chạy xe liên tục 4h | 1. Dẫn đường quãng đường 300km trong nhiều giờ. | Bộ nhớ RAM ổn định, không bị hiện tượng app tự tắt (crash) do tích lũy biến rác. | P0 |
| **TC-EDG-005** | Xử lý khi người dùng đổi ứng dụng khác rồi quay lại (Background & Resume) | Đang dẫn đường | 1. Nhấn nút Home chuyển sang nghe gọi điện thoại 2 phút.<br>2. Quay lại app RoadLink. | Bản đồ lập tức căn lại vị trí GPS mới nhất của xe, tiếp tục dẫn đường chuẩn xác mà không cần bắt đầu lại. | P0 |
| **TC-EDG-006** | Xử lý khi tắt mở lại quyền Bluetooth trong lúc đang kết nối | Đang kết nối BLE | 1. Vào Control Center tắt Bluetooth rồi bật lại. | App ghi nhận sự kiện ngắt kết nối, nút chuyển sang màu xám và tự động quét kết nối lại khi Bluetooth bật. | P1 |
| **TC-EDG-007** | Nhận diện GPS nhảy đột biến do phản xạ sóng nhà cao tầng (GPS Jitter) | Vùng nhà cao tầng | 1. Tọa độ nhảy vọt 500m rồi nhảy về vị trí cũ trong 1 giây. | Bộ lọc sai số phát hiện biến động bất thường, giữ nguyên vị trí trước đó, không gây xoay lật camera. | P0 |
| **TC-EDG-008** | Tuân thủ tiêu chuẩn không sử dụng dữ liệu mô phỏng (No Synthetic Demo Data) | Kiểm tra build production | 1. Chạy kịch bản audit `node scripts/audit-production-data.mjs`. | Báo cáo trả về `syntheticRoadObjectsBundled: false`, không tồn tại bất kỳ tọa độ hardcode giả lập nào. | P0 |
| **TC-EDG-009** | Xử lý khi đi vào vùng hoàn toàn không có sóng GPS trong 5 phút | Đỗ xe tầng hầm B3 | 1. Xe dừng sâu trong hầm. | App hiển thị trạng thái chờ GPS lịch sự, không bị crash hay đơ giao diện. | P0 |
| **TC-EDG-010** | Xử lý khi thiết bị bị quá nhiệt (Thermal Throttling) | Máy nóng khi gắn kính lái dưới nắng | 1. CPU máy bị hạ xung do nhiệt độ cao. | App tự động giảm tần số render 3D để hạ nhiệt và bảo vệ thiết bị. | P1 |
| **TC-EDG-011** | Xử lý khi máy nhận cuộc gọi đến làm gián đoạn âm thanh | Đang có giọng nói dẫn đường | 1. Có cuộc gọi đến. | Giọng nói tạm dừng ngay lập tức, nhường toàn quyền micro và loa cho cuộc đàm thoại. | P0 |
| **TC-EDG-012** | Xử lý khi OSRM API trả mã lỗi 400 hoặc 500 | Máy chủ OSRM trục trặc | 1. Máy chủ trả HTTP 500. | App bắt lỗi try-catch chuẩn, hiển thị thông báo nhẹ và cho phép thử lại sau 3 giây. | P0 |
| **TC-EDG-013** | Xử lý khi Nominatim geocoder trả về kết quả rỗng | Tìm từ khóa lạ | 1. Geocoder trả `[]`. | Xử lý mượt mà, không sinh lỗi `undefined is not an object`. | P0 |
| **TC-EDG-014** | Xử lý khi người dùng ấn nút Bắt đầu liên tục 10 lần (Double-click Spam) | Màn hình Preview | 1. Nhấp liên tục vào nút Bắt đầu. | Chỉ xử lý lần bấm đầu tiên, khóa debouncing ngăn việc khởi tạo nhiều phiên dẫn đường trùng lặp. | P0 |
| **TC-EDG-015** | Xử lý khi đổi điểm đến ngay giữa lúc đang dẫn đường | Đang dẫn đường | 1. Chạm tìm một địa điểm khác và bấm Chỉ đường. | Hành trình cũ tự động dừng an toàn và chuyển sang tính lộ trình tới điểm mới. | P1 |
| **TC-EDG-016** | Xử lý khi dung lượng ổ cứng thiết bị đầy 100% (Storage Full) | Bộ nhớ máy đầy | 1. Cố gắng ghi LocalStorage khi quota bị đầy. | Bắt ngoại lệ `QuotaExceededError`, app tiếp tục chạy bình thường mà không bị crash. | P1 |
| **TC-EDG-017** | Xử lý khi người dùng đổi múi giờ thiết bị | Đang dẫn đường | 1. Chuyển múi giờ máy từ GMT+7 sang GMT+9. | Giờ đến nơi (ETA Clock) tự động cập nhật theo múi giờ mới chính xác. | P2 |
| **TC-EDG-018** | Chống đóng ứng dụng ngoài ý muốn khi chạm vào góc cạnh màn hình | Cầm máy trên tay | 1. Lòng bàn tay chạm nhẹ vào viền màn hình (Palm Rejection). | Không bị nhận diện nhầm là cú chạm chọn điểm trên bản đồ. | P1 |
| **TC-ROD-019-E** | Xử lý khi file shard OSM bị hỏng dữ liệu mạng khi tải | Tải shard lỗi mạng | 1. Giả lập tải về file JSON bị thiếu nửa chừng. | Trình nạp shard phát hiện JSON không hợp lệ, bỏ qua shard lỗi và tiếp tục hoạt động an toàn. | P1 |
| **TC-EDG-020** | Xử lý chuyển đổi kết nối giữa Wifi và 4G liên tục khi xe di chuyển ra khỏi nhà | Lái xe rời khỏi nhà | 1. Xe chạy khỏi tầm sóng Wifi gia đình, chuyển sang 4G. | Không bị đứt luồng định vị và dẫn đường, các kết nối HTTP tự gửi lại trơn tru. | P0 |
| **TC-EDG-021** | Xử lý khi tốc độ xe vượt quá 200 km/h (Tàu cao tốc / Máy bay) | Di chuyển tốc độ cao | 1. Tọa độ thay đổi với vận tốc 250 km/h. | Đồng hồ hiển thị số tốc độ chuẩn, hệ thống tự động giãn tầm camera nhìn xa hơn. | P2 |
| **TC-EDG-022** | Xử lý khi tọa độ điểm đến trùng khớp với điểm đi (Distance = 0) | Chọn trùng tọa độ | 1. Chọn điểm xuất phát và điểm đến cùng 1 tọa độ. | Thông báo: 'Điểm đến trùng với điểm xuất phát.' | P1 |
| **TC-EDG-023** | Xử lý khi người dùng bấm dừng và bắt đầu lại ngay lập tức | Vừa bấm dừng | 1. Bấm 'X' dừng rồi bấm ngay 'Bắt đầu' trong 0.5s. | Trạng thái quản lý nhất quán, không xảy ra race condition giữa dừng và chạy. | P1 |
| **TC-EDG-024** | Đảm bảo không phát sinh Unhandled Promise Rejection | Chạy kiểm tra console | 1. Theo dõi console log suốt quá trình sử dụng. | Không có bất kỳ cảnh báo đỏ nào về Unhandled Rejection. | P0 |
| **TC-EDG-025** | Đảm bảo không phát sinh Warning về Memory Leak trong React | Theo dõi React Profiler | 1. Unmount các component khi chuyển view. | Tất cả các listener, timeout, interval đều được dọn dẹp sạch trong `useEffect cleanup`. | P0 |
| **TC-EDG-026** | Xử lý khi thiết bị bật chế độ máy bay (Airplane Mode) | Bật Airplane Mode | 1. Bật Airplane Mode. | App thông báo rõ ràng về việc mạng và bluetooth bị tắt. | P1 |
| **TC-EDG-027** | Chống treo ứng dụng khi nhận được hàng nghìn event di chuyển chuột/chạm mỗi giây | Kiểm tra stress test | 1. Giả lập spam touch events. | Giao diện không bị đóng băng (freeze), duy trì khả năng đáp ứng dưới 16ms. | P1 |
| **TC-EDG-028** | Kiểm tra hiển thị khi thu phóng chữ trong trợ năng hệ thống (Dynamic Type) | Bật chữ to trong iOS Settings | 1. Tăng cỡ chữ lên mức lớn nhất. | Các dòng chữ quan trọng co giãn hợp lý, không bị tràn cắt vỡ khung layout. | P1 |
| **TC-EDG-029** | Tự động khôi phục giao diện khi xoay màn hình nhiều lần liên tiếp | Xoay máy liên tục | 1. Xoay máy dọc ngang 5 lần trong 3 giây. | Bản đồ và giao diện ổn định ở vị trí cuối cùng, không bị lệch khung nhìn. | P1 |
| **TC-EDG-030** | Xác nhận ứng dụng không chứa bất kỳ lỗ hổng bảo mật nào trong file `package.json` | Audit npm | 1. Chạy `npm audit`. | 0 lỗ hổng nghiêm trọng (zero high/critical vulnerabilities). | P0 |

---

## 11. LƯU TRỮ CỤC BỘ & QUẢN LÝ ĐỊA ĐIỂM YÊU THÍCH (TC-DAT: 25 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DAT-001** | Lưu cài đặt bật/tắt giọng nói qua các phiên sử dụng | Màn hình chính | 1. Bấm tắt giọng nói.<br>2. Đóng ứng dụng và mở lại. | Trạng thái tắt giọng nói vẫn được ghi nhớ (`roadlink.voice` = false). | P1 |
| **TC-DAT-002** | Lưu danh sách địa điểm yêu thích vào LocalStorage | Đang xem địa điểm | 1. Bấm icon Lưu địa điểm 'Nhà riêng'.<br>2. Tắt app, mở lại. | Địa điểm 'Nhà riêng' xuất hiện trong danh mục điểm đến quen thuộc ở màn hình chính. | P0 |
| **TC-DAT-003** | Xóa địa điểm khỏi danh sách yêu thích | Có danh sách đã lưu | 1. Bấm bỏ lưu một địa điểm. | Địa điểm biến mất khỏi danh sách yêu thích và LocalStorage được cập nhật ngay lập tức. | P1 |
| **TC-DAT-004** | Lưu bộ lọc dữ liệu đường bộ | RoadDataPanel | 1. Tắt lọc biển báo, chỉ để lại camera.<br>2. Mở lại app. | Bộ lọc giữ nguyên tùy chọn cá nhân hóa của người dùng. | P2 |
| **TC-DAT-005** | Giữ chế độ xem 3D hoặc 2D sau khi khởi động lại | Cài đặt bản đồ | 1. Bật chế độ 3D.<br>2. Tải lại trang/app. | Bản đồ tự động vào chế độ 3D theo sở thích của người dùng. | P1 |
| **TC-DAT-006** | Cấu trúc dữ liệu địa điểm yêu thích trong LocalStorage | Kiểm tra DevTools | 1. Kiểm tra key `roadlink.favorites`. | Chuỗi JSON hợp lệ chứa mảng các object: `{ id, name, lat, lng, address, timestamp }`. | P0 |
| **TC-DAT-007** | Tự động sửa lỗi khi chuỗi LocalStorage bị hỏng cú pháp JSON | Giả lập sửa thủ công key lỗi | 1. Gán `roadlink.favorites = '{invalid-json'`.<br>2. Mở app. | App bắt lỗi parse JSON, khởi tạo lại mảng rỗng `[]` an toàn mà không bị crash. | P0 |
| **TC-DAT-008** | Lưu lịch sử tìm kiếm gần đây (Recent Searches) | Đã tìm 3 địa điểm | 1. Chạm vào ô tìm kiếm. | Hiển thị 3 địa điểm vừa tìm kiếm trước đó để chọn nhanh. | P1 |
| **TC-DAT-009** | Xóa từng mục trong lịch sử tìm kiếm gần đây | Có lịch sử tìm | 1. Bấm icon 'X' cạnh mục lịch sử. | Mục đó biến mất khỏi lịch sử tìm kiếm. | P2 |
| **TC-DAT-010** | Xóa toàn bộ lịch sử tìm kiếm gần đây | Có lịch sử | 1. Bấm nút 'Xóa toàn bộ lịch sử'. | Danh sách lịch sử được làm trống hoàn toàn. | P2 |
| **TC-DAT-011** | Giới hạn số lượng địa điểm lưu trữ gần đây (Tối đa 10 mục) | Tìm 15 địa điểm liên tiếp | 1. Tìm liên tục 15 địa điểm mới. | Chỉ giữ lại 10 mục tìm kiếm mới nhất (FIFO queue), tự đẩy các mục cũ đi. | P1 |
| **TC-DAT-012** | Lưu cài đặt phương tiện di chuyển mặc định | Chọn chế độ Xe máy | 1. Chọn Xe máy làm phương tiện quen thuộc.<br>2. Khởi động lại app. | Khi lập tuyến mới, tab Xe máy tự động được chọn sẵn. | P1 |
| **TC-DAT-013** | Khả năng tương thích qua các phiên bản nâng cấp dữ liệu (Schema Migration) | Nâng cấp từ v1 lên v2 | 1. Dữ liệu local lưu theo chuẩn cũ. | Logic tự động nhận diện và nâng cấp lên schema mới trơn tru. | P1 |
| **TC-DAT-014** | Bảo mật dữ liệu cá nhân cục bộ | Kiểm tra mã nguồn | 1. Kiểm tra lưu trữ. | Chỉ lưu trữ các điểm yêu thích trên máy người dùng, không bao giờ gửi danh sách này lên server bên thứ ba. | P0 |
| **TC-DAT-015** | Sao lưu dữ liệu yêu thích ra file JSON (Export Favorites) | Có danh sách đã lưu | 1. Bấm 'Xuất danh sách yêu thích'. | Tải về file `roadlink-favorites.json` chuẩn định dạng. | P2 |
| **TC-DAT-016** | Khôi phục dữ liệu yêu thích từ file JSON (Import Favorites) | Có file sao lưu | 1. Chọn nạp file sao lưu. | Danh sách địa điểm được nhập lại đầy đủ và hiển thị ngay trên bản đồ. | P2 |
| **TC-DAT-017** | Kiểm tra dung lượng chiếm dụng của LocalStorage | Lưu 50 địa điểm | 1. Đo dung lượng byte trong storage. | Dung lượng chiếm dụng dưới 200KB, cách xa giới hạn 5MB của trình duyệt. | P1 |
| **TC-DAT-018** | Đồng bộ trạng thái giữa nhiều Tab trình duyệt (Storage Event Sync) | Mở 2 tab trên PC | 1. Tab A thêm một địa điểm yêu thích. | Tab B tự động cập nhật danh sách địa điểm mới thông qua sự kiện `window.addEventListener('storage')`. | P2 |
| **TC-DAT-019** | Lưu tùy chọn bật/tắt hiển thị thước tỷ lệ bản đồ | Cài đặt hiển thị | 1. Đổi cài đặt. | Lựa chọn được ghi nhớ bền vững. | P2 |
| **TC-DAT-020** | Lưu tùy chọn khoảng cách cảnh báo camera (500m / 300m / 100m) | Cài đặt cảnh báo | 1. Đặt khoảng cách cảnh báo là 300m. | Hệ thống chỉ phát cảnh báo khi xe tiến vào phạm vi 300m đúng cấu hình. | P1 |
| **TC-DAT-021** | Tự động làm sạch dữ liệu cache tạm khi đóng ứng dụng | Đóng app | 1. Thoát app. | Các biến trạng thái bộ nhớ tạm trong RAM được giải phóng, chỉ giữ lại dữ liệu bền vững trong storage. | P0 |
| **TC-DAT-022** | Khôi phục dữ liệu mặc định khi người dùng bấm 'Đặt lại cài đặt' | Cài đặt chung | 1. Bấm 'Khôi phục cài đặt gốc'. | Xóa toàn bộ cấu hình tùy biến, đưa mọi thiết lập về trạng thái xuất xưởng chuẩn. | P1 |
| **TC-DAT-023** | Lưu trạng thái chấp thuận điều khoản vị trí và an toàn giao thông | Lần đầu dùng app | 1. Bấm 'Tôi đồng ý' trên hộp thoại an toàn lái xe. | Ghi nhớ trạng thái để không hiển thị lại hộp thoại gây phiền hà trong các lần mở sau. | P1 |
| **TC-DAT-024** | Lưu tên thiết bị ESP32 ưa thích để ưu tiên kết nối | Đã từng ghép đôi | 1. Ghép đôi thiết bị 'RoadLink HUD 01'. | Lần quét sau sẽ tự động ưu tiên kết nối thiết bị này trước. | P1 |
| **TC-DAT-025** | Đảm bảo tính toàn vẹn dữ liệu khi trình duyệt bị tắt đột ngột lúc đang ghi storage | Crash test | 1. Đột ngột ngắt nguồn đúng lúc bấm Lưu. | Không làm hỏng cấu trúc dữ liệu tổng thể của ứng dụng. | P1 |

---

## 12. HIỆU NĂNG, TIÊU THỤ PIN & TIÊU CHUẨN PHI CHỨC NĂNG (TC-NFR: 20 Test Cases)

| Mã Test Case | Tiêu Đề / Mục Tiêu | Điều Kiện Tiên Quyết | Các Bước Thực Hiện | Kết Quả Kỳ Vọng | Mức Độ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-NFR-001** | Tốc độ tải và hiển thị bản đồ lần đầu (Time to Interactive - TTI) | Mạng 4G chuẩn | 1. Mở ứng dụng từ trạng thái đóng hoàn toàn. | Bản đồ hiển thị sẵn sàng tương tác trong dưới **1.8 giây**. | P0 |
| **TC-NFR-002** | Tỷ lệ khung hình render bản đồ (Frame Rate 60 FPS) | Thiết bị iPhone 13 | 1. Di chuyển xe, xoay bản đồ 3D liên tục trong 1 phút. | Duy trì ổn định từ 55 - 60 FPS, không có hiện tượng giật cục (frame drop). | P0 |
| **TC-NFR-003** | Tiêu thụ pin khi dẫn đường liên tục (Battery Consumption) | Mức pin 100% | 1. Dẫn đường GPS + Màn hình sáng liên tục trong 30 phút. | Tiêu thụ pin không vượt quá 6% - 8% cho 30 phút hoạt động liên tục. | P1 |
| **TC-NFR-004** | Dung lượng bộ cài đặt ứng dụng iOS (IPA Size) | Xcode Release Build | 1. Kiểm tra kích thước file IPA tạo ra bởi GitHub Actions. | Kích thước file IPA tối ưu dưới **25 MB**, tải về và cài đặt nhanh chóng. | P1 |
| **TC-NFR-005** | Tiêu chuẩn bảo mật quyền riêng tư vị trí (Location Privacy) | Phân tích Network traffic | 1. Theo dõi các gói tin HTTP gửi đi khi người dùng di chuyển. | Tọa độ GPS của người dùng chỉ xử lý nội bộ trên máy, KHÔNG gửi lén lút về bất kỳ máy chủ theo dõi bên thứ ba nào. | P0 |
| **TC-NFR-006** | Thời gian tính toán lộ trình OSRM (Routing Latency) | Mạng 4G bình thường | 1. Tính tuyến đường cự ly 20km. | Thời gian phản hồi từ lúc bấm tới khi vẽ xong tuyến dưới 800ms. | P0 |
| **TC-NFR-007** | Dung lượng bộ nhớ RAM khi hoạt động thông thường (RAM Footprint) | Đo bằng Xcode Instruments | 1. Theo dõi mức chiếm dụng RAM. | Bộ nhớ RAM tiêu hao dưới **120 MB**, không gây tràn bộ nhớ trên các dòng máy cũ. | P0 |
| **TC-NFR-008** | Tối ưu hóa dung lượng truyền tải mạng (Network Payload) | Tải một trang bản đồ | 1. Đo tổng dung lượng tải tài nguyên ban đầu. | Toàn bộ mã nguồn JS/CSS gzipped dưới 600 KB. | P1 |
| **TC-NFR-009** | Độ trễ phản hồi cảm ứng khi bấm các nút (Input Latency) | Kiểm tra phản hồi UI | 1. Đo thời gian từ cú chạm ngón tay đến khi giao diện đổi trạng thái. | Độ trễ dưới 50ms, cho phản xạ tức thời tuyệt vời. | P0 |
| **TC-NFR-010** | Thời gian tự động tìm lại đường khi đi chệch (Reroute Latency) | Xe vừa chệch đường | 1. Đo thời gian từ lúc phát hiện chệch đến khi có tuyến mới. | Hoàn thành toàn bộ quy trình tính toán và vẽ lại đường trong dưới 1.5 giây. | P0 |
| **TC-NFR-011** | Khả năng chịu tải rung giật phần cứng (Hardware Shock Resistance) | Xe máy chạy đường xóc | 1. Lắp máy trên xe chạy qua gờ giảm tốc. | Không bị ngắt kết nối BLE, cảm biến la bàn không bị treo đơ. | P1 |
| **TC-NFR-012** | Tiêu chuẩn đồ họa không bị giật lag màn hình (No Jitter / V-Sync) | Màn hình 120Hz ProMotion | 1. Kiểm tra trên iPhone 13 Pro. | Đồng bộ hoàn hảo với tần số quét ProMotion 120Hz cho độ mượt mà cao nhất. | P1 |
| **TC-NFR-013** | Tính sẵn sàng cao của hệ thống ngói bản đồ (Tile High Availability) | Dịch vụ OpenFreeMap | 1. Đánh giá tỷ lệ thành công khi tải ngói. | Tỷ lệ tải ngói thành công đạt trên 99.9%. | P0 |
| **TC-NFR-014** | Khả năng tương thích trình duyệt (Browser Compatibility) | Các trình duyệt phổ biến | 1. Kiểm tra trên Safari Mobile, Chrome Mobile, Samsung Internet, Edge. | 100% các tính năng hoạt động đồng nhất trên tất cả các trình duyệt hiện đại. | P0 |
| **TC-NFR-015** | Tiêu chuẩn bảo mật Content Security Policy (CSP) | Kiểm tra header web | 1. Kiểm tra các quy tắc kết nối tài nguyên. | Chỉ cho phép tải kết nối từ các domain định sẵn: OpenFreeMap, OSRM, Nominatim, không có lỗ hổng chèn mã độc. | P0 |
| **TC-NFR-016** | Tiêu chuẩn trải nghiệm người dùng (Google Maps UX Fidelity) | So sánh trực tiếp | 1. Đặt 2 máy chạy RoadLink và Google Maps cạnh nhau. | Cảm giác vuốt chạm, bố cục thẻ, thanh tìm kiếm, màu sắc tuyến đường và âm thanh tương đồng > 98%. | P0 |
| **TC-NFR-017** | Tiêu chuẩn đóng gói mã nguồn (Zero Dead Code / Tree Shaking) | Kiểm tra bundle Vite | 1. Phân tích `dist/assets`. | Mã nguồn được loại bỏ triệt để các thư viện thừa, tối ưu hóa kích thước tối đa. | P1 |
| **TC-NFR-018** | Độ ổn định không lỗi Crash trong 24 giờ thử nghiệm liên tục (MTBF) | Chạy tự động 24h | 1. Kịch bản chạy mô phỏng 24 giờ liên tục. | Không xảy ra bất kỳ lỗi crash nào (Zero crashes in 24 hours). | P0 |
| **TC-NFR-019** | Hỗ trợ tiêu chuẩn an toàn khi lái xe (Driver Safety Standard) | Lái xe thực tế | 1. Đánh giá mức độ gây phân tâm. | Mọi thông tin quan trọng đều được đọc qua giọng nói và hiển thị to rõ chỉ với 1 cái liếc mắt nhanh (< 1 giây). | P0 |
| **TC-NFR-020** | Tuân thủ quy chuẩn pháp luật đường bộ Việt Nam | Đánh giá quy định | 1. Kiểm tra các quy định cảnh báo và dẫn đường. | Hệ thống khuyến cáo người dùng tuân thủ biển báo thực tế trên đường, đặt an toàn lên hàng đầu. | P0 |

---

## TỔNG KẾT & MA TRẬN TRUY XUẤT (TRACEABILITY MATRIX)

### 1. Phân Bổ Số Lượng Theo Phân Hệ
| STT | Phân Hệ Kiểm Thử | Mã Phân Hệ | Số Lượng Test Cases | Tỷ Lệ |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Tìm Kiếm & Khám Phá Địa Điểm | **TC-SEA** | 35 | 8.4% |
| 2 | Lập Lộ Trình & Chọn Phương Tiện | **TC-ROU** | 40 | 9.6% |
| 3 | Dẫn Đường Turn-by-Turn Thời Gian Thực | **TC-NAV** | 45 | 10.8% |
| 4 | Định Vị GPS, Độ Chính Xác & La Bàn Cảm Biến | **TC-GEO** | 35 | 8.4% |
| 5 | Bản Đồ MapLibre, Camera 3D Cockpit & Cử Chỉ | **TC-MAP** | 40 | 9.6% |
| 6 | Dữ Liệu Đường OSM, Giới Hạn Tốc Độ & Camera Phạt Nguội | **TC-ROD** | 45 | 10.8% |
| 7 | Giọng Nói Tiếng Việt TTS & Phát Âm Cảnh Báo | **TC-VOI** | 30 | 7.2% |
| 8 | Kết Nối Phần Cứng HUD ESP32 Qua BLE | **TC-BLE** | 35 | 8.4% |
| 9 | Giao Diện Mobile, Trải Nghiệm Google Maps & Tối Ưu iPhone 13 | **TC-MOB** | 35 | 8.4% |
| 10 | Xử Lý Ngoại Lệ, Mất Mạng & Dữ Liệu Offline | **TC-EDG** | 30 | 7.2% |
| 11 | Lưu Trữ Cục Bộ & Quản Lý Địa Điểm Yêu Thích | **TC-DAT** | 25 | 6.0% |
| 12 | Hiệu Năng, Tiêu Thụ Pin & Tiêu Chuẩn Phi Chức Năng | **TC-NFR** | 20 | 4.8% |
| **TỔNG** | **Toàn Bộ Hệ Thống RoadLink** | **FULL** | **415** | **100%** |

---

### 2. Phân Bổ Theo Mức Độ Ưu Tiên (Priority)
- **P0 (Critical / Blocker):** **185 Test Cases** (44.6%) — Bắt buộc phải vượt qua 100% trước bất kỳ bản build Release nào.
- **P1 (High / Major):** **165 Test Cases** (39.8%) — Đảm bảo trải nghiệm người dùng hoàn hảo, bảo mật và khả năng phục hồi lỗi.
- **P2 (Medium / Minor):** **65 Test Cases** (15.6%) — Các tiện ích mở rộng, tối ưu hóa giao diện nâng cao và trường hợp sử dụng hiếm gặp.

---

### 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. **100% kịch bản P0** phải đạt trạng thái `PASS`.
2. **>= 98% kịch bản P1** phải đạt trạng thái `PASS`.
3. Không tồn tại bất kỳ lỗi nghiêm trọng (Critical) nào liên quan đến rò rỉ bộ nhớ, tính toán sai lộ trình hoặc crash app trên iOS và Android.
