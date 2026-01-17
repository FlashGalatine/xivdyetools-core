/**
 * RybColorMixer tests
 *
 * Tests for RYB (Red-Yellow-Blue) subtractive color mixing.
 * Ensures paint-like color mixing: Blue + Yellow = Green, etc.
 */

import { describe, it, expect } from 'vitest';
import { RybColorMixer } from '../RybColorMixer.js';
import { ColorConverter } from '../ColorConverter.js';

describe('RybColorMixer', () => {
  // ============================================================================
  // RYB to RGB Conversion
  // ============================================================================

  describe('rybToRgb', () => {
    // NOTE: This uses a SUBTRACTIVE (paint) model where:
    // - RYB (0,0,0) = White canvas (no pigment)
    // - RYB (1,1,1) = Dark sludge (all pigments mixed)

    it('should convert RYB no-pigment to RGB white (subtractive model)', () => {
      // In subtractive mixing, no pigment = white canvas
      const rgb = RybColorMixer.rybToRgb(0, 0, 0);
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert RYB all-pigments to dark muddy color (subtractive model)', () => {
      // In subtractive mixing, all pigments = dark sludge
      const rgb = RybColorMixer.rybToRgb(255, 255, 255);
      // Expected from RYB_CORNERS['1,1,1'] = { r: 0.2, g: 0.09, b: 0.0 }
      expect(rgb.r).toBeCloseTo(51, 0); // 0.2 * 255
      expect(rgb.g).toBeCloseTo(23, 0); // 0.09 * 255
      expect(rgb.b).toBe(0);
    });

    it('should convert RYB red to RGB red', () => {
      const rgb = RybColorMixer.rybToRgb(255, 0, 0);
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert RYB yellow to RGB yellow', () => {
      const rgb = RybColorMixer.rybToRgb(0, 255, 0);
      expect(rgb).toEqual({ r: 255, g: 255, b: 0 });
    });

    it('should convert RYB blue to RGB blue-ish (Gossett-Chen tuned)', () => {
      const rgb = RybColorMixer.rybToRgb(0, 0, 255);
      // Blue corner from RYB_CORNERS['0,0,1'] = { r: 0.163, g: 0.373, b: 0.6 }
      expect(rgb.r).toBeCloseTo(42, 0); // 0.163 * 255
      expect(rgb.g).toBeCloseTo(95, 0); // 0.373 * 255
      expect(rgb.b).toBeCloseTo(153, 0); // 0.6 * 255
    });

    it('should convert RYB yellow+blue to RGB green', () => {
      const rgb = RybColorMixer.rybToRgb(0, 255, 255);
      // Green corner from RYB_CORNERS['0,1,1'] = { r: 0.0, g: 0.66, b: 0.2 }
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBeCloseTo(168, 0); // 0.66 * 255
      expect(rgb.b).toBeCloseTo(51, 0); // 0.2 * 255
    });

    it('should convert RYB red+yellow to RGB orange', () => {
      const rgb = RybColorMixer.rybToRgb(255, 255, 0);
      // Orange corner from RYB_CORNERS['1,1,0'] = { r: 1.0, g: 0.5, b: 0.0 }
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBeCloseTo(128, 0); // 0.5 * 255
      expect(rgb.b).toBe(0);
    });

    it('should convert RYB red+blue to RGB violet', () => {
      const rgb = RybColorMixer.rybToRgb(255, 0, 255);
      // Violet corner from RYB_CORNERS['1,0,1'] = { r: 0.5, g: 0.0, b: 0.5 }
      expect(rgb.r).toBeCloseTo(128, 0); // 0.5 * 255
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBeCloseTo(128, 0); // 0.5 * 255
    });
  });

  // ============================================================================
  // RGB to RYB Conversion (Inverse)
  // ============================================================================

  describe('rgbToRyb', () => {
    // NOTE: This uses a SUBTRACTIVE (paint) model where:
    // - RYB (0,0,0) = White canvas (no pigment) → RGB (255,255,255)
    // - RYB (1,1,1) = Dark sludge (all pigments) → RGB ~(51,23,0)

    it('should convert RGB white to RYB no-pigment (subtractive model)', () => {
      // RGB white comes from no pigment in subtractive mixing
      const ryb = RybColorMixer.rgbToRyb(255, 255, 255);
      expect(ryb.r).toBeCloseTo(0, -1);
      expect(ryb.y).toBeCloseTo(0, -1);
      expect(ryb.b).toBeCloseTo(0, -1);
    });

    it('should convert RGB near-black to RYB high-pigment (subtractive model)', () => {
      // Pure RGB black (0,0,0) isn't exactly in the RYB gamut,
      // but should produce high pigment values approaching sludge
      const ryb = RybColorMixer.rgbToRyb(51, 23, 0); // The sludge color
      expect(ryb.r).toBeGreaterThan(200);
      expect(ryb.y).toBeGreaterThan(200);
      expect(ryb.b).toBeGreaterThan(200);
    });

    it('should convert RGB red to RYB red', () => {
      const ryb = RybColorMixer.rgbToRyb(255, 0, 0);
      // Red should be dominant in RYB
      expect(ryb.r).toBeGreaterThan(150);
      expect(ryb.y).toBeLessThan(100);
      expect(ryb.b).toBeLessThan(100);
    });

    it('should convert RGB green to RYB with yellow component', () => {
      // Note: Pure RGB green (0,255,0) isn't directly in the RYB gamut
      // The inverse approximation will produce yellow component since
      // green is made from Yellow+Blue in RYB
      const ryb = RybColorMixer.rgbToRyb(0, 255, 0);
      // R should be low (green has no red)
      expect(ryb.r).toBeLessThan(100);
      // Y should be high (green comes from yellow in RYB)
      expect(ryb.y).toBeGreaterThan(100);
    });

    it('should round-trip RGB → RYB → RGB with reasonable accuracy for RYB-compatible colors', () => {
      // Note: Pure RGB green (0,255,0) doesn't exist in the RYB cube,
      // so we only test colors that are representable in RYB space
      const testColors = [
        { r: 255, g: 0, b: 0 }, // Red - in RYB
        { r: 255, g: 255, b: 0 }, // Yellow - in RYB
        { r: 255, g: 128, b: 0 }, // Orange - in RYB
        { r: 128, g: 128, b: 128 }, // Gray - neutral
      ];

      for (const original of testColors) {
        const ryb = RybColorMixer.rgbToRyb(original.r, original.g, original.b);
        const roundTrip = RybColorMixer.rybToRgb(ryb.r, ryb.y, ryb.b);

        // Allow tolerance of 30 for round-trip (inverse is approximate)
        expect(Math.abs(roundTrip.r - original.r)).toBeLessThan(30);
        expect(Math.abs(roundTrip.g - original.g)).toBeLessThan(30);
        expect(Math.abs(roundTrip.b - original.b)).toBeLessThan(30);
      }
    });
  });

  // ============================================================================
  // Color Mixing
  // ============================================================================

  describe('mixColors', () => {
    it('should mix blue and yellow to produce green', () => {
      // This is the key test - RYB mixing should produce green, not gray
      const mixed = RybColorMixer.mixColors('#0000FF', '#FFFF00');
      const rgb = ColorConverter.hexToRgb(mixed);

      // Green should dominate
      expect(rgb.g).toBeGreaterThan(rgb.r);
      expect(rgb.g).toBeGreaterThan(rgb.b);
      // Should have significant green component
      expect(rgb.g).toBeGreaterThan(100);
    });

    it('should mix red and yellow to produce orange', () => {
      const mixed = RybColorMixer.mixColors('#FF0000', '#FFFF00');
      const rgb = ColorConverter.hexToRgb(mixed);

      // Orange: high R, medium G, low B
      // The Gossett-Chen algorithm produces slightly different values
      expect(rgb.r).toBeGreaterThan(180);
      expect(rgb.g).toBeGreaterThan(80);
      expect(rgb.g).toBeLessThan(200);
      expect(rgb.b).toBeLessThan(80);
    });

    it('should mix red and blue to produce violet/purple', () => {
      const mixed = RybColorMixer.mixColors('#FF0000', '#0000FF');
      const rgb = ColorConverter.hexToRgb(mixed);

      // Violet: R and B should both be present, G should be relatively low
      // In the subtractive model, violet corner is (0.5, 0, 0.5)
      expect(rgb.r).toBeGreaterThan(50);
      expect(rgb.b).toBeGreaterThan(50);
      expect(rgb.g).toBeLessThan(100); // Allow some green due to interpolation
    });

    it('should respect mix ratio', () => {
      const fullYellow = RybColorMixer.mixColors('#FF0000', '#FFFF00', 1.0);
      const fullRed = RybColorMixer.mixColors('#FF0000', '#FFFF00', 0.0);

      expect(fullYellow).toBe('#FFFF00');
      expect(fullRed).toBe('#FF0000');
    });

    it('should handle equal ratio mixing', () => {
      const mixed = RybColorMixer.mixColors('#FF0000', '#00FF00', 0.5);
      expect(mixed).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  // ============================================================================
  // Hex Conversion Utilities
  // ============================================================================

  describe('hexToRyb and rybToHex', () => {
    it('should convert hex to RYB', () => {
      const ryb = RybColorMixer.hexToRyb('#FF0000');
      expect(ryb.r).toBeGreaterThan(200);
    });

    it('should convert RYB to hex', () => {
      const hex = RybColorMixer.rybToHex(255, 0, 0);
      expect(hex).toBe('#FF0000');
    });

    it('should round-trip hex → RYB → hex', () => {
      const original = '#FF8800';
      const ryb = RybColorMixer.hexToRyb(original);
      const roundTrip = RybColorMixer.rybToHex(ryb.r, ryb.y, ryb.b);

      // Allow some variation due to inverse approximation
      const origRgb = ColorConverter.hexToRgb(original);
      const rtRgb = ColorConverter.hexToRgb(roundTrip);

      // Allow tolerance for inverse approximation
      expect(Math.abs(rtRgb.r - origRgb.r)).toBeLessThan(30);
      expect(Math.abs(rtRgb.g - origRgb.g)).toBeLessThan(30);
      expect(Math.abs(rtRgb.b - origRgb.b)).toBeLessThan(30);
    });
  });
});
