import cv2, os, glob
import numpy as np
from ultralytics import YOLO

OUT_DIR = 'exports/camera_hotspots_check'
ART_DIR = '/Users/tuanpa/.gemini/antigravity/brain/e7e8ee9e-c2e9-4269-9ced-a6333a85271e'

model = YOLO('yolov8n.pt')

hotspots = [
    {
        'id': 'spot22_phamhung_metri',
        'name': 'Phạm Hùng – Mễ Trì',
        'coord': (21.017360, 105.780120),
        'desc': 'Nút giao Vành Đai 3 - Mễ Trì (Keangnam Landmark 72)'
    },
    {
        'id': 'spot13_xuanthuy_nps',
        'name': 'Xuân Thủy – Nguyễn Phong Sắc',
        'coord': (21.036650, 105.787620),
        'desc': 'Trục đường Cầu Giấy - ĐHQGHN'
    },
    {
        'id': 'spot15_kdt_tranduyhung',
        'name': 'Khuất Duy Tiến – Trần Duy Hưng',
        'coord': (21.004950, 105.792840),
        'desc': 'Nút giao Big C Thăng Long - Đại Lộ Thăng Long'
    }
]

def analyze_all():
    for spot in hotspots:
        sid = spot['id']
        sname = spot['name']
        print(f'\n=================== ANALYZING: {sname} ===================')
        
        for h in [0, 90, 180, 270]:
            img_path = os.path.join(OUT_DIR, f'{sid}_h{h}.jpg')
            if not os.path.exists(img_path):
                continue
            img = cv2.imread(img_path)
            if img is None:
                continue
            H, W = img.shape[:2]
            
            # Save copy to artifacts
            art_img_name = f'{sid}_h{h}.jpg'
            cv2.imwrite(os.path.join(ART_DIR, art_img_name), img)
            
            # Run YOLO
            results = model(img, conf=0.15)
            r = results[0]
            
            overhead_objs = []
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                cy = (y1 + y2) / 2.0
                cx = (x1 + x2) / 2.0
                
                # Check upper road space (0.05*H <= cy <= 0.48*H)
                if 0.05 * H <= cy <= 0.48 * H:
                    overhead_objs.append((cls_name, conf, [x1, y1, x2, y2]))
                    print(f'  [Heading {h}] Overhead: {cls_name} ({conf:.2f}) at [{x1}, {y1}, {x2}, {y2}]')
            
            # Create annotated overview
            ann = img.copy()
            for obj_cls, obj_conf, (bx1, by1, bx2, by2) in overhead_objs:
                cv2.rectangle(ann, (bx1, by1), (bx2, by2), (0, 255, 255), 2)
                cv2.putText(ann, f'{obj_cls} {obj_conf:.2f}', (bx1, max(15, by1 - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            
            ann_name = f'{sid}_h{h}_annotated.jpg'
            cv2.imwrite(os.path.join(ART_DIR, ann_name), ann)
            
    print('\n[+] Analysis complete!')

if __name__ == '__main__':
    analyze_all()

