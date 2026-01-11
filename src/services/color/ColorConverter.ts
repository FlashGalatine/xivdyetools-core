/**
 * Color Converter
 * Per R-4: Focused class for color format conversions
 * Handles conversions between hex, RGB, and HSV color formats
 */

import type { RGB, HSV, HexColor, LAB } from '../../types/index.js';
import { createHexColor } from '../../types/index.js';
import { ErrorCode, AppError } from '../../types/index.js';

/**
 * DeltaE formula for color difference calculations
 * - cie76: Simple Euclidean distance in LAB space (fast)
 * - cie2000: CIEDE2000 formula (perceptually accurate, industry standard)
 */
export type DeltaEFormula = 'cie76' | 'cie2000';
import { RGB_MIN, RGB_MAX, HUE_MAX } from '../../constants/index.js';
import {
  clamp,
  round,
  isValidHexColor,
  isValidRGB,
  isValidHSV,
  LRUCache,
} from '../../utils/index.js';

/**
 * Configuration for ColorConverter caches
 */
export interface ColorConverterConfig {
  cacheSize?: number;
}

/**
 * Color format converter with LRU caching
 * Per R-4: Single Responsibility - format conversions only
 *
 * Refactored for testability: Supports dependency injection of cache configuration
 */
export class ColorConverter {
  // Instance caches (injectable for testing)
  private readonly hexToRgbCache: LRUCache<string, RGB>;
  private readonly rgbToHexCache: LRUCache<string, HexColor>;
  private readonly rgbToHsvCache: LRUCache<string, HSV>;
  private readonly hsvToRgbCache: LRUCache<string, RGB>;
  private readonly hexToHsvCache: LRUCache<string, HSV>;
  private readonly rgbToLabCache: LRUCache<string, LAB>;

  // Default singleton instance for static API compatibility
  // Per Issue #6: Eager initialization to avoid race conditions in concurrent scenarios
  private static defaultInstance: ColorConverter = new ColorConverter();

  /**
   * Constructor with optional cache configuration
   * @param config Configuration for cache sizes (default: 1000 entries per cache)
   */
  constructor(config: ColorConverterConfig = {}) {
    const cacheSize = config.cacheSize ?? 1000;
    this.hexToRgbCache = new LRUCache<string, RGB>(cacheSize);
    this.rgbToHexCache = new LRUCache<string, HexColor>(cacheSize);
    this.rgbToHsvCache = new LRUCache<string, HSV>(cacheSize);
    this.hsvToRgbCache = new LRUCache<string, RGB>(cacheSize);
    this.hexToHsvCache = new LRUCache<string, HSV>(cacheSize);
    this.rgbToLabCache = new LRUCache<string, LAB>(cacheSize);
  }

  /**
   * Get the default singleton instance
   * Per Issue #6: Returns eagerly-initialized instance to avoid race conditions
   */
  private static getDefault(): ColorConverter {
    return this.defaultInstance;
  }

