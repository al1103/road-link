import os
import sys
import json
import argparse
from detect_streetview_signs import scan_location

def scan_route_points(points, model_path="yolov8n.pt", save_db=False, out_dir="exports/streetview_signs"):
    os.makedirs(out_dir, exist_ok=True)
    all_signs = []
    
    print(f"[*] Starting batch scan for {len(points)} waypoints...")
    for idx, (lat, lng) in enumerate(points):
        print(f"\n[{idx + 1}/{len(points)}] Scanning point: {lat}, {lng}")
        try:
            signs = scan_location(lat, lng, model_path=model_path, save_db=save_db, output_dir=out_dir)
            all_signs.extend(signs)
        except Exception as e:
            print(f"[!] Error scanning {lat}, {lng}: {e}")
            
    summary_path = os.path.join(out_dir, "route_signs_summary.geojson")
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
                    "id": s.get("id"),
                    "type": s["type"],
                    "confidence": s["confidence"],
                    "bearing": s.get("bearing"),
                    "pano_id": s["pano_id"],
                    "image_url": s.get("image_url")
                }
            }
            for s in all_signs
        ]
    }
    
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
        
    print(f"\n[+] Batch scan complete. Total signs found: {len(all_signs)}")
    print(f"[+] GeoJSON exported to: {summary_path}")
    return all_signs

if __name__ == "__main__":
    sample_points = [
        (21.028511, 105.854444),
        (21.027800, 105.852300),
        (21.030100, 105.851200)
    ]
    scan_route_points(sample_points, save_db=False)
