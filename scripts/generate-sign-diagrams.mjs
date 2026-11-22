import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('public/signs',{recursive:true});
for(const n of [5,20,30,40,50,60,70,80,90,100,110,120]) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="white" stroke="#222" stroke-width="1"/><circle cx="50" cy="50" r="41" fill="white" stroke="#df1f26" stroke-width="12"/><text x="50" y="68" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${n>=100?47:56}" fill="#111">${n}</text></svg>`;
  await writeFile(`public/signs/speed-${n}.svg`,svg);
}
await writeFile('public/signs/stop.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M29 1h42l28 28v42L71 99H29L1 71V29Z" fill="#fff" stroke="#333"/><path d="M30 6h40l24 24v40L70 94H30L6 70V30Z" fill="#d91f26"/><text x="50" y="62" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="700" text-anchor="middle" fill="#fff">STOP</text></svg>');
await writeFile('public/signs/give-way.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><path d="M5 2h90q4 0 2 5L53 85q-3 5-6 0L3 7Q1 2 5 2Z" fill="#d91f26" stroke="#333" stroke-width=".7"/><path d="M17 13h66L50 72Z" fill="#fff"/></svg>');
await writeFile('public/signs/attribution.json',JSON.stringify({kind:'original-standard-style-svg-diagrams-not-street-photos',creator:'RoadLink',note:'SVG minh họa biển/loại đối tượng đường bộ. Vị trí và thuộc tính lấy từ OSM; hình vẽ không phải ảnh chụp hay bằng chứng có biển đã lắp tại một vị trí.',references:['https://commons.wikimedia.org/wiki/File:Vietnam_road_sign_P122.svg','https://commons.wikimedia.org/wiki/File:Vietnam_road_sign_W208.svg'],externalSvgUsed:false},null,2)+'\n');
console.log('Generated 14 road-sign SVG diagrams; camera/signal symbols are bundled separately.');
