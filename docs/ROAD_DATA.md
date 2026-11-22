# Dữ liệu đường và cảnh báo

Cập nhật ngày 22/11/2026. App có chế độ mô phỏng xe di chuyển do người dùng yêu cầu: phát vị trí dọc tuyến OSRM thật, ghi rõ mô phỏng, không thay GPS thiết bị và không gửi vị trí đó qua BLE. Không tạo biển/camera/điểm đường bộ giả; không có mock dịch vụ/GPS/BLE/voice hoặc fixture. Kiểm tra dùng phép tính thuần, file OSM nguồn và dịch vụ mạng thật.

## Nguồn đang tích hợp

Ưu tiên gói **OSM Việt Nam từ Geofabrik ngày 20/11/2026**, ở `public/data/vn-osm-20261120/`. Nguồn PBF, checksum, giấy phép và attribution được ghi trong manifest. Script dựng gói: `scripts/build-vietnam-road-pack.py`.

| Nội dung | Số đối tượng duy nhất trong gói |
| --- | ---: |
| OSM way có một hoặc nhiều tag `maxspeed*` | 45.059 |
| Tổng điểm dữ liệu | 72.759 |
| Nhóm `traffic_signals` | 8.210 |
| Nhóm `crossing` | 51.033 |
| Nhóm `level_crossing` | 6.252 |
| Nhóm `traffic_calming` | 6.060 |
| `man_made=surveillance` | 303 |
| `traffic_sign` | 808 |
| Nhóm `hazard` | 19 |
| `give_way` | 19 |
| `stop` | 11 |
| `speed_camera` | 43 |
| `motorway_junction` có tag liên quan | 1 |

Đây là số đối tượng trong nguồn OSM, không phải số biển đã kiểm chứng hoặc camera đang xử phạt. Các điểm được phân loại theo thứ tự xử lý tag của script; một điểm có nhiều tag không được cộng lặp. Có tag tốc độ chưa đồng nghĩa có mức số áp dụng cho ô tô.

Từ bản này, giao diện và cảnh báo **chỉ dùng nhóm có thể dẫn tới xử phạt**: biển tốc độ, camera tốc độ/giao thông, đèn giao thông, STOP, nhường đường, cấm đi vào/ngược chiều, biển cấm phương tiện/rẽ/dừng và cấm vượt. Các nhóm `crossing`, `level_crossing`, `traffic_calming`, `hazard` và biển chưa rõ loại vẫn nằm trong gói nguồn để đối chiếu nhưng bị parser bỏ, không hiển thị và không cảnh báo.

Gói **20261120-r2** có **1.346 shard, 55.052.301 byte JSON**; mỗi shard có SHA-256. Bản r2 mở rộng các loại đối tượng được trích xuất từ cùng PBF ngày 20/11, không phải khảo sát thực địa mới. Nhóm trong bảng theo thứ tự ưu tiên của script; một điểm có nhiều tag chỉ đếm một lần. Parser có thể ưu tiên tag khác, nên số nhóm không phải số phân loại cuối cùng trên giao diện. Đã xác minh toàn bộ bằng `node scripts/verify-offline-pack.mjs`; báo cáo ở `docs/OFFLINE_PACK_REPORT.json`. Kiểm checksum chứng minh tính toàn vẹn của gói, không chứng minh vị trí/biển còn đúng ngoài thực địa.

Xem trước tự quét **toàn tuyến** từ gói trên thiết bị. Mỗi lượt xử lý vẫn tối đa 6 km/16 ô; bộ quét đi qua cả các trang khoảng cách và trang node dày, tới điểm cuối, gộp điểm/đoạn trùng và xác nhận không có khoảng chưa quét trước khi ghi hoàn tất. Có tiến độ, hủy khi đổi tuyến và cache bộ nhớ giới hạn. Bản đồ và tổng số điểm lấy từ kết quả toàn tuyến; danh sách dài có nút xem thêm. Đã bỏ giới hạn cắt âm thầm 180 điểm.

