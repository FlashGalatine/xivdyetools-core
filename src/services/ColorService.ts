/**
 * @xivdyetools/core - Color Service
 *
 * Color conversion algorithms and colorblindness simulation.
 * Provides utilities for converting between RGB, HSV, and hex color formats,
 * calculating color distances, and simulating color vision deficiencies.
 *
 * Per R-4: Facade class that delegates to focused service classes
 * Maintains backward compatibility while using split services internally
 *
 * @module services/ColorService
 * @example
 * ```typescript
 * import { ColorService } from '@xivdyetools/core';
 *
 * // Convert hex to RGB
 * const rgb = ColorService.hexToRgb('#FF0000');
 * // { r: 255, g: 0, b: 0 }
 *
 * // Convert RGB to HSV
 * const hsv = ColorService.rgbToHsv(rgb);
 * // { h: 0, s: 100, v: 100 }
 *
 * // Calculate color distance
 * const distance = ColorService.getColorDistance('#FF0000', '#00FF00');
 * ```
 */

import type { RGB, HSV, HexColor, VisionType, LAB } from '../types/index.js';
import { ColorConverter, type DeltaEFormula } from './color/ColorConverter.js';
import { ColorblindnessSimulator } from './color/ColorblindnessSimulator.js';
import { ColorAccessibility } from './color/ColorAccessibility.js';
import { ColorManipulator } from './color/ColorManipulator.js';
import { RybColorMixer, type RYB } from './color/RybColorMixer.js';

/**
 * Color conversion and manipulation service (Facade)
 * Per R-4: Delegates to focused service classes for better separation of concerns
 * Maintains backward compatibility with existing API
 */
