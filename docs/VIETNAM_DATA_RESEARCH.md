# Rà soát nguồn làm cảnh báo đường tại Việt Nam

Kiểm tra ngày **21/11/2026**. Mục tiêu: app iOS tìm/chọn tuyến, cảnh báo biển và camera khi tiến đến đúng đoạn, giọng Việt, gửi chỉ dẫn tới ESP32. Không thể chứng minh đã tìm hết Internet; báo cáo này rà soát nhiều nhóm và ưu tiên tài liệu chính thức, dữ liệu tải thực được và khả năng tích hợp.

Danh mục URL/trạng thái chi tiết: `ROAD_DATA_SOURCES.json`. Số liệu đo từ file đã tải, schema và SHA-256: `SOURCE_AUDIT_RESULTS.json`. Dữ liệu nghiên cứu gốc nằm trong `.tools/source-audit`, **chưa được đóng gói vào app**.

## Kết luận quan trọng

1. **Không cần bỏ Google để gửi hướng rẽ sang ESP32.** Navigation SDK for iOS có turn-by-turn feed chính thức dành cho màn hình nhỏ. Có thể dùng feed làm đầu vào bridge BLE, thay vì đọc trộm thông báo hoặc phản chiếu app Google Maps. Đây mới là hướng thích hợp nếu muốn chất lượng dẫn đường/UI Google và thiết bị phụ.
2. **Google không giải quyết hết lớp biển/camera Việt Nam.** Bảng Navigation SDK hiện ghi VN có directions/snap-to-road, nhưng speed limits và traffic lights/stop signs là dấu —. Dấu này theo chính tài liệu có nghĩa không hỗ trợ hoặc chất lượng/khả dụng thấp. Không lấy việc app Google hiển thị một tính năng ở nước khác để suy ra API có ở VN.
3. **Goong, VIETMAP và Vietbando là ba đầu mối Việt Nam cần ưu tiên thử bằng tài khoản thật.** Có tài liệu cụ thể hơn các bài quảng cáo app. Chưa có key/gói quyền trong workspace nên chưa xác nhận live coverage/chất lượng bằng request được cấp quyền.
4. **Có dữ liệu tải về, không phải chỉ có Overpass.** Đã kiểm tra SQLite Việt Nam thật. Tuy nhiên schema giản lược và coverage camera rất nhỏ nên không được coi là tương đương VIETMAP.
5. **Kho cộng đồng lớn không mặc nhiên là dữ liệu mở.** Một repo tìm được có hàng chục nghìn bản ghi nhưng tự ghi nhãn phần lớn từ Vietmap/Waze; giấy phép source code không đủ để kết luận quyền dùng lại mọi bản ghi bên thứ ba.

## Nhóm ưu tiên tích hợp

| Nguồn | Có bằng chứng gì | Điểm phải làm rõ | Đề xuất |
|---|---|---|---|
| Google Navigation SDK iOS | Feed hướng rẽ/tên đường/khoảng cách/thời gian cho màn hình nhỏ; có UI do Google cung cấp | Key/billing, attribution, thử iPhone + bridge BLE; không hứa xuất ảnh bản đồ | Ưu tiên cho điều hướng nếu muốn gần Google Maps thực sự |
| Goong Speed Limit | lat/lon/bearing, max_speed/re_speed; tài liệu mô tả biển/camera | Có hai thế hệ endpoint/schema; ví dụ công khai chưa đủ mọi trường camera, đơn vị distance cần đối chiếu response thật | Ứng viên REST VN thuận lợi cho app hiện tại |
| VIETMAP SpeedAlert iOS | Callback biển hiện tại/kế tiếp, khoảng cách camera/phí và WAV | Enterprise; nhánh README đang phát triển, giới hạn vehicleType 3/5/6; cần bản ổn định/phù hợp ô tô và quyền dùng dữ liệu/thiết bị phụ | Ứng viên sát yêu cầu cảnh báo VIETMAP nhất, cần làm việc với nhà cung cấp |
| Vietbando ForecastRoadsByTrafficSign | Point, Speed, Heading, TransportType, Distance; dự báo biển/tốc độ phía trước | Quyền dịch vụ, coverage, kiểu phương tiện, freshness và schema camera | Thử song song Goong, không bỏ sót nguồn này |
| Cổng GIS địa phương | Có WCF help và schema ForecastRoadsByTrafficSign | Docs công khai không đồng nghĩa API ẩn danh; coverage địa phương, quyền chia sẻ | Nguồn phối hợp/xác minh tại khu vực |

### Vì sao không chọn Amap ngay

Amap đã có nền tảng quốc tế và SDK iOS. Điều chưa xác nhận được từ tài liệu đã xem là mức phủ **biển, camera và hướng/làn áp dụng ở Việt Nam**, không chỉ khả năng hiển thị bản đồ/chỉ đường. Đây là ứng viên cần test trên tuyến VN thật bằng key phù hợp, không được suy tính năng tại Trung Quốc thành dữ liệu đủ ở VN.

