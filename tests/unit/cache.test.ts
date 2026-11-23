import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createCache} from '../../src/services/cache';
describe('createCache',()=>{
  beforeEach(()=>vi.useFakeTimers());
  afterEach(()=>vi.useRealTimers());
  it('returns a cached value before it expires, and nothing after',()=>{
    const cache=createCache<string>(10,1000);
    cache.set('a','value');
    expect(cache.get('a')).toBe('value');
    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe('value');
    vi.advanceTimersByTime(2);
    expect(cache.get('a')).toBeUndefined();
  });
  it('evicts the oldest entry once past the max size',()=>{
    const cache=createCache<number>(2,60000);
    cache.set('a',1);
    cache.set('b',2);
    cache.set('c',3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });
  it('treats a freshly read entry as most recently used',()=>{
    const cache=createCache<number>(2,60000);
    cache.set('a',1);
    cache.set('b',2);
    cache.get('a');
    cache.set('c',3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });
});