export class ColorService {
  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Clear all caches (useful for testing or memory management)
   */
  static clearCaches(): void {
    ColorConverter.clearCaches();
    ColorblindnessSimulator.clearCache();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  static getCacheStats(): {
    hexToRgb: number;
    rgbToHex: number;
    rgbToHsv: number;
    hsvToRgb: number;
    hexToHsv: number;
    colorblind: number;
  } {
    const converterStats = ColorConverter.getCacheStats();
    const simulatorStats = ColorblindnessSimulator.getCacheStats();
    return {
      ...converterStats,
      colorblind: simulatorStats.colorblind,
    };
  }

  // ============================================================================
  // Color Conversion (delegated to ColorConverter)
  // ============================================================================

  /**
   * Convert hexadecimal color to RGB
   * @example hexToRgb("#FF0000") -> { r: 255, g: 0, b: 0 }
   */
  static hexToRgb(hex: string): RGB {
    return ColorConverter.hexToRgb(hex);
  }

  /**
   * Convert RGB to hexadecimal color
   * @example rgbToHex(255, 0, 0) -> "#FF0000"
   */
  static rgbToHex(r: number, g: number, b: number): HexColor {
    return ColorConverter.rgbToHex(r, g, b);
  }

  /**
   * Convert RGB to HSV
   * @example rgbToHsv(255, 0, 0) -> { h: 0, s: 100, v: 100 }
   */
  static rgbToHsv(r: number, g: number, b: number): HSV {
    return ColorConverter.rgbToHsv(r, g, b);
  }

  /**
   * Convert HSV to RGB
   * @example hsvToRgb(0, 100, 100) -> { r: 255, g: 0, b: 0 }
   */
  static hsvToRgb(h: number, s: number, v: number): RGB {
    return ColorConverter.hsvToRgb(h, s, v);
  }

  /**
   * Convert hex to HSV
   */
  static hexToHsv(hex: string): HSV {
    return ColorConverter.hexToHsv(hex);
  }

  /**
   * Convert HSV to hex
   */
  static hsvToHex(h: number, s: number, v: number): HexColor {
    return ColorConverter.hsvToHex(h, s, v);
  }

  /**
   * Normalize a hex color to #RRGGBB format
   */
  static normalizeHex(hex: string): HexColor {
    return ColorConverter.normalizeHex(hex);
  }

  /**
   * Calculate Euclidean distance between two RGB colors
   * Returns 0 for identical colors, ~441.67 for white vs black
   */
  static getColorDistance(hex1: string, hex2: string): number {
    return ColorConverter.getColorDistance(hex1, hex2);
  }

  // ============================================================================
  // Colorblindness Simulation (delegated to ColorblindnessSimulator)
  // ============================================================================

  /**
   * Simulate colorblindness on an RGB color
   * @example simulateColorblindness({ r: 255, g: 0, b: 0 }, 'deuteranopia')
   */
  static simulateColorblindness(rgb: RGB, visionType: VisionType): RGB {
    return ColorblindnessSimulator.simulateColorblindness(rgb, visionType);
  }

  /**
   * Simulate colorblindness on a hex color
   */
  static simulateColorblindnessHex(hex: string, visionType: VisionType): HexColor {
    return ColorblindnessSimulator.simulateColorblindnessHex(hex, visionType);
  }

  // ============================================================================
  // Color Accessibility (delegated to ColorAccessibility)
  // ============================================================================

  /**
   * Calculate perceived luminance of a color (0-1)
   * Uses relative luminance formula from WCAG
   */
  static getPerceivedLuminance(hex: string): number {
    return ColorAccessibility.getPerceivedLuminance(hex);
  }

  /**
   * Calculate contrast ratio between two colors
   * Returns 1 (no contrast) to 21 (maximum contrast)
   */
  static getContrastRatio(hex1: string, hex2: string): number {
    return ColorAccessibility.getContrastRatio(hex1, hex2);
  }

  /**
   * Check if two colors meet WCAG AA contrast ratio
   */
  static meetsWCAGAA(hex1: string, hex2: string, largeText: boolean = false): boolean {
    return ColorAccessibility.meetsWCAGAA(hex1, hex2, largeText);
  }

  /**
   * Check if two colors meet WCAG AAA contrast ratio
   */
  static meetsWCAGAAA(hex1: string, hex2: string, largeText: boolean = false): boolean {
    return ColorAccessibility.meetsWCAGAAA(hex1, hex2, largeText);
  }

  /**
   * Check if a color is light (for determining text color on background)
   */
  static isLightColor(hex: string): boolean {
    return ColorAccessibility.isLightColor(hex);
  }

  /**
   * Get optimal text color for a background color
   */
  static getOptimalTextColor(backgroundColor: string): HexColor {
    return ColorAccessibility.getOptimalTextColor(backgroundColor);
  }

  // ============================================================================
  // Color Manipulation (delegated to ColorManipulator)
  // ============================================================================

  /**
   * Adjust brightness of a color
   * @param amount -100 to 100 (negative = darker, positive = lighter)
   */
  static adjustBrightness(hex: string, amount: number): HexColor {
    return ColorManipulator.adjustBrightness(hex, amount);
  }

  /**
   * Adjust saturation of a color
   * @param amount -100 to 100 (negative = less saturated, positive = more saturated)
   */
  static adjustSaturation(hex: string, amount: number): HexColor {
    return ColorManipulator.adjustSaturation(hex, amount);
  }

  /**
   * Rotate hue of a color
   * @param degrees 0-360 (amount to rotate hue)
   */
  static rotateHue(hex: string, degrees: number): HexColor {
    return ColorManipulator.rotateHue(hex, degrees);
  }

  /**
   * Invert a color (create complementary color)
   */
  static invert(hex: string): HexColor {
    return ColorManipulator.invert(hex);
  }

  /**
   * Desaturate a color (convert to grayscale)
   */
  static desaturate(hex: string): HexColor {
    return ColorManipulator.desaturate(hex);
  }

  // ============================================================================
  // LAB Color Space (delegated to ColorConverter)
  // ============================================================================

  /**
   * Convert RGB to CIE LAB color space
   * @example rgbToLab(255, 0, 0) -> { L: 53.23, a: 80.11, b: 67.22 }
   */
  static rgbToLab(r: number, g: number, b: number): LAB {
    return ColorConverter.rgbToLab(r, g, b);
  }

  /**
   * Convert hex color to CIE LAB
   * @example hexToLab("#FF0000") -> { L: 53.23, a: 80.11, b: 67.22 }
   */
  static hexToLab(hex: string): LAB {
    return ColorConverter.hexToLab(hex);
  }

  /**
   * Calculate DeltaE (color difference) between two hex colors
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param formula DeltaE formula to use ('cie76' or 'cie2000', default: 'cie76')
   * @returns DeltaE value (0 = identical, <1 imperceptible, <3 barely noticeable, >5 clearly different)
   */
  static getDeltaE(hex1: string, hex2: string, formula: DeltaEFormula = 'cie76'): number {
    return ColorConverter.getDeltaE(hex1, hex2, formula);
  }

  /**
   * Convert CIE LAB to RGB
   * @example labToRgb(53.23, 80.11, 67.22) -> { r: 255, g: 0, b: 0 }
   */
  static labToRgb(L: number, a: number, b: number): RGB {
    return ColorConverter.labToRgb(L, a, b);
  }

  /**
   * Convert CIE LAB to hex color
   * @example labToHex(53.23, 80.11, 67.22) -> "#FF0000"
   */
  static labToHex(L: number, a: number, b: number): HexColor {
    return ColorConverter.labToHex(L, a, b);
  }

  // ============================================================================
  // Color Mixing (RGB, LAB, RYB)
  // ============================================================================

  /**
   * Mix two colors using RGB additive mixing (averaging)
   *
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param ratio Mix ratio (0 = all hex1, 0.5 = equal mix, 1 = all hex2). Default: 0.5
   * @returns Mixed color as hex
   */
  static mixColorsRgb(hex1: string, hex2: string, ratio: number = 0.5): HexColor {
    const rgb1 = ColorConverter.hexToRgb(hex1);
    const rgb2 = ColorConverter.hexToRgb(hex2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

    return ColorConverter.rgbToHex(r, g, b);
  }

  /**
   * Mix two colors using LAB perceptually uniform mixing
   *
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param ratio Mix ratio (0 = all hex1, 0.5 = equal mix, 1 = all hex2). Default: 0.5
   * @returns Mixed color as hex
   */
  static mixColorsLab(hex1: string, hex2: string, ratio: number = 0.5): HexColor {
    const lab1 = ColorConverter.hexToLab(hex1);
    const lab2 = ColorConverter.hexToLab(hex2);

    const L = lab1.L + (lab2.L - lab1.L) * ratio;
    const a = lab1.a + (lab2.a - lab1.a) * ratio;
    const b = lab1.b + (lab2.b - lab1.b) * ratio;

    return ColorConverter.labToHex(L, a, b);
  }

  // ============================================================================
  // RYB Color Mixing (delegated to RybColorMixer)
  // ============================================================================

  /**
   * Mix two colors using RYB (Red-Yellow-Blue) subtractive color mixing
   *
   * This produces results similar to mixing physical paints:
   * - Blue + Yellow = Green (not gray like in RGB)
   * - Red + Yellow = Orange
   * - Red + Blue = Violet
   *
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param ratio Mix ratio (0 = all hex1, 0.5 = equal mix, 1 = all hex2). Default: 0.5
   * @returns Mixed color as hex
   *
   * @example
   * // Mix blue and yellow to get green
   * ColorService.mixColorsRyb('#0000FF', '#FFFF00') // Returns greenish color
   */
  static mixColorsRyb(hex1: string, hex2: string, ratio: number = 0.5): HexColor {
    return RybColorMixer.mixColors(hex1, hex2, ratio);
  }

  /**
   * Convert RYB (Red-Yellow-Blue) to RGB
   * Uses trilinear interpolation in the Gossett-Chen color cube
   *
   * @param r Red component (0-255)
   * @param y Yellow component (0-255)
   * @param b Blue component (0-255)
   * @returns RGB color
   */
  static rybToRgb(r: number, y: number, b: number): RGB {
    return RybColorMixer.rybToRgb(r, y, b);
  }

  /**
   * Convert RGB to RYB (Red-Yellow-Blue)
   * Uses Newton-Raphson iterative approximation
   *
   * @param r Red component (0-255)
   * @param g Green component (0-255)
   * @param b Blue component (0-255)
   * @returns RYB color
   */
  static rgbToRyb(r: number, g: number, b: number): RYB {
    return RybColorMixer.rgbToRyb(r, g, b);
  }

  /**
   * Convert hex color to RYB
   */
  static hexToRyb(hex: string): RYB {
    return RybColorMixer.hexToRyb(hex);
  }

  /**
   * Convert RYB to hex color
   */
  static rybToHex(r: number, y: number, b: number): HexColor {
    return RybColorMixer.rybToHex(r, y, b);
  }
}

// Re-export RYB type for consumers
export type { RYB } from './color/RybColorMixer.js';
