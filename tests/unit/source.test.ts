import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {roadSymbol} from '../../src/domain/roadSymbols';
const base=new URL('../../public/data/vn-osm-20261120/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'));
describe('published Vietnam OSM source',()=>{
  it('keeps enforcement-relevant road features in the source pack',()=>{
    expect(manifest.featureRevision).toBe('warnings-v2');
    for(const kind of ['traffic_sign','speed_camera','traffic_signals','stop','give_way'])expect(manifest.nodeKinds[kind]).toBeGreaterThan(0);
  });
  it('retains the actual OSM STOP object used near the playback waypoint',()=>{
    const tile=manifest.tiles['209_1058'];
    const data=JSON.parse(readFileSync(new URL(tile.path,base),'utf8'));
    expect(data.elements.find((e:{id:number})=>e.id===10688320858)?.tags.traffic_sign).toBe('stop');
  });
  it('retains source identity and licensing',()=>{
    expect(manifest.country).toBe('VN');expect(manifest.license).toBe('ODbL-1.0');
    expect(new URL(manifest.sourceUrl).hostname).toBe('download.geofabrik.de');
    expect(manifest.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('checks the actual HCMC shard against its publisher manifest',()=>{
    const tile=manifest.tiles['107_1066'],bytes=readFileSync(new URL(tile.path,base));
    expect(bytes.length).toBe(tile.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(tile.sha256);
    const data=JSON.parse(bytes.toString('utf8'));
    expect(data.elements.length).toBe(tile.elements);
    expect(data.elements.every((e:{id:number;type:string})=>Number.isSafeInteger(e.id)&&e.id>0&&['node','way'].includes(e.type))).toBe(true);
    expect(data.elements.some((e:{tags?:Record<string,string>})=>e.tags?.highway==='traffic_signals')).toBe(true);
  });
  it('uses different symbols for signals and cameras',()=>{
    const signal=roadSymbol({kind:'signals',code:''}),camera=roadSymbol({kind:'traffic-camera',code:''});
    expect(signal.src).not.toBe(camera.src);
    for(const symbol of [signal,camera])expect(readFileSync(new URL('../../public'+symbol.src,import.meta.url),'utf8')).toContain('<svg');
  });
});
