import os
import sys
import json
import math
import argparse
import cv2
import numpy as np
from ultralytics import YOLO

def detect_traffic_signs_and_cameras(img_cv, vehicle_boxes=None):
    """Phát hiện toàn diện:
    1. Biển báo giao thông (QCVN 41:2019):
       - P.127: Biển giới hạn tốc độ (Viền đỏ, nền trắng, số đen)
       - P.130 / P.131: Biển cấm dừng và đỗ xe (Viền đỏ, nền xanh dương, vạch chéo đỏ)
       - P.102: Biển cấm đi ngược chiều (Nền tròn đỏ, vạch ngang trắng)
       - P.122: Biển STOP / Dừng lại (Bát giác đỏ)
    2. Camera phạt nguội bên trên (Overhead enforcement cameras):
       - Camera/hộp cảm biến giám sát treo trên giá long môn hoặc cần vươn trên cao
    """
    if img_cv is None:
        return []
    h_img, w_img = img_cv.shape[:2]
    candidates = []

    # --- A. PHÁT HIỆN BIỂN BÁO HÌNH TRÒN / BÁT GIÁC VIỀN ĐỎ ---
    hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
    mask1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([12, 255, 255]))
    mask2 = cv2.inRange(hsv, np.array([160, 70, 50]), np.array([180, 255, 255]))
    mask_red = mask1 | mask2

    contours, _ = cv2.findContours(mask_red, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in contours:
        area = cv2.contourArea(c)
        if area < 150: # Cho phép bắt các biển ở cự ly xa
            continue
        peri = cv2.arcLength(c, True)
        if peri == 0:
            continue
        circularity = 4 * np.pi * area / (peri * peri)
        x, y, w, h = cv2.boundingRect(c)
        ratio = w / float(h)
        if not (0.70 <= ratio <= 1.40 and circularity >= 0.40):
            continue

        cx, cy = x + w / 2.0, y + h / 2.0

        # Lọc bỏ vật thể nằm lọt trong thân xe cộ
        inside_vehicle = False
        if vehicle_boxes:
            for vb in vehicle_boxes:
                # Nếu nằm hoàn toàn trong xe cộ tầm thấp (y > 380)
                if vb[0] <= cx <= vb[2] and vb[1] <= cy <= vb[3] and cy > 0.45 * h_img:
                    inside_vehicle = True
                    break
        if inside_vehicle:
            continue

        # Lọc vị trí: Phải ở tầm lề đường (cy <= 0.62*H) hoặc treo cao (cy >= 0.08*H)
        if cy > 0.62 * h_img or cy < 0.08 * h_img:
            continue
        if (0.38 * w_img <= cx <= 0.62 * w_img) and (cy >= 0.38 * h_img):
            continue

        # Phân loại màu sắc lòng biển
        patch = img_cv[y:y+h, x:x+w]
        if patch.size == 0:
            continue

        b, g, r = patch[:, :, 0], patch[:, :, 1], patch[:, :, 2]
        total_px = float(patch.shape[0] * patch.shape[1])
        patch_hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)

        # 1. Nền xanh dương (P.130/P.131 cấm dừng đỗ)
        blue_cnt = np.sum((b > 75) & (r < 65))
        blue_ratio = blue_cnt / total_px

        # 2. Nền trắng phản quang (P.127 tốc độ hoặc biển cấm chung)
        white_cnt = np.sum((patch_hsv[:, :, 1] < 75) & (patch_hsv[:, :, 2] > 120))
        white_ratio = white_cnt / total_px

        # 3. Nét đen chữ số / biểu tượng
        dark_cnt = np.sum(patch_hsv[:, :, 2] < 85)
        dark_ratio = dark_cnt / total_px

        delta_v = int(np.max(patch_hsv[:, :, 2])) - int(np.min(patch_hsv[:, :, 2]))

        sign_type = None
        conf = 0.60
        if blue_ratio >= 0.15:
            sign_type = "no_stopping_or_parking"
            conf = min(0.95, round(0.55 + blue_ratio * 0.5, 2))
        elif white_ratio >= 0.08 and (dark_ratio >= 0.08 or delta_v >= 100):
            sign_type = "speed_limit_or_prohibition_sign"
            conf = min(0.95, round(circularity * 0.85, 2))
        elif delta_v >= 120 and circularity >= 0.65:
            sign_type = "prohibition_sign"
            conf = 0.55

        if sign_type:
            candidates.append({
                "type": sign_type,
                "conf": conf,
                "bbox": [x, y, x + w, y + h]
            })

    return candidates


