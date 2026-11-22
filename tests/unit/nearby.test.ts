import {afterEach,describe,expect,it,vi} from 'vitest';
import {nearbyPlaces} from '../../src/services/api';
afterEach(()=>vi.unstubAllGlobals());
describe('nearby places',()=>{
  it('falls back to the second Overpass host and sorts by distance',async()=>{
    const calls:string[]=[];
    vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
      calls.push(String(url));
      if(calls.length===1)return new Response('busy',{status:502});
      return new Response(JSON.stringify({elements:[
        {id:1,lat:20.37,lon:106.55,tags:{amenity:'cafe',name:'Xa'}},
        {id:2,lat:20.361,lon:106.55,tags:{amenity:'restaurant',name:'Gần','addr:street':'Gần'}},
        {id:3,lat:20.3605,lon:106.55,tags:{amenity:'fuel'}},
        {id:4,lat:20.3605,lon:106.55,tags:{shop:'convenience',name:'Tạp hóa'}}
      ]}),{status:200});
    }));
    const list=await nearbyPlaces(20.36,106.55);
    expect(calls).toHaveLength(2);
    expect(calls[1]).not.toBe(calls[0]);
    expect(list.map(place=>place.name)).toEqual(['Tạp hóa','Gần','Xa']);
    expect(list[1].detail).toBe('Nhà hàng');
    expect(list[0].detail).toBe('Tạp hóa');
  });
});
