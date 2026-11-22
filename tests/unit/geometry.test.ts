import {describe,it,expect} from 'vitest';
import {distance,bearing,formatDistance,formatDuration,pointAt,projectOnRoute,cumulative} from '../../src/domain/geometry';
import {parseSpeed,limitForCar} from '../../src/domain/roadData';
describe('pure calculations',()=>{
  it('uses metric great-circle distance',()=>{
    expect(distance({lat:0,lng:0},{lat:0,lng:1})).toBeCloseTo(111194.93,0);
    expect(distance({lat:10,lng:106},{lat:10,lng:106})).toBe(0);
  });
  it('measures a bearing relative to north',()=>{
    expect(bearing({lat:0,lng:0},{lat:1,lng:0})).toBeCloseTo(0,5);
    expect(bearing({lat:0,lng:0},{lat:0,lng:1})).toBeCloseTo(90,5);
    expect(bearing({lat:1,lng:0},{lat:0,lng:0})).toBeCloseTo(180,5);
    expect(bearing({lat:0,lng:1},{lat:0,lng:0})).toBeCloseTo(270,5);
  });
  it('formats Vietnamese distances and durations',()=>{
    expect(formatDistance(1500)).toBe('1,5 km');
    expect(formatDistance(25)).toBe('30 m');
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDuration(3661)).toBe('1 giờ 2 phút');
    expect(formatDuration(45)).toBe('1 phút');
    expect(formatDuration(3600)).toBe('1 giờ 0 phút');
  });
  it('converts explicit speed units and leaves unknown values unknown',()=>{
    expect(parseSpeed('50')).toBe(50);expect(parseSpeed('50 mph')).toBe(80);
    expect(parseSpeed('VN:urban')).toBeNull();expect(parseSpeed('50|60')).toBeNull();
  });
  it('does not flatten a conditional speed value',()=>{
    expect(limitForCar({maxspeed:'80','maxspeed:conditional':'50 @ (wet)'},true).kmh).toBeNull();
  });
  it('projects coordinates onto route lines and respects along constraints',()=>{
    const line = [{lat: 10.0, lng: 106.0}, {lat: 10.01, lng: 106.0}];
    expect(() => projectOnRoute({lat: 10.0, lng: 106.0}, [{lat: 10.0, lng: 106.0}])).toThrow();
    const hit = projectOnRoute({lat: 10.005, lng: 106.0001}, line);
    expect(hit.distance).toBeGreaterThan(0);
    expect(hit.along).toBeGreaterThan(0);
    expect(hit.segment).toBe(0);
  });
  it('interpolates pointAt along cumulative distances',()=>{
    const line = [{lat: 10.0, lng: 106.0}, {lat: 10.02, lng: 106.0}];
    const lengths = cumulative(line);
    const mid = pointAt(line, lengths, lengths[1] / 2);
    expect(mid.lat).toBeCloseTo(10.01, 3);
    expect(mid.lng).toBeCloseTo(106.0, 3);
    expect(pointAt(line, lengths, -10)).toEqual(line[0]);
    expect(pointAt(line, lengths, lengths[1] + 100)).toEqual(line[1]);
  });
});
