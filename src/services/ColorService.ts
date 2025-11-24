/**
 * @xivdyetools/core - Color Service
 *
 * Color conversion algorithms and colorblindness simulation.
 * Provides utilities for converting between RGB, HSV, and hex color formats,
 * calculating color distances, and simulating color vision deficiencies.
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

import type { RGB, HSV, HexColor, VisionType } from '../types/index.js';
import { createHexColor } from '../types/index.js';
import { ErrorCode, AppError } from '../types/index.js';
import { BRETTEL_MATRICES, RGB_MIN, RGB_MAX, HUE_MAX } from '../constants/index.js';
import { clamp, round, isValidHexColor, isValidRGB, isValidHSV } from '../utils/index.js';

// ============================================================================
// LRU Cache Implementation
// ============================================================================

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

// ============================================================================
// Color Service Class
// ============================================================================

/**
 * Color conversion and manipulation service
 * Handles all color transformations between formats
 * Per P-1: Implements LRU caching for performance optimization
 */
export class ColorService {
    // Per P-1: LRU caches for color conversions (max 1000 entries each)
    private static readonly hexToRgbCache = new LRUCache<string, RGB>(1000);
    private static readonly rgbToHexCache = new LRUCache<string, HexColor>(1000);
    private static readonly rgbToHsvCache = new LRUCache<string, HSV>(1000);
    private static readonly hsvToRgbCache = new LRUCache<string, RGB>(1000);
    private static readonly hexToHsvCache = new LRUCache<string, HSV>(1000);
    private static readonly colorblindCache = new LRUCache<string, RGB>(1000);

    /**
     * Clear all caches (useful for testing or memory management)
     */
    static clearCaches(): void {
        this.hexToRgbCache.clear();
        this.rgbToHexCache.clear();
        this.rgbToHsvCache.clear();
        this.hsvToRgbCache.clear();
        this.hexToHsvCache.clear();
        this.colorblindCache.clear();
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
        return {
            hexToRgb: this.hexToRgbCache.size,
            rgbToHex: this.rgbToHexCache.size,
            rgbToHsv: this.rgbToHsvCache.size,
            hsvToRgb: this.hsvToRgbCache.size,
            hexToHsv: this.hexToHsvCache.size,
            colorblind: this.colorblindCache.size,
        };
    }

