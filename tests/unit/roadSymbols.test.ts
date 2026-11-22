import { describe, it, expect } from 'vitest';
import { speedSignImage, roadSymbol } from '../../src/domain/roadSymbols';

describe('roadSymbols module', () => {
  it('returns valid sign paths for standard Vietnamese speed limits', () => {
    const standardSpeeds = [5, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    for (const kmh of standardSpeeds) {
      expect(speedSignImage(kmh)).toBe(`/signs/speed-${kmh}.svg`);
    }

    // Unsupported or boundary speeds return null
    expect(speedSignImage(null)).toBeNull();
    expect(speedSignImage(0)).toBeNull();
    expect(speedSignImage(15)).toBeNull();
    expect(speedSignImage(45)).toBeNull();
    expect(speedSignImage(130)).toBeNull();
    expect(speedSignImage(-10)).toBeNull();
  });

  it('maps road features to correct SVG symbols and standard status', () => {
    // Camera
    expect(roadSymbol({ kind: 'camera', code: '' })).toEqual({
      src: '/signs/camera.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'speed-camera', code: '' })).toEqual({
      src: '/signs/camera.svg',
      standard: false,
    });

    // Stop sign
    expect(roadSymbol({ kind: 'stop', code: '' })).toEqual({
      src: '/signs/stop.svg',
      standard: true,
    });
    expect(roadSymbol({ kind: 'sign', code: 'VN:R.122' })).toEqual({
      src: '/signs/stop.svg',
      standard: true,
    });

    // Give way sign
    expect(roadSymbol({ kind: 'give-way', code: '' })).toEqual({
      src: '/signs/give-way.svg',
      standard: true,
    });
    expect(roadSymbol({ kind: 'sign', code: 'VN:W.208' })).toEqual({
      src: '/signs/give-way.svg',
      standard: true,
    });

    // Signals & crossings
    expect(roadSymbol({ kind: 'signals', code: '' })).toEqual({
      src: '/signs/traffic-signals.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'rail-crossing', code: '' })).toEqual({
      src: '/signs/warning-rail.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'pedestrian-crossing', code: '' })).toEqual({
      src: '/signs/warning-pedestrian.svg',
      standard: false,
    });

    // Traffic calming
    expect(roadSymbol({ kind: 'traffic-calming', code: 'traffic_calming=hump' })).toEqual({
      src: '/signs/warning-hump.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'traffic-calming', code: 'traffic_calming=island' })).toEqual({
      src: '/signs/warning-general.svg',
      standard: false,
    });

    // Hazards
    expect(roadSymbol({ kind: 'hazard', code: 'hazard=school' })).toEqual({
      src: '/signs/warning-school.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'hazard', code: 'hazard=dangerous_bend' })).toEqual({
      src: '/signs/warning-bend.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'hazard', code: 'hazard=slippery' })).toEqual({
      src: '/signs/warning-slippery.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'hazard', code: 'hazard=narrow_road' })).toEqual({
      src: '/signs/warning-narrow.svg',
      standard: false,
    });
    expect(roadSymbol({ kind: 'hazard', code: 'hazard=flooding' })).toEqual({
      src: '/signs/warning-general.svg',
      standard: false,
    });

    // Speed sign standard code VN:P.127(kmh)
    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:P.127(60)' })).toEqual({
      src: '/signs/speed-60.svg',
      standard: true,
    });
    expect(roadSymbol({ kind: 'speed-sign', code: 'VN:P.127(15)' })).toEqual({
      src: '/signs/unknown.svg',
      standard: false,
    });

    // Unknown feature
    expect(roadSymbol({ kind: 'sign', code: 'VN:unknown-code' })).toEqual({
      src: '/signs/unknown.svg',
      standard: false,
    });
  });
});