  /**
   * Clear all caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.hexToRgbCache.clear();
    this.rgbToHexCache.clear();
    this.rgbToHsvCache.clear();
    this.hsvToRgbCache.clear();
    this.hexToHsvCache.clear();
    this.rgbToLabCache.clear();
  }

  /**
   * Static method: Clear all caches of the default instance
   */
  static clearCaches(): void {
    this.getDefault().clearCaches();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getCacheStats(): {
    hexToRgb: number;
    rgbToHex: number;
    rgbToHsv: number;
    hsvToRgb: number;
    hexToHsv: number;
    rgbToLab: number;
  } {
    return {
      hexToRgb: this.hexToRgbCache.size,
      rgbToHex: this.rgbToHexCache.size,
      rgbToHsv: this.rgbToHsvCache.size,
      hsvToRgb: this.hsvToRgbCache.size,
      hexToHsv: this.hexToHsvCache.size,
      rgbToLab: this.rgbToLabCache.size,
    };
  }

  /**
   * Static method: Get cache statistics from default instance
   */
  static getCacheStats(): {
    hexToRgb: number;
    rgbToHex: number;
    rgbToHsv: number;
    hsvToRgb: number;
    hexToHsv: number;
    rgbToLab: number;
  } {
    return this.getDefault().getCacheStats();
  }

  /**
   * Convert hexadecimal color to RGB
   * Per P-1: Cached for performance
   * @example hexToRgb("#FF0000") -> { r: 255, g: 0, b: 0 }
   */
  hexToRgb(hex: string): RGB {
    if (!isValidHexColor(hex)) {
      throw new AppError(
        ErrorCode.INVALID_HEX_COLOR,
        `Invalid hex color: ${hex}. Use format #RRGGBB or #RGB`,
        'error'
      );
    }

    // Normalize hex for cache key
    let hexForCache = hex.toUpperCase().replace('#', '');
    if (hexForCache.length === 3) {
      hexForCache = hexForCache
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const cacheKey = hexForCache;

    // Check cache
    const cached = this.hexToRgbCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Remove # and expand shorthand (#RGB -> #RRGGBB)
    let normalizedHex = hex.replace('#', '');
    if (normalizedHex.length === 3) {
      normalizedHex = normalizedHex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);

    const result = { r, g, b };
    // Cache result
    this.hexToRgbCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert hex to RGB using default instance
   */
  static hexToRgb(hex: string): RGB {
    return this.getDefault().hexToRgb(hex);
  }

  /**
   * Convert RGB to hexadecimal color
   * Per P-1: Cached for performance
   * @example rgbToHex(255, 0, 0) -> "#FF0000"
   */
  rgbToHex(r: number, g: number, b: number): HexColor {
    if (!isValidRGB(r, g, b)) {
      throw new AppError(
        ErrorCode.INVALID_RGB_VALUE,
        `Invalid RGB values: r=${r}, g=${g}, b=${b}. Values must be 0-255`,
        'error'
      );
    }

    // Create cache key
    const cacheKey = `${r},${g},${b}`;

    // Check cache
    const cached = this.rgbToHexCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const toHex = (value: number): string => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const result = createHexColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase());
    // Cache result
    this.rgbToHexCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert RGB to hex using default instance
   */
  static rgbToHex(r: number, g: number, b: number): HexColor {
    return this.getDefault().rgbToHex(r, g, b);
  }

  /**
   * Convert RGB to HSV
   * Per P-1: Cached for performance, optimized single-pass min/max
   * @example rgbToHsv(255, 0, 0) -> { h: 0, s: 100, v: 100 }
   */
  rgbToHsv(r: number, g: number, b: number): HSV {
    if (!isValidRGB(r, g, b)) {
      throw new AppError(
        ErrorCode.INVALID_RGB_VALUE,
        `Invalid RGB values: r=${r}, g=${g}, b=${b}`,
        'error'
      );
    }

    // Create cache key
    const cacheKey = `${r},${g},${b}`;

    // Check cache
    const cached = this.rgbToHsvCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Per P-1: Optimized single-pass min/max calculation
    // Normalize RGB to 0-1 range
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // Single-pass min/max (optimized)
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    // Calculate Value (brightness)
    const v = max * 100;

    // Calculate Saturation
    const s = max === 0 ? 0 : (delta / max) * 100;

    // Calculate Hue
    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
      } else if (max === gNorm) {
        h = ((bNorm - rNorm) / delta + 2) * 60;
      } else {
        h = ((rNorm - gNorm) / delta + 4) * 60;
      }
    }

    const result = { h: round(h, 2), s: round(s, 2), v: round(v, 2) };
    // Cache result
    this.rgbToHsvCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert RGB to HSV using default instance
   */
  static rgbToHsv(r: number, g: number, b: number): HSV {
    return this.getDefault().rgbToHsv(r, g, b);
  }

  /**
   * Normalize hue to [0, 360) range.
   * CORE-BUG-001: Ensures consistent cache keys for equivalent hue values
   * (e.g., h=359.9999 and h=0.0001 both produce similar cache keys after rounding)
   * Also handles negative values and values >= 360.
   */
  private normalizeHue(h: number): number {
    return ((h % HUE_MAX) + HUE_MAX) % HUE_MAX;
  }

  /**
   * Convert HSV to RGB
   * Per P-1: Cached for performance
   * @example hsvToRgb(0, 100, 100) -> { r: 255, g: 0, b: 0 }
   */
  hsvToRgb(h: number, s: number, v: number): RGB {
    if (!isValidHSV(h, s, v)) {
      throw new AppError(
        ErrorCode.INVALID_RGB_VALUE,
        `Invalid HSV values: h=${h}, s=${s}, v=${v}`,
        'error'
      );
    }

    // CORE-BUG-001: Normalize hue BEFORE creating cache key
    // This ensures h=359.9999 and h=0.0001 produce consistent cache keys
    // after rounding, preventing cache thrashing for equivalent colors
    const hNormalized = this.normalizeHue(h);

    // Create cache key using consistent rounding (2 decimal places)
    // Per Issue #17: Use same round() utility as rgbToHsv for consistency
    const cacheKey = `${round(hNormalized, 2)},${round(s, 2)},${round(v, 2)}`;

    // Check cache
    const cached = this.hsvToRgbCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Normalize HSV (use already normalized hue)
    const hNorm = hNormalized / 60;
    const sNorm = s / 100;
    const vNorm = v / 100;

    const c = vNorm * sNorm;
    const x = c * (1 - Math.abs((hNorm % 2) - 1));
    const m = vNorm - c;

    let rNorm = 0,
      gNorm = 0,
      bNorm = 0;

    if (hNorm >= 0 && hNorm < 1) {
      [rNorm, gNorm, bNorm] = [c, x, 0];
    } else if (hNorm >= 1 && hNorm < 2) {
      [rNorm, gNorm, bNorm] = [x, c, 0];
    } else if (hNorm >= 2 && hNorm < 3) {
      [rNorm, gNorm, bNorm] = [0, c, x];
    } else if (hNorm >= 3 && hNorm < 4) {
      [rNorm, gNorm, bNorm] = [0, x, c];
    } else if (hNorm >= 4 && hNorm < 5) {
      [rNorm, gNorm, bNorm] = [x, 0, c];
    } else {
      [rNorm, gNorm, bNorm] = [c, 0, x];
    }

    const r = Math.round((rNorm + m) * 255);
    const g = Math.round((gNorm + m) * 255);
    const b = Math.round((bNorm + m) * 255);

    const result = {
      r: clamp(r, RGB_MIN, RGB_MAX),
      g: clamp(g, RGB_MIN, RGB_MAX),
      b: clamp(b, RGB_MIN, RGB_MAX),
    };
    // Cache result
    this.hsvToRgbCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert HSV to RGB using default instance
   */
  static hsvToRgb(h: number, s: number, v: number): RGB {
    return this.getDefault().hsvToRgb(h, s, v);
  }

  /**
   * Convert hex to HSV
   * Per P-1: Cached for performance
   */
  hexToHsv(hex: string): HSV {
    // Normalize hex for cache key
    let hexForCache = hex.toUpperCase().replace('#', '');
    if (hexForCache.length === 3) {
      hexForCache = hexForCache
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const cacheKey = hexForCache;

    // Check cache
    const cached = this.hexToHsvCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rgb = this.hexToRgb(hex);
    const result = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
    // Cache result
    this.hexToHsvCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert hex to HSV using default instance
   */
  static hexToHsv(hex: string): HSV {
    return this.getDefault().hexToHsv(hex);
  }

  /**
   * Convert HSV to hex
   */
  hsvToHex(h: number, s: number, v: number): HexColor {
    const rgb = this.hsvToRgb(h, s, v);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Static method: Convert HSV to hex using default instance
   */
  static hsvToHex(h: number, s: number, v: number): HexColor {
    return this.getDefault().hsvToHex(h, s, v);
  }

  /**
   * Normalize a hex color to #RRGGBB format
   */
  normalizeHex(hex: string): HexColor {
    const rgb = this.hexToRgb(hex);
    return this.rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Static method: Normalize hex using default instance
   */
  static normalizeHex(hex: string): HexColor {
    return this.getDefault().normalizeHex(hex);
  }

  /**
   * Calculate Euclidean distance between two RGB colors
   * Returns 0 for identical colors, ~441.67 for white vs black
   */
  getColorDistance(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);

    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;

    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Static method: Calculate color distance using default instance
   */
  static getColorDistance(hex1: string, hex2: string): number {
    return this.getDefault().getColorDistance(hex1, hex2);
  }

  // ============================================================================
  // LAB Color Space Conversion
  // ============================================================================

  /**
   * Convert RGB to CIE XYZ color space (intermediate step for LAB)
   * Uses sRGB to XYZ conversion with D65 illuminant
   * @internal
   */
  private rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
    // Normalize to 0-1 and apply sRGB gamma expansion
    let rLinear = r / 255;
    let gLinear = g / 255;
    let bLinear = b / 255;

    // sRGB gamma expansion (inverse companding)
    rLinear = rLinear > 0.04045 ? Math.pow((rLinear + 0.055) / 1.055, 2.4) : rLinear / 12.92;
    gLinear = gLinear > 0.04045 ? Math.pow((gLinear + 0.055) / 1.055, 2.4) : gLinear / 12.92;
    bLinear = bLinear > 0.04045 ? Math.pow((bLinear + 0.055) / 1.055, 2.4) : bLinear / 12.92;

    // sRGB to XYZ matrix (D65 illuminant)
    return {
      x: rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375,
      y: rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175,
      z: rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041,
    };
  }

  /**
   * Convert RGB to CIE LAB color space
   * Per P-1: Cached for performance
   * @example rgbToLab(255, 0, 0) -> { L: 53.23, a: 80.11, b: 67.22 }
   */
  rgbToLab(r: number, g: number, b: number): LAB {
    if (!isValidRGB(r, g, b)) {
      throw new AppError(
        ErrorCode.INVALID_RGB_VALUE,
        `Invalid RGB values: r=${r}, g=${g}, b=${b}. Values must be 0-255`,
        'error'
      );
    }

    const cacheKey = `${r},${g},${b}`;
    const cached = this.rgbToLabCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // D65 reference white point
    const refX = 0.95047;
    const refY = 1.0;
    const refZ = 1.08883;

    const xyz = this.rgbToXyz(r, g, b);

    // Normalize by reference white
    let x = xyz.x / refX;
    let y = xyz.y / refY;
    let z = xyz.z / refZ;

    // Apply LAB transformation (cube root with linear segment for dark colors)
    const epsilon = 0.008856; // (6/29)^3
    const kappa = 903.3; // (29/3)^3

    x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
    y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
    z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

    const result: LAB = {
      L: round(116 * y - 16, 4),
      a: round(500 * (x - y), 4),
      b: round(200 * (y - z), 4),
    };

    this.rgbToLabCache.set(cacheKey, result);
    return result;
  }

  /**
   * Static method: Convert RGB to LAB using default instance
   */
  static rgbToLab(r: number, g: number, b: number): LAB {
    return this.getDefault().rgbToLab(r, g, b);
  }

  /**
   * Convert hex color to CIE LAB
   * @example hexToLab("#FF0000") -> { L: 53.23, a: 80.11, b: 67.22 }
   */
  hexToLab(hex: string): LAB {
    const rgb = this.hexToRgb(hex);
    return this.rgbToLab(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Static method: Convert hex to LAB using default instance
   */
  static hexToLab(hex: string): LAB {
    return this.getDefault().hexToLab(hex);
  }

  // ============================================================================
  // DeltaE Color Difference Calculations
  // ============================================================================

  /**
   * Calculate DeltaE (CIE76) between two LAB colors
   * Simple Euclidean distance in LAB space
   * Fast but less perceptually accurate than CIE2000
   * @returns DeltaE value (0 = identical, <1 imperceptible, <3 barely noticeable, >5 clearly different)
   */
  getDeltaE76(lab1: LAB, lab2: LAB): number {
    const dL = lab1.L - lab2.L;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  /**
   * Static method: Calculate DeltaE76 using default instance
   */
  static getDeltaE76(lab1: LAB, lab2: LAB): number {
    return this.getDefault().getDeltaE76(lab1, lab2);
  }

  /**
   * Calculate DeltaE (CIEDE2000) between two LAB colors
   * Industry standard for perceptual color difference
   * More accurate but computationally expensive
   * @returns DeltaE value (0 = identical, <1 imperceptible, <3 barely noticeable, >5 clearly different)
   */
  getDeltaE2000(lab1: LAB, lab2: LAB): number {
    const L1 = lab1.L,
      a1 = lab1.a,
      b1 = lab1.b;
    const L2 = lab2.L,
      a2 = lab2.a,
      b2 = lab2.b;

    // Weighting factors (all set to 1 for standard conditions)
    const kL = 1,
      kC = 1,
      kH = 1;

    // Calculate C' and h' for both colors
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cab = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);

    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);

    const h1p = this.hueAngle(a1p, b1);
    const h2p = this.hueAngle(a2p, b2);

    // Calculate deltas
    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    let dhp: number;
    if (C1p * C2p === 0) {
      dhp = 0;
    } else if (Math.abs(h2p - h1p) <= 180) {
      dhp = h2p - h1p;
    } else if (h2p - h1p > 180) {
      dhp = h2p - h1p - 360;
    } else {
      dhp = h2p - h1p + 360;
    }

    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

    // Calculate CIEDE2000 components
    const Lp = (L1 + L2) / 2;
    const Cp = (C1p + C2p) / 2;

    let Hp: number;
    if (C1p * C2p === 0) {
      Hp = h1p + h2p;
    } else if (Math.abs(h1p - h2p) <= 180) {
      Hp = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
      Hp = (h1p + h2p + 360) / 2;
    } else {
      Hp = (h1p + h2p - 360) / 2;
    }

    const T =
      1 -
      0.17 * Math.cos(((Hp - 30) * Math.PI) / 180) +
      0.24 * Math.cos((2 * Hp * Math.PI) / 180) +
      0.32 * Math.cos(((3 * Hp + 6) * Math.PI) / 180) -
      0.2 * Math.cos(((4 * Hp - 63) * Math.PI) / 180);

    const dTheta = 30 * Math.exp(-Math.pow((Hp - 275) / 25, 2));

    const Rc = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));

    const Sl = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
    const Sc = 1 + 0.045 * Cp;
    const Sh = 1 + 0.015 * Cp * T;

    const Rt = -Math.sin((2 * dTheta * Math.PI) / 180) * Rc;

    const dE = Math.sqrt(
      Math.pow(dLp / (kL * Sl), 2) +
        Math.pow(dCp / (kC * Sc), 2) +
        Math.pow(dHp / (kH * Sh), 2) +
        Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh))
    );

    return dE;
  }

  /**
   * Helper to calculate hue angle in degrees from a' and b'
   * @internal
   */
  private hueAngle(ap: number, bp: number): number {
    if (ap === 0 && bp === 0) {
      return 0;
    }
    const h = (Math.atan2(bp, ap) * 180) / Math.PI;
    return h >= 0 ? h : h + 360;
  }

  /**
   * Static method: Calculate DeltaE2000 using default instance
   */
  static getDeltaE2000(lab1: LAB, lab2: LAB): number {
    return this.getDefault().getDeltaE2000(lab1, lab2);
  }

  /**
   * Calculate DeltaE between two hex colors using specified formula
   * @param hex1 First hex color
   * @param hex2 Second hex color
   * @param formula DeltaE formula to use ('cie76' or 'cie2000')
   * @returns DeltaE value
   */
  getDeltaE(hex1: string, hex2: string, formula: DeltaEFormula = 'cie76'): number {
    const lab1 = this.hexToLab(hex1);
    const lab2 = this.hexToLab(hex2);

    return formula === 'cie2000' ? this.getDeltaE2000(lab1, lab2) : this.getDeltaE76(lab1, lab2);
  }

  /**
   * Static method: Calculate DeltaE using default instance
   */
  static getDeltaE(hex1: string, hex2: string, formula: DeltaEFormula = 'cie76'): number {
    return this.getDefault().getDeltaE(hex1, hex2, formula);
  }
}
