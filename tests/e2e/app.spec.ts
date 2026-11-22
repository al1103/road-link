import {test,expect,type Page} from '@playwright/test';

async function chooseCoordinate(page:Page,value:string,origin=false) {
  await page.getByRole('textbox',{name:origin?'Tìm điểm đi':'Tìm địa điểm',exact:true}).fill(value);
  await page.getByRole('button',{name:'Tìm kiếm',exact:true}).click();
  await page.locator('.place-result').filter({hasText:'Tọa độ đã nhập'}).click();
}
async function manualRoute(page:Page,destination='10.7721,106.6983',origin='10.77975,106.699') {
  await chooseCoordinate(page,destination);
  await page.getByRole('button',{name:'Chỉ đường',exact:true}).click();
  await page.getByRole('button',{name:'Đổi điểm đi',exact:true}).click();
  await chooseCoordinate(page,origin,true);
  await expect(page.getByText('Tuyến đề xuất',{exact:true})).toBeVisible({timeout:30000});
}
test('one basemap through place selection and a route from entered coordinates',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.maplibregl-map')).toHaveCount(1);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-basemap','openfreemap-osm');
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-map-ready','true',{timeout:30000});
  await expect(page.locator('.position-marker,.road-poi-marker,.quick-destinations')).toHaveCount(0);
  await manualRoute(page);
  await expect(page.locator('.maplibregl-map')).toHaveCount(1);
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(1);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-basemap','openfreemap-osm');
  await expect(page.getByRole('button',{name:'Xem trước các chặng',exact:true})).toBeVisible();
  await expect(page.locator('.notice,.road-alert-banner,[data-sonner-toaster],.Toastify')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/${info.project.name}-live-route.png`});
  expect(errors).toEqual([]);
});
test('actual bundled road source loads without online fallback',async({page},info)=>{
  const sourceResponses:Array<{url:string;status:number}>=[];
  let overpass=0;
  page.on('response',r=>{if(r.url().includes('/data/vn-osm-20261120/tiles/'))sourceResponses.push({url:r.url(),status:r.status()});});
  page.on('request',r=>{if(r.url().includes('/api/interpreter'))overpass++;});
  await page.goto('/');await manualRoute(page);
  await page.getByRole('button',{name:'Mở dữ liệu đường',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Dữ liệu Việt Nam trên thiết bị',{timeout:20000});
  await expect(page.locator('[data-road-scope="route"]')).toHaveAttribute('data-scan-complete','true',{timeout:30000});
  expect(sourceResponses.length).toBeGreaterThan(0);expect(sourceResponses.every(r=>r.status===200)).toBe(true);expect(overpass).toBe(0);
  await expect(page.getByLabel('Chú giải ký hiệu')).toContainText('Đèn giao thông');
  await expect.poll(()=>page.locator('.road-feature-image').evaluateAll((items:HTMLImageElement[])=>items.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  const pointCount=Number(await page.getByRole('heading',{name:/Điểm gần tuyến đang hiển thị/}).locator('span').innerText());
  expect(pointCount).toBeGreaterThan(0);
  for(const name of ['Camera','Biển báo','Đèn giao thông'])await page.getByRole('checkbox',{name,exact:true}).uncheck();
  await expect(page.getByRole('heading',{name:/Điểm gần tuyến đang hiển thị/})).toHaveText('Điểm gần tuyến đang hiển thị 0');
  await expect(page.getByRole('dialog')).toContainText(`Có ${pointCount} điểm phía trước trong dữ liệu đã tải, nhưng đang bị bộ lọc ẩn.`);
  await page.getByRole('button',{name:'Hiện tất cả điểm',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Điểm gần tuyến đang hiển thị/}).locator('span')).toHaveText(String(pointCount));
  await page.screenshot({path:`test-results/${info.project.name}-live-road-source.png`});
});
test('Tien Hai to Hanoi shows the full-route points beyond the initial 6 km',async({page},info)=>{
  test.setTimeout(120000);
  await page.goto('/');await manualRoute(page,'21.0283334,105.854041','20.4057073,106.5031738');
  await page.getByRole('button',{name:'Mở dữ liệu đường',exact:true}).click();
  await expect(page.locator('[data-road-scope="route"]')).toHaveAttribute('data-scan-complete','true',{timeout:60000});
  await expect(page.locator('[data-road-scope="route"]')).toContainText('Toàn tuyến:');
  const count=Number(await page.getByRole('heading',{name:/Điểm gần tuyến đang hiển thị/}).locator('span').innerText());
  expect(count).toBeGreaterThan(0);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-map-ready','true',{timeout:30000});
  await expect(page.locator('.road-poi-marker')).toHaveCount(count);
  await expect(page.locator('.road-feature-list')).toContainText(/1\d\d,\d km/);
  await page.screenshot({path:`test-results/${info.project.name}-tien-hai-ha-noi-full-route.png`});
});
test('3D changes the camera and renders actual building geometry',async({page},info)=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page.locator('.map-canvas')).toHaveAttribute('data-map-ready','true',{timeout:30000});
  await chooseCoordinate(page,'21.0283334,105.854041');
  await page.getByRole('button',{name:'Chuyển bản đồ 3D',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('.map-canvas').getAttribute('data-map-pitch')),{timeout:15000}).toBeGreaterThan(45);
  await expect.poll(async()=>Number(await page.locator('.map-canvas').getAttribute('data-visible-buildings')),{timeout:60000}).toBeGreaterThan(0);
  await expect(page.locator('.maplibregl-map')).toHaveCount(1);
  await page.screenshot({path:`test-results/${info.project.name}-hanoi-3d.png`});
  await page.getByRole('button',{name:'Chuyển bản đồ 2D',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('.map-canvas').getAttribute('data-map-pitch')),{timeout:15000}).toBeLessThan(1);
  expect(errors).toEqual([]);
});
test('GPS request from the map control does not raise floating errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Về vị trí của tôi',exact:true}).click();
  await expect(page.locator('.notice,.road-alert-banner')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('searches a real Vietnamese place with the configured geocoder',async({page})=>{
  await page.goto('/');
  await page.getByRole('textbox',{name:'Tìm địa điểm',exact:true}).fill('Chợ Bến Thành, Thành phố Hồ Chí Minh');
  await page.getByRole('button',{name:'Tìm kiếm',exact:true}).click();
  await expect(page.locator('.place-result').first()).toContainText('Bến Thành',{timeout:25000});
  await page.locator('.place-result').first().click();
  await expect(page.locator('.place-title-row h1')).toContainText('Bến Thành');
  await expect(page.locator('.position-marker')).toHaveCount(0);
});
