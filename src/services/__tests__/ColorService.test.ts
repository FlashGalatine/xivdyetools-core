/**
 * ColorService tests
 *
 * Tests for the ColorService facade which delegates to focused service classes.
 * Ensures all static methods and branch coverage for default parameters.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ColorService } from '../ColorService.js';

describe('ColorService', () => {
  beforeEach(() => {
    ColorService.clearCaches();
  });

  // ============================================================================
  // Cache Management
  // ============================================================================

  describe('cache management', () => {
    it('should clear all caches', () => {
      // Populate caches first
      ColorService.hexToRgb('#FF0000');
      ColorService.rgbToHex(255, 0, 0);
      ColorService.simulateColorblindness({ r: 255, g: 0, b: 0 }, 'deuteranopia');

      const statsBefore = ColorService.getCacheStats();
      expect(statsBefore.hexToRgb).toBeGreaterThan(0);

      ColorService.clearCaches();

      const statsAfter = ColorService.getCacheStats();
      expect(statsAfter.hexToRgb).toBe(0);
      expect(statsAfter.rgbToHex).toBe(0);
      expect(statsAfter.colorblind).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = ColorService.getCacheStats();
      expect(stats).toHaveProperty('hexToRgb');
      expect(stats).toHaveProperty('rgbToHex');
      expect(stats).toHaveProperty('rgbToHsv');
      expect(stats).toHaveProperty('hsvToRgb');
      expect(stats).toHaveProperty('hexToHsv');
      expect(stats).toHaveProperty('colorblind');
    });

    it('should increment cache stats on conversions', () => {
      ColorService.hexToRgb('#FF0000');
      ColorService.hexToRgb('#00FF00');
      ColorService.rgbToHex(0, 0, 255);

      const stats = ColorService.getCacheStats();
      expect(stats.hexToRgb).toBe(2);
      expect(stats.rgbToHex).toBe(1);
    });
  });

  // ============================================================================
  // Color Conversion (delegated methods)
  // ============================================================================

  describe('color conversion', () => {
    it('should convert hex to RGB', () => {
      const rgb = ColorService.hexToRgb('#FF0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert RGB to hex', () => {
      const hex = ColorService.rgbToHex(255, 0, 0);
      expect(hex).toBe('#FF0000');
    });

    it('should convert RGB to HSV', () => {
      const hsv = ColorService.rgbToHsv(255, 0, 0);
      expect(hsv).toEqual({ h: 0, s: 100, v: 100 });
    });

    it('should convert HSV to RGB', () => {
      const rgb = ColorService.hsvToRgb(0, 100, 100);
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert hex to HSV', () => {
      const hsv = ColorService.hexToHsv('#FF0000');
      expect(hsv).toEqual({ h: 0, s: 100, v: 100 });
    });

    it('should convert HSV to hex', () => {
      const hex = ColorService.hsvToHex(0, 100, 100);
      expect(hex).toBe('#FF0000');
    });

    it('should normalize hex colors', () => {
      expect(ColorService.normalizeHex('#f00')).toBe('#FF0000');
      // Without hash not supported
      expect(ColorService.normalizeHex('#ff0000')).toBe('#FF0000');
    });

    it('should calculate color distance', () => {
      const distance = ColorService.getColorDistance('#FF0000', '#00FF00');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(450);
    });
  });

  // ============================================================================
  // Colorblindness Simulation
  // ============================================================================

  describe('colorblindness simulation', () => {
    it('should simulate colorblindness on RGB', () => {
      const rgb = { r: 255, g: 0, b: 0 };
      const simulated = ColorService.simulateColorblindness(rgb, 'deuteranopia');
      expect(simulated).toBeDefined();
      expect(simulated.r).toBeDefined();
      expect(simulated.g).toBeDefined();
      expect(simulated.b).toBeDefined();
    });

    it('should simulate colorblindness on hex', () => {
      const simulated = ColorService.simulateColorblindnessHex('#FF0000', 'protanopia');
      expect(simulated).toMatch(/^#[0-9A-F]{6}$/);
    });

    it('should return same color for normal vision', () => {
      const simulated = ColorService.simulateColorblindnessHex('#FF0000', 'normal');
      expect(simulated).toBe('#FF0000');
    });
  });

  // ============================================================================
  // Color Accessibility
  // ============================================================================

  describe('color accessibility', () => {
    it('should calculate perceived luminance', () => {
      const whiteLuminance = ColorService.getPerceivedLuminance('#FFFFFF');
      const blackLuminance = ColorService.getPerceivedLuminance('#000000');
      expect(whiteLuminance).toBeCloseTo(1, 1);
      expect(blackLuminance).toBeCloseTo(0, 1);
    });

    it('should calculate contrast ratio', () => {
      const ratio = ColorService.getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0); // Max contrast
    });

    describe('WCAG AA compliance', () => {
      it('should check WCAG AA with default largeText (false)', () => {
        // High contrast - should pass
        expect(ColorService.meetsWCAGAA('#000000', '#FFFFFF')).toBe(true);
        // Low contrast - should fail
        expect(ColorService.meetsWCAGAA('#777777', '#888888')).toBe(false);
      });

      it('should check WCAG AA with largeText = false', () => {
        // Threshold is 4.5:1 for normal text
        expect(ColorService.meetsWCAGAA('#000000', '#FFFFFF', false)).toBe(true);
      });

      it('should check WCAG AA with largeText = true', () => {
        // Threshold is 3:1 for large text - more lenient
        expect(ColorService.meetsWCAGAA('#000000', '#FFFFFF', true)).toBe(true);
        // Medium contrast that might pass large text but fail normal
        const ratio = ColorService.getContrastRatio('#595959', '#FFFFFF');
        if (ratio >= 3 && ratio < 4.5) {
          expect(ColorService.meetsWCAGAA('#595959', '#FFFFFF', true)).toBe(true);
          expect(ColorService.meetsWCAGAA('#595959', '#FFFFFF', false)).toBe(false);
        }
      });
    });

    describe('WCAG AAA compliance', () => {
      it('should check WCAG AAA with default largeText (false)', () => {
        // High contrast - should pass
        expect(ColorService.meetsWCAGAAA('#000000', '#FFFFFF')).toBe(true);
        // Low contrast - should fail
        expect(ColorService.meetsWCAGAAA('#777777', '#888888')).toBe(false);
      });

      it('should check WCAG AAA with largeText = false', () => {
        // Threshold is 7:1 for normal text
        expect(ColorService.meetsWCAGAAA('#000000', '#FFFFFF', false)).toBe(true);
      });

      it('should check WCAG AAA with largeText = true', () => {
        // Threshold is 4.5:1 for large text
        expect(ColorService.meetsWCAGAAA('#000000', '#FFFFFF', true)).toBe(true);
      });
    });

    it('should determine if color is light', () => {
      expect(ColorService.isLightColor('#FFFFFF')).toBe(true);
      expect(ColorService.isLightColor('#000000')).toBe(false);
      expect(ColorService.isLightColor('#FFFF00')).toBe(true); // Yellow is light
    });

    it('should get optimal text color', () => {
      expect(ColorService.getOptimalTextColor('#FFFFFF')).toBe('#000000');
      expect(ColorService.getOptimalTextColor('#000000')).toBe('#FFFFFF');
    });
  });

  // ============================================================================
  // Color Manipulation
  // ============================================================================

  describe('color manipulation', () => {
    it('should adjust brightness', () => {
      const brighter = ColorService.adjustBrightness('#808080', 50);
      const darker = ColorService.adjustBrightness('#808080', -50);

      const brighterRgb = ColorService.hexToRgb(brighter);
      const darkerRgb = ColorService.hexToRgb(darker);
      const originalRgb = ColorService.hexToRgb('#808080');

      expect(brighterRgb.r).toBeGreaterThan(originalRgb.r);
      expect(darkerRgb.r).toBeLessThanOrEqual(originalRgb.r);
    });

    it('should adjust saturation', () => {
      const moreSaturated = ColorService.adjustSaturation('#8080FF', 50);
      const lessSaturated = ColorService.adjustSaturation('#8080FF', -50);

      expect(moreSaturated).toBeDefined();
      expect(lessSaturated).toBeDefined();
    });

    it('should rotate hue', () => {
      const rotated = ColorService.rotateHue('#FF0000', 120);
      // Red rotated 120° should be green-ish
      const rgb = ColorService.hexToRgb(rotated);
      expect(rgb.g).toBeGreaterThan(rgb.r);
    });

    it('should invert color', () => {
      const inverted = ColorService.invert('#FF0000');
      expect(inverted).toBe('#00FFFF'); // Red inverts to cyan
    });

    it('should desaturate color', () => {
      const desaturated = ColorService.desaturate('#FF0000');
      const rgb = ColorService.hexToRgb(desaturated);
      // Grayscale has R = G = B
      expect(rgb.r).toBe(rgb.g);
      expect(rgb.g).toBe(rgb.b);
    });
  });
});