### Các nhà cung cấp quốc tế khác

Mapbox có `annotations=maxspeed` và biểu diễn unknown/none; tài liệu phân biệt speed tính ETA với maxspeed, và mức maxspeed có thể là giới hạn hoặc khuyến nghị được ghi. GraphHopper có path details `max_speed`, hữu ích khi tự host dữ liệu OSM. HERE reference có speedLimit. Những điều đó xác nhận loại API, **không xác nhận coverage camera/biển VN đạt yêu cầu**. TomTom/Mapillary/Valhalla cũng đã được tìm để sàng lọc nhưng chưa chốt được một feed camera/biển VN có quyền dùng và coverage được kiểm chứng; không ghi là đã tích hợp.

## Dữ liệu tải thật đã kiểm toán

### SpeedAlert_Databases — bản Asia tháng 11/2026

Đã tải hai asset của release `asia-202611` (công bố 05/11/2026), kiểm SHA-256 theo GitHub release và mở SQLite bằng chế độ read-only:

| Asset | Nén | Sau giải nén | Số dòng dữ liệu |
|---|---:|---:|---:|
| `vn.sqlite.7z` | 2.590.544 byte | 6.041.600 byte | 39.430 `speed_index`, 39.430 `speed_data` |
| `vn-camera.sqlite.7z` | 1.651 byte | 20.480 byte | **43 camera** |

Schema speed chỉ giữ ID, bounding box/polyline và một số speed (giá trị quan sát 2–120). Camera chỉ giữ ID, lat/lon/type; cả 43 dòng ghi type=speed. Thiếu bằng chứng trực tiếp trong schema về chiều, làn, loại xe, conditional, thời gian hiệu lực và ngày khảo sát thực tế. Vì thế không thể trút thẳng vào badge “giới hạn chắc chắn” của mọi ô tô trên mọi chiều.

Repo ghi giấy phép database CC BY 4.0; code/app gốc mô tả dữ liệu OSM, nên cần giữ đầy đủ attribution/provenance và xem các nghĩa vụ dữ liệu nền trước khi phát hành. **Đã tải và audit không đồng nghĩa dữ liệu ngoài đường đã được kiểm chứng.**

Giá trị sử dụng: gói offline dự phòng và đối chiếu candidate; camera coverage chỉ 43 điểm nên hoàn toàn không tương đương toàn bộ camera VN. Không còn lý do kỹ thuật phải phụ thuộc request Overpass mỗi lần GPS cập nhật.

### Navbridge — phải phân biệt README với asset thực

File `vietnam_cameras.json` tải thực có **35.448 bản ghi**, phiên bản 6, metadata generated `2026-10-24`. Phân nhóm đúng theo field `source` trong file:

| Nhãn nguồn trong file | Số bản ghi |
|---|---:|
| vietmap | 27.010 |
| waze | 6.500 |
| kiemtraphatnguoi | 1.103 |
| police | 832 |
| osm | 3 |

Đây là **nhãn tự khai trong dataset**, chưa xác minh tác giả có quyền chuyển tiếp dữ liệu. Không gọi toàn bộ 35.448 điểm là OSM, không coi tất cả là camera phạt nguội, không xem MIT của code là bằng chứng quyền của mọi dữ liệu bên thứ ba. Script Overpass trong repo nói không dùng Waze cho chính phần import OSM đó, nhưng điều này không làm toàn bộ file gộp thành OSM.

Asset `vietnam_signs.json` chỉ 13 byte, parse ra **0 signs**; `vietnam_speed_limits.geojson` chỉ 43 byte, parse ra **0 features**. File camera có 35.344 cặp tọa độ phân biệt nhưng không suy ra số thiết bị vật lý hoặc độ chính xác chỉ từ điều đó. Không dùng mô tả README thay cho kiểm tra asset thực. Dữ liệu này giữ trong vùng nghiên cứu, **chưa nhập production**. Cần hỏi provenance, giấy phép từng nguồn, phương pháp dedupe, hướng camera, update/expiry và ngày xác minh trước khi cân nhắc.

## Nguồn mở nguyên bản và hệ thống offline đúng cách

Geofabrik có PBF Việt Nam cập nhật và file thay đổi. Hướng vững hơn là dựng pipeline riêng giữ OSM way/node IDs và tag gốc (`maxspeed`, hướng, conditional, vehicle), xây chỉ mục không gian rồi xuất gói Việt Nam theo phiên bản. Điện thoại tra cục bộ; backend cập nhật định kỳ. Đổi server Overpass hoặc tự host chỉ thay khả năng truy cập, không tự tăng số biển/camera chưa được cộng đồng nhập.

