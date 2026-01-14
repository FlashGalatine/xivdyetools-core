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
    it('should convert RYB black to RGB black', () => {
      const rgb = RybColorMixer.rybToRgb(0, 0, 0);
      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert RYB white to RGB white', () => {
      const rgb = RybColorMixer.rybToRgb(255, 255, 255);
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert RYB red to RGB red', () => {
      const rgb = RybColorMixer.rybToRgb(255, 0, 0);
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert RYB yellow to RGB yellow', () => {
      const rgb = RybColorMixer.rybToRgb(0, 255, 0);
      expect(rgb).toEqual({ r: 255, g: 255, b: 0 });
    });

    it('should convert RYB blue to RGB blue (hue-shifted)', () => {
      const rgb = RybColorMixer.rybToRgb(0, 0, 255);
      // Blue in RYB is hue-shifted per Gossett-Chen
      expect(rgb.r).toBeCloseTo(42, 0); // 0.165 * 255
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(255);
    });

    it('should convert RYB yellow+blue to RGB green', () => {
      const rgb = RybColorMixer.rybToRgb(0, 255, 255);
      // Should produce green (high G, low R, some B from the green corner)
      expect(rgb.g).toBe(255);
      expect(rgb.r).toBe(0);
      expect(rgb.b).toBeCloseTo(89, 0); // 0.349 * 255
    });

    it('should convert RYB red+yellow to RGB orange', () => {
      const rgb = RybColorMixer.rybToRgb(255, 255, 0);
      // Should produce orange (R=255, G~165, B=0)
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBeCloseTo(165, 0); // 0.647 * 255
      expect(rgb.b).toBe(0);
    });

    it('should convert RYB red+blue to RGB violet', () => {
      const rgb = RybColorMixer.rybToRgb(255, 0, 255);
      // Should produce violet (R~193, G=0, B=255)
      expect(rgb.r).toBeCloseTo(193, 0); // 0.757 * 255
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(255);
    });
  });

  // ============================================================================
  // RGB to RYB Conversion (Inverse)
  // ============================================================================

  describe('rgbToRyb', () => {
    it('should convert RGB black to RYB black', () => {
      const ryb = RybColorMixer.rgbToRyb(0, 0, 0);
      expect(ryb.r).toBeCloseTo(0, -1);
      expect(ryb.y).toBeCloseTo(0, -1);
      expect(ryb.b).toBeCloseTo(0, -1);
    });

    it('should convert RGB white to RYB white', () => {
      const ryb = RybColorMixer.rgbToRyb(255, 255, 255);
      expect(ryb.r).toBeCloseTo(255, -1);
      expect(ryb.y).toBeCloseTo(255, -1);
      expect(ryb.b).toBeCloseTo(255, -1);
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

      // Violet: R and B should both be present, G should be low
      expect(rgb.r).toBeGreaterThan(50);
      expect(rgb.b).toBeGreaterThan(80);
      expect(rgb.g).toBeLessThan(50);
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
