import os
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
        
        results = model.predict(source=img_path, conf=0.30, verbose=False)
        for res in results:
            img_w = res.orig_shape[1]
            for box in res.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                label = model.names[cls_id]
                
                # Biển báo giao thông hoặc stop sign
                is_sign = ("sign" in label.lower()) or (cls_id in [9, 11])
                if not is_sign:
                    continue
                    
                bbox = box.xyxy[0].tolist()
                sign_lat, sign_lng, bearing = calculate_sign_gps(
                    cam_lat, cam_lng, heading, bbox, img_w, fov=fov
                )
                
                sign_record = {
                    "type": label,
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
                print(f"  [+] Tìm thấy '{label}' ({conf:.2f}) -> Tọa độ biển báo: {sign_lat:.6f}, {sign_lng:.6f}")

    geojson_path = os.path.join(output_dir, "detected_traffic_signs.geojson")
    geojson = {
        "type": "FeatureCollection",
        "features": [
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
    }
    
    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
        
    print(f"\n[+] Đã hoàn thành nhận diện! Tìm thấy {len(detected_signs)} biển báo.")
    print(f"[+] Dữ liệu GeoJSON tọa độ biển báo đã lưu tại: {geojson_path}")
    return detected_signs


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, default="exports/web_streetview/captured_frames.json")
    parser.add_argument("--model", type=str, default="yolov8n.pt")
    parser.add_argument("--out", type=str, default="exports/web_streetview")
    args = parser.parse_args()

    process_manifest(args.manifest, model_path=args.model, output_dir=args.out)