Cảnh báo khi lái xe, mức tốc độ hiện tại và BLE vẫn dùng cửa sổ gần GPS. Nếu gói cục bộ lỗi, Overpass chỉ dự phòng cho cửa sổ này, không phát hàng loạt request công cộng để quét toàn tuyến. Lỗi/partial scan được ghi rõ, không đánh dấu hoàn tất hoặc tạo điểm thay thế.

Đã kiểm tra tuyến trung tâm Tiền Hải → Hà Nội: cửa sổ đầu 0–6 km có 0 điểm khớp; quét cả tuyến với r2 trả 120 điểm gồm cả nhóm không còn hiển thị: 17 đèn, 11 biển chưa rõ loại, 13 điểm giảm tốc, 78 điểm sang đường và 1 camera/điểm giám sát chưa rõ chức năng. Sau khi lọc, biển chưa rõ loại, giảm tốc và sang đường không còn trong giao diện/cảnh báo. Đây là kết quả gói nguồn/tuyến đã chọn, không phải xác nhận thực địa hay cam kết cho mọi địa chỉ/đường thay thế. Chi tiết ở `TIEN_HAI_HA_NOI_AUDIT.json`.

Tuyến mô phỏng Ngõ 37 Bằng Liệt → khu vực Hồ Hoàn Kiếm dài khoảng 11,2 km qua Phố Nguyễn Phan Chánh, Phố Hoàng Liệt, Đường Trương Định và Phố Bạch Mai. Nguồn có 338 điểm gần tuyến, trong đó phần lớn là nhóm không còn hiển thị: 262 điểm sang đường, 9 điểm giảm tốc, 3 đường ngang đường sắt; phần còn lại gồm 62 đèn, 1 STOP và 1 camera chưa rõ chức năng. **338 điểm không phải 338 biển báo.** Chỉ vị trí xe thay đổi; tọa độ/tag gốc giữ nguyên. Xem `BANG_LIET_SIMULATION_REPORT.json` để đối chiếu OSM ID và ví dụ.

Giấy phép ODbL-1.0; ghi công © OpenStreetMap contributors, extract: Geofabrik. Gói này chỉ có metadata đường: **bản đồ nền và tính tuyến vẫn cần mạng**. Chưa tích hợp dữ liệu thương mại VIETMAP/Goong/Vietbando hoặc bộ camera được cơ quan quản lý xác nhận. Các bộ bên thứ ba chưa rõ quyền/provenance đã audit không được nhập vào app.

## Ký hiệu và bản đồ

- Ba chấm xếp dọc trong hình đèn tín hiệu, có màu hoặc đen/xám, là **đèn giao thông**, không phải camera và không có dữ liệu màu đèn trực tiếp. Chú giải có cả hai hình để tránh nhầm với menu ba chấm.
- Camera tốc độ và camera/điểm giám sát giao thông có nhãn phân biệt; điểm giám sát không rõ chức năng bị bỏ. Không mặc định mọi camera đều phạt nguội.
- Biển cấm đi vào, cấm đi ngược chiều, biển cấm phương tiện/rẽ/dừng và cấm vượt có SVG riêng; biển lạ không được tự gán nghĩa.
- Hình biển/camera là SVG minh họa theo loại, không phải ảnh chụp vật thể tại tọa độ đó. Mã biển chưa biết được giữ nguyên, không tự gán nghĩa.
- Bản đồ nền dùng vector OpenFreeMap/OSM qua MapLibre, style Positron ít POI. Một renderer/style được giữ khi tìm địa điểm, chọn tuyến, dẫn đường và chuyển 2D/3D; không tự đổi nhà cung cấp khi lỗi. Tile/lớp nền không phải bộ dữ liệu cảnh báo đã được RoadLink kiểm chứng.
- Đã bỏ ba marker địa điểm gắn cố định lúc mở app. Lớp dữ liệu đường chỉ tải khi có tuyến; các bộ lọc Camera/Biển cấm/Đèn giao thông không phải công tắc bật nguồn dữ liệu chung.
- Chưa có vị trí thì mở toàn cảnh Việt Nam, không giả định người dùng ở TP.HCM. Không có toast nổi; trạng thái và lỗi nằm trong bảng thao tác, cảnh báo đường nằm trong bảng hành trình.
- Chế độ 3D dùng `building`/`render_height`/`render_min_height` của nguồn OpenMapTiles, chỉ dựng đối tượng có chiều cao dương và không bị nguồn ẩn 3D. Không gán chiều cao mặc định do app tự tạo. Đây là khối hình từ dữ liệu nguồn, không phải ảnh chụp hay độ cao đã kiểm chứng. Có thể nghiêng, xoay, chuyển lại 2D; cần WebGL và mạng.

