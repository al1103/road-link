import os
import sys
import json
import math
import argparse
import requests
import cv2
import numpy as np
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/appdb")


def get_db_connection():
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"[!] Database connection failed: {e}")
        return None


def get_streetview_metadata(lat, lng):
    if not GOOGLE_MAPS_API_KEY:
        print("[!] Warning: GOOGLE_MAPS_API_KEY is not set.")
    url = f"https://maps.googleapis.com/maps/api/streetview/metadata?location={lat},{lng}&key={GOOGLE_MAPS_API_KEY}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        if data.get("status") == "OK":
            return {
                "pano_id": data.get("pano_id"),
                "lat": data["location"]["lat"],
                "lng": data["location"]["lng"],
                "date": data.get("date")
            }
        print(f"Street View status: {data.get('status')}")
    except Exception as e:
        print(f"Error fetching metadata: {e}")
    return None


def fetch_streetview_image(lat, lng, heading, fov=90, pitch=0):
    url = (
        f"https://maps.googleapis.com/maps/api/streetview"
        f"?size=640x640&location={lat},{lng}&heading={heading}&pitch={pitch}&fov={fov}&key={GOOGLE_MAPS_API_KEY}"
    )
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            image_bytes = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
            return img, url
    except Exception as e:
        print(f"Error downloading image: {e}")
    return None, None


def calculate_sign_coordinates(cam_lat, cam_lng, heading, bbox, img_w, fov=90, default_distance=6.0):
    x1, y1, x2, y2 = bbox
    center_x = (x1 + x2) / 2.0
    
    angle_offset = ((center_x - (img_w / 2.0)) / (img_w / 2.0)) * (fov / 2.0)
    bearing = (heading + angle_offset) % 360.0
    
    R = 6378137.0
    bearing_rad = math.radians(bearing)
    lat_rad = math.radians(cam_lat)
    lng_rad = math.radians(cam_lng)
    
    sign_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(default_distance / R) +
        math.cos(lat_rad) * math.sin(default_distance / R) * math.cos(bearing_rad)
    )
    sign_lng_rad = lng_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(default_distance / R) * math.cos(lat_rad),
        math.cos(default_distance / R) - math.sin(lat_rad) * math.sin(sign_lat_rad)
    )
    
    return math.degrees(sign_lat_rad), math.degrees(sign_lng_rad), bearing


def save_sign_to_database(conn, sign_type, confidence, pano_id, image_url, lat, lng):
    if not conn:
        return None
    try:
        with conn.cursor() as cur:
            query = """
                INSERT INTO "TrafficSign" ("id", "signType", "confidence", "panoId", "imageUrl", "location", "createdAt", "updatedAt")
                VALUES (
                    gen_random_uuid(),
                    %s,
                    %s,
                    %s,
                    %s,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                    NOW(),
                    NOW()
                )
                RETURNING "id";
            """
            cur.execute(query, (sign_type, confidence, pano_id, image_url, lng, lat))
            inserted_id = cur.fetchone()[0]
            conn.commit()
            return inserted_id
    except Exception as e:
        conn.rollback()
        print(f"[!] Error saving to DB: {e}")
        return None


def scan_location(lat, lng, model_path="yolov8n.pt", save_db=True, output_dir="exports/streetview_signs"):
    from ultralytics import YOLO

    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[*] Checking Street View at ({lat}, {lng})...")
    meta = get_streetview_metadata(lat, lng)
    if not meta:
        print(f"[-] No Street View imagery available at: {lat}, {lng}")
        return []

    print(f"[+] Found Panorama ID: {meta['pano_id']} ({meta['lat']}, {meta['lng']})")
    
    print(f"[*] Loading YOLO model ({model_path})...")
    model = YOLO(model_path)
    
    conn = get_db_connection() if save_db else None
    
    detected_signs = []
    headings = [0, 90, 180, 270]
    
    for heading in headings:
        print(f" -> Fetching heading {heading}°...")
        img, img_url = fetch_streetview_image(meta["lat"], meta["lng"], heading=heading)
        if img is None:
            continue
            
        results = model.predict(source=img, conf=0.35, verbose=False)
        for res in results:
            for box in res.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                label = model.names[cls_id]
                
                # Loại bỏ hoàn toàn đèn tín hiệu giao thông / đèn đỏ (Class 9 trong COCO) theo yêu cầu
                if cls_id == 9 or "light" in label.lower() or "traffic light" in label.lower():
                    continue

                # Chỉ nhận diện biển báo giao thông hoặc stop sign (Class 11)
                is_sign = ("sign" in label.lower()) or (cls_id == 11)
                if not is_sign:
                    continue
                    
                bbox = box.xyxy[0].tolist()
                bx_center = (bbox[0] + bbox[2]) / 2.0
                by_center = (bbox[1] + bbox[3]) / 2.0
                img_h, img_w = img.shape[:2]

                # Bắt buộc biển báo phải ở bên lề đường (không nằm sát đất và không nằm giữa tim đường ở tầm thấp)
                if by_center > 0.62 * img_h:
                    continue
                if (0.38 * img_w <= bx_center <= 0.62 * img_w) and (by_center >= 0.35 * img_h):
                    continue

                sign_lat, sign_lng, bearing = calculate_sign_coordinates(
                    meta["lat"], meta["lng"], heading, bbox, img.shape[1]
                )
                
                sign_id = None
                if conn:
                    sign_id = save_sign_to_database(
                        conn, label, conf, meta["pano_id"], img_url, sign_lat, sign_lng
                    )
                
                sign_data = {
                    "id": sign_id,
                    "type": label,
                    "confidence": round(conf, 3),
                    "pano_id": meta["pano_id"],
                    "latitude": sign_lat,
                    "longitude": sign_lng,
                    "bearing": round(bearing, 1),
                    "camera_lat": meta["lat"],
                    "camera_lng": meta["lng"],
                    "image_url": img_url
                }
                detected_signs.append(sign_data)
                print(f"  [+] Detected '{label}' ({conf:.2f}) -> GPS: {sign_lat:.6f}, {sign_lng:.6f}")
                
        # Save snapshot
        img_filename = os.path.join(output_dir, f"{meta['pano_id']}_{heading}.jpg")
        cv2.imwrite(img_filename, img)
        
    if conn:
        conn.close()
        
    # Export results to JSON
    json_path = os.path.join(output_dir, f"signs_{meta['pano_id']}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(detected_signs, f, indent=2, ensure_ascii=False)
    print(f"[+] Scan completed. Found {len(detected_signs)} signs. Output saved to {json_path}")
    
    return detected_signs


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan Google Street View for Traffic Signs and extract GPS coordinates")
    parser.add_argument("--lat", type=float, default=21.028511, help="Latitude")
    parser.add_argument("--lng", type=float, default=105.854444, help="Longitude")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Path to YOLO model")
    parser.add_argument("--no-db", action="store_true", help="Do not save to database, only export JSON")
    parser.add_argument("--out", type=str, default="exports/streetview_signs", help="Output directory")

    args = parser.parse_args()
    scan_location(args.lat, args.lng, model_path=args.model, save_db=not args.no_db, output_dir=args.out)
