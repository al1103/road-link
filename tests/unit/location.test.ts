import {describe,it,expect} from 'vitest';
import {accuracyAllows,canPreviewFrom,canNavigateFrom,compassHeading,locationZoom} from '../../src/domain/location';
describe('location accuracy rules',()=>{
  it('permits an approximate route preview while waiting for navigation accuracy',()=>{
    expect(accuracyAllows(1000,1000,'preview')).toBe(true);
    expect(accuracyAllows(1000,1000,'navigation')).toBe(false);
  });
  it('retains the stricter threshold for turn-by-turn navigation',()=>{
    expect(accuracyAllows(65,15000,'navigation')).toBe(true);
    expect(accuracyAllows(66,0,'navigation')).toBe(false);
  });
  it('lets a recent cached location help preview without treating it as live GPS',()=>{
    expect(accuracyAllows(20,60000,'preview')).toBe(true);
    expect(accuracyAllows(20,60000,'navigation')).toBe(false);
    expect(accuracyAllows(20,120001,'preview')).toBe(false);
  });
  it('rejects invalid accuracy and future timestamps',()=>{
    expect(accuracyAllows(NaN,0,'preview')).toBe(false);
    expect(accuracyAllows(-1,0,'preview')).toBe(false);
    expect(accuracyAllows(1,-5001,'preview')).toBe(false);
  });
  it('never creates a usable location when no device position exists',()=>{
    expect(canPreviewFrom(null)).toBe(false);expect(canNavigateFrom(null)).toBe(false);
  });
  it('does not zoom an approximate fix as if it were precise',()=>{
    expect(locationZoom(1000)).toBeLessThan(locationZoom(5));
  });
  it('ignores a relative compass alpha that has no fixed north',()=>{
    expect(compassHeading({alpha:90})).toBeNull();
    expect(compassHeading({alpha:90,absolute:false})).toBeNull();
    expect(compassHeading({webkitCompassHeading:90,alpha:90,absolute:false})).toBe(90);
  });
  it('converts an absolute alpha into a compass bearing',()=>{
    expect(compassHeading({alpha:90,absolute:true})).toBe(270);
    expect(compassHeading({alpha:0,absolute:true})).toBe(0);
    expect(compassHeading({alpha:Number.NaN,absolute:true})).toBeNull();
  });
});
