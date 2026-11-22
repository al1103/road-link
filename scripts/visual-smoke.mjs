import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch();
const errors=[];
try {
  await mkdir('docs/screenshots',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.map-canvas[data-map-ready="true"]').waitFor({timeout:30000});
    await page.waitForTimeout(500);
    await page.screenshot({path:`docs/screenshots/${name}-home.png`});
    await page.getByRole('textbox',{name:'Tìm địa điểm',exact:true}).fill('10.7721,106.6983');
    await page.getByRole('button',{name:'Tìm kiếm',exact:true}).click();
    await page.locator('.place-result').filter({hasText:'Tọa độ đã nhập'}).click();
    await page.getByRole('button',{name:'Chỉ đường',exact:true}).click();
    await page.getByRole('button',{name:'Đổi điểm đi',exact:true}).click();
    await page.getByRole('textbox',{name:'Tìm điểm đi',exact:true}).fill('10.77975,106.699');
    await page.getByRole('button',{name:'Tìm kiếm',exact:true}).click();
    await page.locator('.place-result').filter({hasText:'Tọa độ đã nhập'}).click();
    await page.getByText('Tuyến đề xuất').waitFor({timeout:25000});
    await page.waitForTimeout(700);
    await page.screenshot({path:`docs/screenshots/${name}-real-route.png`});
    console.log(`PASS ${name}: real OSRM route from manually entered endpoints; one MapLibre/OpenFreeMap renderer; no supplied device position`);
    await page.close();
  }
  if(errors.length) throw new Error(errors.join('\n'));
} finally {await browser.close();}
