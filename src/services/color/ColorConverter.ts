/**
 * Color Converter
 * Per R-4: Focused class for color format conversions
 * Handles conversions between hex, RGB, and HSV color formats
 */

import type { RGB, HSV, HexColor } from '../../types/index.js';
import { createHexColor } from '../../types/index.js';
import { ErrorCode, AppError } from '../../types/index.js';
import { RGB_MIN, RGB_MAX, HUE_MAX } from '../../constants/index.js';
import { clamp, round, isValidHexColor, isValidRGB, isValidHSV } from '../../utils/index.js';

/**
 * Simple LRU cache implementation
 * Per P-1: Caching for color conversions (60-80% speedup)
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

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

  // Default singleton instance for static API compatibility
  private static defaultInstance: ColorConverter;

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
  }

  /**
   * Get the default singleton instance
   */
  private static getDefault(): ColorConverter {
    if (!this.defaultInstance) {
      this.defaultInstance = new ColorConverter();
    }
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
  } {
    return {
      hexToRgb: this.hexToRgbCache.size,
      rgbToHex: this.rgbToHexCache.size,
      rgbToHsv: this.rgbToHsvCache.size,
      hsvToRgb: this.hsvToRgbCache.size,
      hexToHsv: this.hexToHsvCache.size,
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

    // Create cache key using consistent rounding (2 decimal places)
    // Per Issue #17: Use same round() utility as rgbToHsv for consistency
    const cacheKey = `${round(h, 2)},${round(s, 2)},${round(v, 2)}`;

    // Check cache
    const cached = this.hsvToRgbCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Normalize HSV
    const hNorm = (h % HUE_MAX) / 60;
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
}
