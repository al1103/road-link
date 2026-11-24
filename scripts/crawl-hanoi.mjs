import { runBatchCrawl } from './batch-crawl-vietnam.mjs';

export const HANOI_INTERSECTIONS = [
  { name: 'Ngã tư Tràng Tiền - Đinh Tiên Hoàng (Hoàn Kiếm)', lat: 21.025642, lng: 105.854215 },
  { name: 'Ngã năm Cửa Nam - Điện Biên Phủ (Ba Đình)', lat: 21.029815, lng: 105.841520 },
  { name: 'Ngã tư Kim Mã - Liễu Giai (Lotte Center)', lat: 21.031850, lng: 105.813720 },
  { name: 'Ngã tư Cầu Giấy - Trần Thái Tông (Cầu Giấy)', lat: 21.035410, lng: 105.791240 },
  { name: 'Nút giao Phạm Hùng - Trần Duy Hưng (Vành Đai 3)', lat: 21.006850, lng: 105.789120 },
  { name: 'Ngã sáu Ô Chợ Dừa - Xã Đàn (Đống Đa)', lat: 21.018920, lng: 105.828640 },
  { name: 'Ngã tư Đại Cồ Việt - Giải Phóng (Hai Bà Trưng)', lat: 21.008450, lng: 105.842710 },
  { name: 'Nút giao Khuất Duy Tiến - Nguyễn Trãi (Thanh Xuân)', lat: 20.993420, lng: 105.800150 },
  { name: 'Nút giao Võ Chí Công - Cầu Nhật Tân (Tây Hồ)', lat: 21.078920, lng: 105.811450 }
];

async function main() {
  const show = process.argv.includes('--show');
  console.log(`[*] BẮT ĐẦU QUÉT STREET VIEW KHU VỰC HÀ NỘI (${HANOI_INTERSECTIONS.length} NÚT GIAO CHÍNH)`);

  await runBatchCrawl({
    points: HANOI_INTERSECTIONS,
    outputDir: 'exports/hanoi_streetview',
    headless: !show,
    autoInject: true
  });
}

main();