## Khớp giới hạn tốc độ

Router yêu cầu `annotations=nodes,distance`. Chỉ dùng đoạn có **cặp OSM node ID đúng thứ tự với tuyến**, không lấy đường gần nhất theo hình học. Giữ nguyên thứ tự node, hướng và tag gốc trong gói. Tách forward/backward, ưu tiên motorcar/motor_vehicle; không dùng mức chỉ dành xe tải làm mức ô tô.

Đọc số km/h và mph. Tag theo làn, có điều kiện, biến đổi hoặc mã không rõ được trả về chưa xác định. Không suy ra mức tốc độ từ ETA, tốc độ xe hay loại đường.

GPS phải mới ≤15 giây, accuracy ≤20 m, cách đoạn khớp ≤15 m. Khi đang di chuyển, hướng phải phù hợp; thiếu hướng sẽ không nhận mức chắc chắn. Gần giao cắt có các mức mâu thuẫn, lệch tuyến hoặc thiếu ID đều hiện `—`. Ngày sửa đối tượng OSM không phải ngày kiểm tra biển.

## Cảnh báo và giọng nói

Cảnh báo camera tốc độ/giao thông và biển quan trọng yêu cầu node thuộc tuyến. Biển đặt bên đường sát tuyến (≤8 m) có thể tạo nhắc nhở có điều kiện, ghi rõ chưa xác nhận chiều áp dụng; không dùng điểm gần tuyến để suy ra chắc chắn tốc độ áp dụng. Chỉ hỗ trợ STOP, nhường đường, biển tốc độ, cấm đi vào/ngược chiều, biển cấm phương tiện/rẽ/dừng và cấm vượt. Điểm sang đường, gờ giảm tốc, đường ngang đường sắt, hazard và biển chưa rõ loại không tạo cảnh báo. Vẫn nhắc kiểm tra chiều áp dụng thực tế. Khoảng nhìn trước 200–500 m theo tốc độ; mức ghi nhận sắp đổi có thể báo trước khoảng 200 m. Không tạo cảnh báo mới khi GPS yếu/cũ, lệch tuyến hoặc đã đến nơi. Mỗi hành trình có lịch sử riêng để tránh nhắc liên tục.

Mức tốc độ phải ổn định qua nhiều fix trước khi nhắc. Nhắc tốc độ có cooldown; ngưỡng phần mềm không phải kết luận vi phạm hay dung sai xử phạt. Luôn ưu tiên biển thực tế.

Chỉ chọn voice `vi`/`vi-VN` thực sự có sẵn; không dùng giọng Anh thay thế. Nếu thiếu thì hiển thị hướng dẫn cài giọng và giữ chỉ dẫn trên màn hình. Chưa có TTS cloud/âm thanh VIETMAP trong app; chưa nghe xác nhận giọng native trên iPhone thật.

Giới hạn: chưa xác minh GPS/BLE và biển/camera ngoài thực địa; không cam kết đủ toàn Việt Nam hoặc tương đương VIETMAP.
