import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1});
  await page.setContent('<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#087f72"/><circle cx="512" cy="512" r="335" stroke="#ffffff" stroke-opacity=".1" stroke-width="2" fill="none"/><circle cx="512" cy="512" r="425" stroke="#ffffff" stroke-opacity=".07" stroke-width="2" fill="none"/><path d="M512 210 740 770 512 644 284 770Z" fill="#fff"/></svg></body></html>');
  await page.screenshot({path:'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'});
  await page.setViewportSize({width:1024,height:1024});
  await page.setContent('<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#f5f8f7"/><rect x="442" y="397" width="140" height="140" rx="43" fill="#087f72"/><path d="m512 430 36 78-36-19-36 19z" fill="#fff"/><text x="512" y="596" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="#173e39" letter-spacing="-2">roadlink</text><text x="512" y="635" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#819787" letter-spacing="4">YOUR WAY. CONNECTED.</text></svg></body></html>');
  const png=await page.screenshot();
  const directory='ios/App/App/Assets.xcassets/Splash.imageset';
  await writeFile(`${directory}/roadlink-splash.png`,png);
  await writeFile(`${directory}/Contents.json`,JSON.stringify({images:[{idiom:'universal',filename:'roadlink-splash.png','scale':'1x'}],info:{version:1,author:'xcode'}},null,2)+'\n');
  console.log('Generated RoadLink app icon and launch artwork.');
} finally { await browser.close(); }