def detect_overhead_cameras(img_cv, yolo_results, model_names):
    """Phát hiện Camera phạt nguội bên trên (Overhead Traffic Surveillance / Speed Cameras):
    - Vị trí: Vùng không gian trên cao phía trên các làn đường (0.08 * H <= cy <= 0.42 * H)
    - Quy luật thực tế Việt Nam: Camera thường gắn cách cột đèn giao thông khoảng 2-3 mét
      dọc theo cần vươn thép ngang (tránh bị lóa đèn pha và góc nhìn vạch dừng tốt hơn).
    - Không có 3 màu đèn tín hiệu giao thông (Xanh/Vàng/Đỏ)
    """
    if img_cv is None or yolo_results is None:
        return []
    h_img, w_img = img_cv.shape[:2]
    cameras = []
    traffic_light_anchors = []

    for box in yolo_results.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        label = model_names[cls_id]
        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0

        # Chỉ xét đối tượng nằm ở tầm cao phía trên các làn đường (0.08 * H <= cy <= 0.42 * H)
        if not (0.08 * h_img <= cy <= 0.42 * h_img):
            continue

        # Nếu là đèn giao thông -> Lưu làm mốc Anchor để dò tìm camera cách 2-3m
        if cls_id == 9 or "traffic light" in label.lower():
            traffic_light_anchors.append((conf, [x1, y1, x2, y2]))
            continue

        # Các nhãn COCO khác có thể là hộp camera: clock (74), tv (62), hoặc camera
        is_cam_candidate = (cls_id in [62, 74]) or ("camera" in label.lower())
        if not is_cam_candidate:
            continue

        patch = img_cv[max(0, y1):min(h_img, y2), max(0, x1):min(w_img, x2)]
        if patch.size < 50:
            continue

        patch_hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        sat = patch_hsv[:, :, 1]
        val = patch_hsv[:, :, 2]
        bright_color_pts = np.sum((sat > 140) & (val > 140))
        color_ratio = bright_color_pts / float(patch.shape[0] * patch.shape[1])

        # Nếu là đèn tín hiệu xanh/vàng/đỏ -> Bỏ qua
        if color_ratio > 0.25:
            continue

        cam_conf = min(0.90, round(max(conf, 0.55), 2))
        cameras.append({
            "type": "speed_camera",
            "conf": cam_conf,
            "bbox": [x1, y1, x2, y2],
            "description": "Camera phạt nguội bên trên (giá long môn / cần vươn)"
        })

    # Dò tìm Camera phạt nguội gắn cách cột đèn giao thông 2-3 mét (khoảng 70 - 220 pixel)
    for tl_conf, [tx1, ty1, tx2, ty2] in traffic_light_anchors:
        tcx = (tx1 + tx2) / 2.0
        tcy = (ty1 + ty2) / 2.0

        # Quét dải ngang 2-3m sang bên trái và bên phải dọc theo cánh tay vươn ngang
        for side, (x_min, x_max) in [("left", (int(tcx - 220), int(tcx - 70))),
                                    ("right", (int(tcx + 70), int(tcx + 220)))]:
            x_min = max(0, x_min)
            x_max = min(w_img, x_max)
            y_min = max(0, int(tcy - 40))
            y_max = min(h_img, int(tcy + 45))

            band = img_cv[y_min:y_max, x_min:x_max]
            if band.shape[0] < 20 or band.shape[1] < 30:
                continue

            hsv = cv2.cvtColor(band, cv2.COLOR_BGR2HSV)
            sat = hsv[:, :, 1]
            val = hsv[:, :, 2]

            # Vỏ hộp camera kim loại: Sat thấp (< 85) và Val vừa/cao (> 60)
            edges = cv2.Canny(band, 50, 150)
            edge_pts = np.sum(edges > 0)

            # Kiểm tra xem có phải đèn tín hiệu giao thông phát sáng không
            bright_pts = np.sum((sat > 140) & (val > 140))
            if bright_pts / float(band.shape[0] * band.shape[1]) > 0.15:
                continue  # Bỏ qua nếu là đèn phụ

            if edge_pts > 45:  # Có cấu trúc cơ khí hộp camera trên thanh xà
                # Tìm bounding box chính xác của hộp thiết bị trong dải quét
                contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                best_box = None
                max_area = 0
                for c in contours:
                    ca = cv2.contourArea(c)
                    if 150 < ca < 6000:
                        bx, by, bw, bh = cv2.boundingRect(c)
                        ratio = bw / float(bh)
                        if 1.0 <= ratio <= 3.8 and ca > max_area:
                            max_area = ca
                            best_box = [x_min + bx, y_min + by, x_min + bx + bw, y_min + by + bh]

                final_box = best_box if best_box else [x_min, y_min, x_max, y_max]
                cameras.append({
                    "type": "speed_camera",
                    "conf": 0.72,
                    "bbox": final_box,
                    "description": f"Camera phạt nguội bên trên (cách cột đèn giao thông ~2-3m phía {side})"
                })

    return cameras
