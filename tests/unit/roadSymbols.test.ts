import { describe, it, expect } from 'vitest';
import { speedSignImage, roadSymbol } from '../../src/domain/roadSymbols';

describe('roadSymbols module', () => {
  it('returns valid sign paths for standard Vietnamese speed limits', () => {
    const standardSpeeds = [5, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    for (const kmh of standardSpeeds) {
      expect(speedSignImage(kmh)).toBe(`/signs/speed-${kmh}.svg`);
    }

    expect(speedSignImage(null)).toBeNull();
    expect(speedSignImage(0)).toBeNull();
    expect(speedSignImage(15)).toBeNull();
    expect(speedSignImage(45)).toBeNull();
    expect(speedSignImage(130)).toBeNull();
    expect(speedSignImage(-10)).toBeNull();
  });

  it('maps enforcement road features to correct SVG symbols', () => {
    expect(roadSymbol({ kind: 'traffic-camera', code: '' })).toEqual({ src: '/signs/camera.svg', standard: false });
    expect(roadSymbol({ kind: 'speed-camera', code: '' })).toEqual({ src: '/signs/camera.svg', standard: false });

    expect(roadSymbol({ kind: 'stop', code: '' })).toEqual({ src: '/signs/stop.svg', standard: true });
    expect(roadSymbol({ kind: 'prohibition', code: 'VN:R.122' })).toEqual({ src: '/signs/stop.svg', standard: true });
    expect(roadSymbol({ kind: 'give-way', code: '' })).toEqual({ src: '/signs/give-way.svg', standard: true });
    expect(roadSymbol({ kind: 'prohibition', code: 'VN:W.208' })).toEqual({ src: '/signs/give-way.svg', standard: true });
    expect(roadSymbol({ kind: 'signals', code: '' })).toEqual({ src: '/signs/traffic-signals.svg', standard: false });

    expect(roadSymbol({ kind: 'no-entry', code: 'VN:P.102' })).toEqual({ src: '/signs/no-entry.svg', standard: true });
    expect(roadSymbol({ kind: 'wrong-way', code: 'VN:P.103c' })).toEqual({ src: '/signs/wrong-way.svg', standard: true });
    expect(roadSymbol({ kind: 'no-overtaking', code: 'overtaking' })).toEqual({ src: '/signs/no-overtaking.svg', standard: true });
    expect(roadSymbol({ kind: 'prohibition', code: 'VN:P.130' })).toEqual({ src: '/signs/prohibition.svg', standard: true });

    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:P.127(60)' })).toEqual({ src: '/signs/speed-60.svg', standard: true });
    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:401,127[60]' })).toEqual({ src: '/signs/speed-60.svg', standard: true });
    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:P.127(15)' })).toEqual({ src: '/signs/unknown.svg', standard: false });
    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:unknown-code' })).toEqual({ src: '/signs/unknown.svg', standard: false });
  });
});