Gói speed SQLite giản lược ở trên không thay được PBF/tag đầy đủ nếu yêu cầu xác định đúng mọi điều kiện. Không cần tải toàn bộ PBF vào app; ETL chạy ngoài app rồi chỉ xuất phần cần thiết. Trong phiên này chưa tải PBF hàng trăm MB vì mục tiêu là kiểm tra nguồn và schema trước, không tải khối lượng lớn thiếu mục đích.

## Nguồn chính thức địa phương và nguồn chỉ cho xem

Cổng giao thông TP.HCM truy cập HTTP 200, dùng nền tảng Vietbando và có client/map scripts. Cổng dữ liệu mở gặp xác minh ở trình đọc web, nhưng GET thông thường sau đó trả HTTP 200; chưa xác minh tệp/API giao thông cụ thể và không vượt chặn. Tài liệu GIS TP.HCM/Đắk Lắk có schema dự báo biển/tốc độ nhưng chưa chứng minh quyền gọi hoặc phạm vi quốc gia. Thông báo công an/cơ quan giao thông có thể bổ sung, cần lưu ngày đăng, trạng thái dự kiến/đang hoạt động và xác minh tọa độ; bài viết không phải tự động là API.

Bài SForum người dùng gửi là đầu mối tìm ứng dụng, không tự cấp bộ dữ liệu. VNeTraffic, TTGT, VNOpenmap, MapCar và các trang tra cứu cần tách khả năng xem trong ứng dụng khỏi quyền/tính sẵn có của API xuất dữ liệu. MapCar còn công khai việc có số tốc độ suy ra khi thiếu biển; đó không phải số đo từ biển để sao chép thành dữ liệu chắc chắn.

Link ứng viên SCDB/Vietnam đã trả **404**, nên không coi là nguồn Việt Nam đã được xác nhận. VNOpenmap trả **530** ở lượt GET kiểm tra; tài liệu Goong cũ bị lỗi fetch, vì vậy không triển khai theo endpoint cũ chỉ do kết quả tìm kiếm còn lưu. Waze partner feed không được giả định là endpoint công cộng để tải toàn bộ camera. TrackAsia `CameraOptions` là camera/góc nhìn ảo của bản đồ, không phải camera phạt nguội; tránh nhầm từ khóa khi rà soát. Các bộ ảnh nhận diện biển/ML không có vị trí/chiều/hiệu lực không đáp ứng trực tiếp bài toán cảnh báo trước theo tuyến.

## Kiến trúc đề xuất sau rà soát

**Điều hướng/UI:** cân nhắc Google Navigation SDK + Places nếu chấp nhận key/gói sử dụng; dùng feed hướng dẫn → schema RoadLink → BLE. Không giả định được xuất nguyên ảnh map hoặc dùng nội dung Google trên nền bản đồ khác mà không xem điều kiện hiện hành.

**Cảnh báo Việt Nam:** adapter Goong / VIETMAP bản đúng phương tiện / Vietbando → chuẩn hóa tọa độ, bearing, road ID, làn/loại xe, hiệu lực, nguồn và chất lượng. Duy trì cơ sở dữ liệu VN offline riêng từ nguồn có quyền dùng để không mất mọi thông tin khi mạng/API lỗi. Tách lớp cộng đồng chưa xác minh khỏi lớp đã xác nhận; không âm thầm lấy số suy luận làm biển thật.

**Nghiệm thu nguồn:** yêu cầu sample có camera/tốc độ thật trên vài tuyến ô tô/xe máy ở Hà Nội, TP.HCM, cao tốc và tỉnh; đo đúng chiều, đường song song/cầu vượt, ngày cập nhật, API null/unknown, quota/giá và quyền cache/BLE. Không mua hoặc đăng ký dịch vụ thay người dùng trong phiên này. Không có API key thương mại nên chưa báo đã gọi thành công các API có khóa.

## Trạng thái công việc

- Đã kiểm tra tài liệu, download, hash, schema và số dòng nêu trên.
- Đã chạy kiểm tra 27 link: 24 trả HTTP 200; 1 link 404, 1 trả 530 và 1 lỗi fetch. HTTP 200 chỉ xác nhận truy cập, không chứng minh coverage hoặc quyền sử dụng. Chi tiết ở `SOURCE_LINK_CHECK.json`.
- Đã tìm được đường kỹ thuật chính thức cho Google → màn hình nhỏ, thay vì kết luận Google không xuất được chỉ dẫn.
- Chưa tích hợp dữ liệu nghiên cứu vào app, chưa thay nguồn chính sang một nhà cung cấp chưa có key.
- Kết quả 90 test trước đó là của app prototype, **không chứng minh dữ liệu thương mại/VN ngoài đường chính xác**.

Các lần chạy tái lập: `node scripts/audit-public-sources.mjs`; `uv run --no-project --python 3.12 --with py7zr python scripts/audit-road-datasets.py`; `node scripts/inspect-source-sites.mjs`. Scripts chỉ đọc nguồn công khai và ghi artifact nghiên cứu, không đăng nhập, không tìm/chạy API bằng key lộ hoặc vượt CAPTCHA.
