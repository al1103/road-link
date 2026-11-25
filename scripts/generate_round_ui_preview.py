import os
import math
from PIL import Image, ImageDraw, ImageFont

def generate_optimized_preview():
    W, H = 240, 240
    
    # 1. BẢN ĐỒ NỀN SÁNG (Light Vector Map)
    map_img = Image.new("RGBA", (W, H), (236, 239, 243, 255))
    map_draw = ImageDraw.Draw(map_img)

    # Vùng nước / sông (Light Blue)
    water_poly = [(0, 45), (42, 65), (55, 105), (48, 155), (32, 205), (0, 240), (0, 45)]
    map_draw.polygon(water_poly, fill=(175, 218, 245, 255))

    # Mảng công viên xanh
    park_poly = [(160, 115), (195, 110), (200, 140), (165, 145)]
    map_draw.polygon(park_poly, fill=(212, 238, 216, 255))

    # Mạng lưới đường phố
    map_draw.line([(0, 175), (240, 175)], fill=(255, 255, 255, 255), width=8)
    map_draw.line([(0, 175), (240, 175)], fill=(215, 220, 228, 255), width=1)
    
    map_draw.line([(115, 95), (240, 92)], fill=(255, 255, 255, 255), width=9)
    map_draw.line([(115, 95), (240, 92)], fill=(215, 220, 228, 255), width=1)

    # Đại lộ đôi màu vàng cam
    map_draw.line([(92, 0), (105, 90), (98, 170), (88, 240)], fill=(245, 175, 60, 255), width=10)
    map_draw.line([(107, 0), (120, 90), (113, 170), (103, 240)], fill=(255, 200, 95, 255), width=9)

    # Tuyến đường dẫn hướng (Route Path)
    route_pts = [(125, 160), (125, 95), (240, 92)]
    map_draw.line(route_pts, fill=(24, 119, 242, 255), width=7)
    map_draw.line(route_pts, fill=(110, 185, 255, 255), width=2)

    # Vị trí xe
    car_x, car_y = 125, 120
    map_draw.ellipse([car_x - 12, car_y - 12, car_x + 12, car_y + 12], fill=(24, 119, 242, 50))
    map_draw.ellipse([car_x - 8, car_y - 8, car_x + 8, car_y + 8], fill=(255, 255, 255, 255))
    map_draw.ellipse([car_x - 5, car_y - 5, car_x + 5, car_y + 5], fill=(24, 119, 242, 255))

    # --- MŨI TÊN RẼ TRÊN BẢN ĐỒ TO & RÕ NÉT (Giống ảnh mẫu thực tế) ---
    # Thân mũi tên rẽ trái đậm nét uốn lượn (dày 5px)
    map_draw.line([(88, 85), (88, 62)], fill=(16, 95, 225, 255), width=5)
    map_draw.line([(88, 62), (80, 62)], fill=(16, 95, 225, 255), width=5)
    # Đầu mũi tên rẽ trái to sắc sảo
    map_draw.polygon([(82, 53), (70, 62), (82, 71)], fill=(16, 95, 225, 255))

    # 2. TẠO LỚP HUD OVERLAY
    hud_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hud_draw = ImageDraw.Draw(hud_img)

    try:
        font_eta = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 15)
        font_speed = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 22)
        font_unit = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 9)
        font_sign = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 11)
        font_road = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 13)
        font_dist = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 17)
    except:
        font_eta = font_speed = font_unit = font_sign = font_road = font_dist = ImageFont.load_default()

    # --- TOP PILL: 7.28 km ---
    hud_draw.rounded_rectangle([76, 12, 164, 34], radius=11, fill=(255, 255, 255, 230), outline=(215, 222, 232, 255), width=1)
    hud_draw.text((120, 23), "7.28 km", fill=(16, 75, 185), font=font_eta, anchor="mm")

    # --- LEFT CLUSTER: Tốc độ & Biển giới hạn ---
    hud_draw.rounded_rectangle([20, 68, 62, 154], radius=21, fill=(255, 255, 255, 235), outline=(215, 222, 232, 255), width=1)
    sign_cx, sign_cy, sign_r = 41, 91, 13
    hud_draw.ellipse([sign_cx - sign_r, sign_cy - sign_r, sign_cx + sign_r, sign_cy + sign_r], fill=(255, 255, 255), outline=(225, 25, 25), width=3)
    hud_draw.text((sign_cx, sign_cy - 1), "60", fill=(20, 20, 20), font=font_sign, anchor="mm")

    hud_draw.text((41, 121), "0", fill=(20, 35, 60), font=font_speed, anchor="mm")
    hud_draw.text((41, 140), "km/h", fill=(70, 95, 130), font=font_unit, anchor="mm")

    # --- RIGHT COMPASS BADGE ---
    comp_cx, comp_cy, comp_r = 196, 118, 15
    hud_draw.ellipse([comp_cx - comp_r, comp_cy - comp_r, comp_cx + comp_r, comp_cy + comp_r], fill=(255, 255, 255, 230), outline=(215, 222, 232, 255), width=1)
    hud_draw.polygon([(comp_cx, comp_cy - 9), (comp_cx - 4, comp_cy + 5), (comp_cx + 4, comp_cy + 5)], fill=(220, 35, 35))
    hud_draw.polygon([(comp_cx, comp_cy + 5), (comp_cx - 4, comp_cy + 5), (comp_cx, comp_cy + 8)], fill=(120, 135, 155))
    hud_draw.text((comp_cx, comp_cy - 16), "N", fill=(60, 80, 110), font=font_unit, anchor="mm")

    # --- BOTTOM CARD: TÊN ĐƯỜNG & BIỂU TƯỢNG MŨI TÊN RẼ ĐẬM NÉT + KHOẢNG CÁCH ---
    hud_draw.rounded_rectangle([24, 168, 216, 226], radius=16, fill=(255, 255, 255, 240), outline=(215, 222, 232, 255), width=1)
    hud_draw.text((120, 183), "Hẻm 740 Võ Văn K", fill=(20, 40, 70), font=font_road, anchor="mm")

    # VẼ MŨI TÊN CHỈ HƯỚNG RẼ (MANEUVER ICON) CỰC KỲ RÕ RÀNG Ở THẺ DƯỚI
    # Icon rẽ trái: Thân mũi tên đậm 4px + Đầu mũi tên tam giác lớn
    arrow_cx = 92
    arrow_cy = 207
    hud_draw.line([(arrow_cx + 6, arrow_cy + 7), (arrow_cx + 6, arrow_cy - 2)], fill=(16, 85, 210), width=4)
    hud_draw.line([(arrow_cx + 6, arrow_cy - 2), (arrow_cx - 3, arrow_cy - 2)], fill=(16, 85, 210), width=4)
    hud_draw.polygon([(arrow_cx - 2, arrow_cy - 8), (arrow_cx - 10, arrow_cy - 2), (arrow_cx - 2, arrow_cy + 4)], fill=(16, 85, 210))

    # Khoảng cách đến khúc rẽ: 23 m (Đặt cạnh icon mũi tên rẽ)
    hud_draw.text((134, 206), "23 m", fill=(16, 75, 185), font=font_dist, anchor="mm")

    # Gộp ảnh
    final_canvas = Image.alpha_composite(map_img, hud_img).convert("RGB")

    # MASK TRÒN GC9A01
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([2, 2, W - 2, H - 2], fill=255)

    framed_img = Image.new("RGB", (W, H), (15, 18, 24))
    framed_img.paste(final_canvas, (0, 0), mask=mask)

    frame_draw = ImageDraw.Draw(framed_img)
    frame_draw.ellipse([1, 1, W - 1, H - 1], outline=(175, 190, 205), width=2)
    frame_draw.ellipse([3, 3, W - 3, H - 3], outline=(45, 55, 70), width=2)

    os.makedirs("exports", exist_ok=True)
    out_normal = "exports/esp32-round-preview.png"
    framed_img.save(out_normal)
    print(f"[+] Đã cập nhật ảnh preview chuẩn với mũi tên rẽ siêu rõ: {out_normal}")

    # CẢNH BÁO QUÁ TỐC ĐỘ
    ov_img = final_canvas.copy()
    ov_draw = ImageDraw.Draw(ov_img)

    ov_draw.rounded_rectangle([20, 68, 62, 154], radius=21, fill=(255, 235, 235, 245), outline=(235, 30, 30, 255), width=2)
    ov_draw.ellipse([sign_cx - sign_r, sign_cy - sign_r, sign_cx + sign_r, sign_cy + sign_r], fill=(230, 25, 25), outline=(255, 255, 255), width=2)
    ov_draw.text((sign_cx, sign_cy - 1), "60", fill=(255, 255, 255), font=font_sign, anchor="mm")
    ov_draw.text((41, 121), "68", fill=(230, 25, 25), font=font_speed, anchor="mm")
    ov_draw.text((41, 140), "km/h", fill=(200, 30, 30), font=font_unit, anchor="mm")

    ov_framed = Image.new("RGB", (W, H), (15, 18, 24))
    ov_framed.paste(ov_img, (0, 0), mask=mask)
    ov_frame_draw = ImageDraw.Draw(ov_framed)
    ov_frame_draw.ellipse([1, 1, W - 1, H - 1], outline=(255, 40, 40), width=4)

    out_ov = "exports/esp32-round-overspeed.png"
    ov_framed.save(out_ov)
    print(f"[+] Đã cập nhật ảnh overspeed: {out_ov}")

if __name__ == "__main__":
    generate_optimized_preview()
