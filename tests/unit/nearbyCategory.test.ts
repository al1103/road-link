import {afterEach,describe,expect,it,vi} from 'vitest';
import {categoryForQuery,nearbyCategory} from '../../src/services/api';
afterEach(()=>vi.unstubAllGlobals());
describe('categoryForQuery',()=>{
  it('maps known Vietnamese aliases (with and without diacritics) to a category key',()=>{
    expect(categoryForQuery('Cây xăng')).toBe('fuel');
    expect(categoryForQuery('cay xang')).toBe('fuel');
    expect(categoryForQuery('siêu thị')).toBe('shop');
    expect(categoryForQuery('ATM')).toBe('atm');
  });
  it('returns null for an unrecognized label',()=>{
    expect(categoryForQuery('bãi đỗ xe')).toBeNull();
  });
});
describe('nearbyCategory',()=>{
  it('queries only the matching category tags and reads way/center coordinates',async()=>{
    let query='';
    vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
      query=decodeURIComponent(String(url));
      return new Response(JSON.stringify({elements:[
        {id:10,type:'way',center:{lat:10.78,lon:106.70},tags:{amenity:'fuel',name:'Xăng dầu Petro'}}
      ]}),{status:200});
    }));
    const list=await nearbyCategory(10.78,106.70,'cây xăng');
    expect(query).toContain('"amenity"="fuel"');
    expect(query).not.toContain('restaurant');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({name:'Xăng dầu Petro',detail:'Cây xăng',lat:10.78,lng:106.70});
  });
  it('returns an empty list for a category with no matching tags', async()=>{
    const fetchSpy=vi.fn();
    vi.stubGlobal('fetch',fetchSpy);
    const list=await nearbyCategory(1,1,'không tồn tại');
    expect(list).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