    /**
     * Convert hexadecimal color to RGB
     * Per P-1: Cached for performance
     * @example hexToRgb("#FF0000") -> { r: 255, g: 0, b: 0 }
     */
    static hexToRgb(hex: string): RGB {
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
            hexForCache = hexForCache.split('').map(c => c + c).join('');
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
     * Convert RGB to hexadecimal color
     * Per P-1: Cached for performance
     * @example rgbToHex(255, 0, 0) -> "#FF0000"
     */
    static rgbToHex(r: number, g: number, b: number): HexColor {
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
     * Convert RGB to HSV
     * Per P-1: Cached for performance, optimized single-pass min/max
     * @example rgbToHsv(255, 0, 0) -> { h: 0, s: 100, v: 100 }
     */
    static rgbToHsv(r: number, g: number, b: number): HSV {
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
     * Convert HSV to RGB
     * Per P-1: Cached for performance
     * @example hsvToRgb(0, 100, 100) -> { r: 255, g: 0, b: 0 }
     */
    static hsvToRgb(h: number, s: number, v: number): RGB {
        if (!isValidHSV(h, s, v)) {
            throw new AppError(
                ErrorCode.INVALID_RGB_VALUE,
                `Invalid HSV values: h=${h}, s=${s}, v=${v}`,
                'error'
            );
        }

        // Create cache key (round to avoid floating point precision issues)
        const cacheKey = `${Math.round(h * 100) / 100},${Math.round(s * 100) / 100},${Math.round(v * 100) / 100}`;

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
     * Convert hex to HSV
     * Per P-1: Cached for performance
     */
    static hexToHsv(hex: string): HSV {
        // Normalize hex for cache key
        let hexForCache = hex.toUpperCase().replace('#', '');
        if (hexForCache.length === 3) {
            hexForCache = hexForCache.split('').map(c => c + c).join('');
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
     * Convert HSV to hex
     */
    static hsvToHex(h: number, s: number, v: number): HexColor {
        const rgb = this.hsvToRgb(h, s, v);
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    // ============================================================================
    // Colorblindness Simulation (Brettel 1997)
    // ============================================================================

    /**
     * Simulate colorblindness on an RGB color
     * Uses Brettel 1997 transformation matrices (pre-computed constants)
     * Per P-1: Cached by ${hex}_${visionType} key
     * @example simulateColorblindness({ r: 255, g: 0, b: 0 }, 'deuteranopia')
     */
    static simulateColorblindness(rgb: RGB, visionType: VisionType): RGB {
        if (visionType === 'normal') {
            return { ...rgb };
        }

        if (!isValidRGB(rgb.r, rgb.g, rgb.b)) {
            throw new AppError(
                ErrorCode.INVALID_RGB_VALUE,
                'Invalid RGB values for colorblindness simulation',
                'error'
            );
        }

        // Per P-1: Cache key format: ${r},${g},${b}_${visionType}
        const cacheKey = `${rgb.r},${rgb.g},${rgb.b}_${visionType}`;

        // Check cache
        const cached = this.colorblindCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Per P-1: BRETTEL_MATRICES are already pre-computed constants (no recalculation needed)
        const matrix = BRETTEL_MATRICES[visionType];

        // Normalize RGB to 0-1 range
        const rNorm = rgb.r / 255;
        const gNorm = rgb.g / 255;
        const bNorm = rgb.b / 255;

        // Apply transformation matrix
        const transformedR = round(
            clamp((matrix[0][0] * rNorm + matrix[0][1] * gNorm + matrix[0][2] * bNorm) * 255, 0, 255)
        );
        const transformedG = round(
            clamp((matrix[1][0] * rNorm + matrix[1][1] * gNorm + matrix[1][2] * bNorm) * 255, 0, 255)
        );
        const transformedB = round(
            clamp((matrix[2][0] * rNorm + matrix[2][1] * gNorm + matrix[2][2] * bNorm) * 255, 0, 255)
        );

        const result = { r: transformedR, g: transformedG, b: transformedB };
        // Cache result
        this.colorblindCache.set(cacheKey, result);
        return result;
    }

    /**
     * Simulate colorblindness on a hex color
     */
    static simulateColorblindnessHex(hex: string, visionType: VisionType): HexColor {
        const rgb = this.hexToRgb(hex);
        const simulated = this.simulateColorblindness(rgb, visionType);
        return this.rgbToHex(simulated.r, simulated.g, simulated.b);
    }

    // ============================================================================
    // Color Analysis
    // ============================================================================

    /**
     * Calculate Euclidean distance between two RGB colors
     * Returns 0 for identical colors, ~441.67 for white vs black
     */
    static getColorDistance(hex1: string, hex2: string): number {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);

        const dr = rgb1.r - rgb2.r;
        const dg = rgb1.g - rgb2.g;
        const db = rgb1.b - rgb2.b;

        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Calculate perceived luminance of a color (0-1)
     * Uses relative luminance formula from WCAG
     */
    static getPerceivedLuminance(hex: string): number {
        const rgb = this.hexToRgb(hex);

        // Convert to sRGB (linear RGB)
        const toLinear = (c: number): number => {
            const cNorm = c / 255;
            return cNorm <= 0.03928 ? cNorm / 12.92 : Math.pow((cNorm + 0.055) / 1.055, 2.4);
        };

        const r = toLinear(rgb.r);
        const g = toLinear(rgb.g);
        const b = toLinear(rgb.b);

        // WCAG relative luminance formula
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Calculate contrast ratio between two colors
     * Returns 1 (no contrast) to 21 (maximum contrast)
     */
    static getContrastRatio(hex1: string, hex2: string): number {
        const lum1 = this.getPerceivedLuminance(hex1);
        const lum2 = this.getPerceivedLuminance(hex2);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Check if two colors meet WCAG AA contrast ratio (4.5:1 for small text, 3:1 for large)
     */
    static meetsWCAGAA(hex1: string, hex2: string, largeText: boolean = false): boolean {
        const ratio = this.getContrastRatio(hex1, hex2);
        return ratio >= (largeText ? 3 : 4.5);
    }

    /**
     * Check if two colors meet WCAG AAA contrast ratio (7:1 for small text, 4.5:1 for large)
     */
    static meetsWCAGAAA(hex1: string, hex2: string, largeText: boolean = false): boolean {
        const ratio = this.getContrastRatio(hex1, hex2);
        return ratio >= (largeText ? 4.5 : 7);
    }

    // ============================================================================
    // Color Manipulation
    // ============================================================================

    /**
     * Adjust brightness of a color
     * @param amount -100 to 100 (negative = darker, positive = lighter)
     */
    static adjustBrightness(hex: string, amount: number): HexColor {
        const hsv = this.hexToHsv(hex);
        hsv.v = clamp(hsv.v + amount, 0, 100);
        return this.hsvToHex(hsv.h, hsv.s, hsv.v);
    }

    /**
     * Adjust saturation of a color
     * @param amount -100 to 100 (negative = less saturated, positive = more saturated)
     */
    static adjustSaturation(hex: string, amount: number): HexColor {
        const hsv = this.hexToHsv(hex);
        hsv.s = clamp(hsv.s + amount, 0, 100);
        return this.hsvToHex(hsv.h, hsv.s, hsv.v);
    }

    /**
     * Rotate hue of a color
     * @param degrees 0-360 (amount to rotate hue)
     */
    static rotateHue(hex: string, degrees: number): HexColor {
        const hsv = this.hexToHsv(hex);
        hsv.h = (hsv.h + degrees) % 360;
        return this.hsvToHex(hsv.h, hsv.s, hsv.v);
    }

    /**
     * Invert a color (create complementary color)
     */
    static invert(hex: string): HexColor {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
    }

    /**
     * Desaturate a color (convert to grayscale)
     */
    static desaturate(hex: string): HexColor {
        const hsv = this.hexToHsv(hex);
        return this.hsvToHex(hsv.h, 0, hsv.v);
    }

    // ============================================================================
    // Color Validation & Normalization
    // ============================================================================

    /**
     * Normalize a hex color to #RRGGBB format
     */
    static normalizeHex(hex: string): HexColor {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    /**
     * Check if a color is light (for determining text color on background)
     */
    static isLightColor(hex: string): boolean {
        const luminance = this.getPerceivedLuminance(hex);
        return luminance > 0.5;
    }

    /**
     * Get optimal text color for a background color
     */
    static getOptimalTextColor(backgroundColor: string): HexColor {
        return this.isLightColor(backgroundColor)
            ? createHexColor('#000000')
            : createHexColor('#FFFFFF');
    }
}