import sys
import json
import math
import argparse
from ultralytics import YOLO

def calculate_sign_gps(cam_lat, cam_lng, heading, bbox, img_w, fov=75.0, distance_meters=6.0):
    x1, y1, x2, y2 = bbox
    center_x = (x1 + x2) / 2.0
    
    angle_offset = ((center_x - (img_w / 2.0)) / (img_w / 2.0)) * (fov / 2.0)
    bearing = (heading + angle_offset) % 360.0
    
    R = 6378137.0
    bearing_rad = math.radians(bearing)
    lat_rad = math.radians(cam_lat)
    lng_rad = math.radians(cam_lng)
    
    sign_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(distance_meters / R) +
        math.cos(lat_rad) * math.sin(distance_meters / R) * math.cos(bearing_rad)
    )
    sign_lng_rad = lng_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(distance_meters / R) * math.cos(lat_rad),
        math.cos(distance_meters / R) - math.sin(lat_rad) * math.sin(sign_lat_rad)
    )
    
    return math.degrees(sign_lat_rad), math.degrees(sign_lng_rad), bearing


def process_manifest(manifest_path, model_path="yolov8n.pt", output_dir="exports/web_streetview"):
    if not os.path.exists(manifest_path):
        print(f"[!] Không tìm thấy manifest: {manifest_path}")
        return []
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        frames = json.load(f)
        
    print(f"[*] Đang tải mô hình YOLO ({model_path})...")
    model = YOLO(model_path)
    
    detected_signs = []
    
    for frame in frames:
        img_path = frame["imagePath"]
        if not os.path.exists(img_path):
            continue
            
        cam_lat = frame["lat"]
        cam_lng = frame["lng"]
        heading = frame.get("heading", 0)
        fov = frame.get("fov", 75.0)
        
        img_cv = cv2.imread(img_path)
        img_w = img_cv.shape[1] if img_cv is not None else 1280

        # 1. Chạy YOLO trước để trích xuất hộp giới hạn của các phương tiện (xe bus, ô tô, xe tải, xe máy)
        # biển báo giao thông và camera phạt nguội trên cao.
        results = model.predict(source=img_path, conf=0.15, verbose=False)
        vehicle_boxes = []
        for res in results:
            for box in res.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                label = model.names[cls_id]

                # Ghi nhận các phương tiện giao thông để lọc bỏ vòng đỏ nằm trên thân xe
                if label in ["car", "bus", "truck", "motorcycle", "train"]:
                    vehicle_boxes.append(box.xyxy[0].tolist())
                    continue

                # Loại bỏ hoàn toàn đèn tín hiệu giao thông / đèn đỏ
                if cls_id == 9 or "light" in label.lower() or "traffic light" in label.lower():
                    continue

                # Nhận diện biển báo giao thông hoặc stop sign (Class 11)
                is_sign = ("sign" in label.lower()) or (cls_id == 11)
                if not is_sign:
                    continue

                bbox = box.xyxy[0].tolist()
                bx_center = (bbox[0] + bbox[2]) / 2.0
                by_center = (bbox[1] + bbox[3]) / 2.0
                img_h = img_cv.shape[0] if img_cv is not None else 720

                # Lọc vị trí lề đường cho biển YOLO: không nằm sát đất và không nằm giữa tim đường ở tầm thấp
                if by_center > 0.62 * img_h:
                    continue
                if (0.38 * img_w <= bx_center <= 0.62 * img_w) and (by_center >= 0.38 * img_h):
                    continue

                # Phân loại chuyên sâu biển báo Việt Nam:
                final_label = label
                x1, y1, x2, y2 = [int(v) for v in bbox]
                patch = img_cv[max(0, y1):min(img_h, y2), max(0, x1):min(img_w, x2)]
                if patch.size > 20:
                    b, r = patch[:, :, 0], patch[:, :, 2]
                    blue_cnt = np.sum((b > 75) & (r < 65))
                    blue_ratio = blue_cnt / float(patch.shape[0] * patch.shape[1])
                    if blue_ratio >= 0.15:
                        final_label = "no_stopping_or_parking"
                    elif cls_id == 11 or "stop" in label.lower():
                        final_label = "stop"

                sign_lat, sign_lng, bearing = calculate_sign_gps(
                    cam_lat, cam_lng, heading, bbox, img_w, fov=fov
                )

                sign_record = {
                    "type": final_label,
                    "confidence": round(conf, 3),
                    "latitude": sign_lat,
                    "longitude": sign_lng,
                    "bearing": round(bearing, 1),
                    "camera_latitude": cam_lat,
                    "camera_longitude": cam_lng,
                    "source_image": os.path.basename(img_path),
                    "google_maps_url": frame.get("url")
                }
                detected_signs.append(sign_record)
                print(f"  [+] Tìm thấy '{final_label}' ({conf:.2f}) -> Tọa độ biển báo: {sign_lat:.6f}, {sign_lng:.6f}")

        # 2. Phát hiện biển báo giao thông (P.127, P.130/P.131 cấm dừng đỗ, P.102 cấm đi ngược chiều, STOP)
        sign_candidates = detect_traffic_signs_and_cameras(img_cv, vehicle_boxes=vehicle_boxes)
        for cand in sign_candidates:
            bbox = cand["bbox"]
            sign_lat, sign_lng, bearing = calculate_sign_gps(
                cam_lat, cam_lng, heading, bbox, img_w, fov=fov
            )
            sign_record = {
                "type": cand["type"],
                "confidence": cand["conf"],
                "latitude": sign_lat,
                "longitude": sign_lng,
                "bearing": round(bearing, 1),
                "camera_latitude": cam_lat,
                "camera_longitude": cam_lng,
                "source_image": os.path.basename(img_path),
                "google_maps_url": frame.get("url")
            }
            detected_signs.append(sign_record)
            print(f"  [+] Tìm thấy biển báo '{cand['type']}' ({cand['conf']:.2f}) -> Tọa độ: {sign_lat:.6f}, {sign_lng:.6f}")

        # 3. Camera Phạt Nguội: Không lấy từ ảnh Street View (do ảnh cũ chưa cập nhật).
        # Toàn bộ dữ liệu Camera phạt nguội chỉ lấy từ nguồn API chính thức của CSGT / Bộ Công An.
        # overhead_cameras = detect_overhead_cameras(img_cv, results[0] if results else None, model.names)

    os.makedirs(output_dir, exist_ok=True)
    geojson_path = os.path.join(output_dir, "detected_traffic_signs.geojson")
    existing_features = []
    if os.path.exists(geojson_path):
        try:
            with open(geojson_path, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                existing_features = old_data.get("features", [])
        except Exception:
            existing_features = []

    new_features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s["longitude"], s["latitude"]]
            },
            "properties": {
                "type": s["type"],
                "confidence": s["confidence"],
                "bearing": s["bearing"],
                "source_image": s["source_image"],
                "google_maps_url": s["google_maps_url"]
            }
        }
        for s in detected_signs
    ]

    # Hợp nhất và chống trùng lặp trong phạm vi 15m
    merged_features = list(existing_features)
    for nf in new_features:
        n_lon, n_lat = nf["geometry"]["coordinates"]
        is_dup = False
        for ef in existing_features:
            e_lon, e_lat = ef["geometry"]["coordinates"]
            if math.hypot(n_lon - e_lon, n_lat - e_lat) * 111320 < 15.0:
                is_dup = True
                break
        if not is_dup:
            merged_features.append(nf)

    geojson = {
        "type": "FeatureCollection",
        "features": merged_features
    }
    
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
        
    print(f"\n[+] Đã hoàn thành nhận diện đợt này! Tìm thấy mới {len(detected_signs)} biển báo. Tổng tích lũy: {len(merged_features)} biển.")
    print(f"[+] Dữ liệu GeoJSON tọa độ biển báo đã lưu tại: {geojson_path}")
    return detected_signs


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, default="exports/web_streetview/captured_frames.json")
    parser.add_argument("--model", type=str, default="yolov8n.pt")
    parser.add_argument("--out", type=str, default="exports/web_streetview")
    args = parser.parse_args()

    process_manifest(args.manifest, model_path=args.model, output_dir=args.out)
