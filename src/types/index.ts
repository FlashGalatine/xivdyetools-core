/**
 * @xivdyetools/core - Shared Type Definitions
 *
 * Type definitions for color science and FFXIV dyes
 *
 * @module types
 */

// ============================================================================
// Color Type System
// ============================================================================

/**
 * RGB color representation
 * @example { r: 255, g: 0, b: 0 } // Red
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * HSV color representation (Hue, Saturation, Value)
 * @example { h: 0, s: 100, v: 100 } // Bright red
 */
export interface HSV {
  h: number; // 0-360 degrees
  s: number; // 0-100 percent
  v: number; // 0-100 percent
}

/**
 * Hexadecimal color string (branded type for type safety)
 * Per R-1: Branded types prevent type confusion
 * @example "#FF0000"
 */
export type HexColor = string & { readonly __brand: 'HexColor' };

/**
 * Helper to create branded HexColor type with validation
 * Per R-1: Validates hex format before creating branded type
 * @throws {Error} If hex format is invalid
 */
export function createHexColor(hex: string): HexColor {
  // Basic validation - must be #RRGGBB or #RGB format
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    throw new Error(`Invalid hex color format: ${hex}. Expected #RRGGBB or #RGB format.`);
  }
  // Normalize to uppercase #RRGGBB
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase()
      : hex.toUpperCase();
  return normalized as HexColor;
}

/**
 * Dye ID (branded type for type safety)
 * Per R-1: Prevents accidental mixing with other numbers
 */
export type DyeId = number & { readonly __brand: 'DyeId' };

/**
 * Helper to create branded DyeId type with validation
 * Per R-1: Validates dye ID is in valid range (1-200)
 */
export function createDyeId(id: number): DyeId | null {
  if (!Number.isInteger(id) || id < 1 || id > 200) {
    return null;
  }
  return id as DyeId;
}

/**
 * Hue value (0-360 degrees, branded type)
 * Per R-1: Prevents mixing with other angle values
 */
export type Hue = number & { readonly __brand: 'Hue' };

/**
 * Helper to create branded Hue type with normalization
 * Per R-1: Normalizes hue to 0-360 range
 */
export function createHue(hue: number): Hue {
  // Normalize to 0-360 range
  const normalized = ((hue % 360) + 360) % 360;
  return normalized as Hue;
}

/**
 * Saturation value (0-100 percent, branded type)
 * Per R-1: Prevents mixing with other percentage values
 */
export type Saturation = number & { readonly __brand: 'Saturation' };

/**
 * Helper to create branded Saturation type with clamping
 * Per R-1: Clamps saturation to 0-100 range
 */
export function createSaturation(saturation: number): Saturation {
  const clamped = Math.max(0, Math.min(100, saturation));
  return clamped as Saturation;
}

// ============================================================================
// Colorblindness Types
// ============================================================================

/**
 * Vision types supported by accessibility checker
 */
export type VisionType = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia';

/**
 * 3x3 transformation matrix for colorblindness simulation
 * [row][column] indexing for RGB to RGB transformation
 */
export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/**
 * Colorblindness transformation matrices (Brettel 1997)
 */
export interface ColorblindMatrices {
  deuteranopia: Matrix3x3;
  protanopia: Matrix3x3;
  tritanopia: Matrix3x3;
  achromatopsia: Matrix3x3;
}

// ============================================================================
// FFXIV Dye Types
// ============================================================================

/**
 * FFXIV dye object with color and metadata
 */
export interface Dye {
  itemID: number;
  id: number;
  name: string;
  hex: string; // #RRGGBB
  rgb: RGB;
  hsv: HSV;
  category: string; // 'Neutral', 'Red', 'Blue', etc.
  acquisition: string; // How to obtain the dye
  cost: number; // Gil cost
}

/**
 * Localized dye with optional translated name
 */
export interface LocalizedDye extends Dye {
  localizedName?: string;
}

// ============================================================================
// Localization Types
// ============================================================================

/**
 * Supported locale codes
 */
export type LocaleCode = 'en' | 'ja' | 'de' | 'fr';

/**
 * Translation keys for UI labels
 */
export type TranslationKey =
  | 'dye'
  | 'dark'
  | 'metallic'
  | 'pastel'
  | 'cosmic'
  | 'cosmicExploration'
  | 'cosmicFortunes';

/**
 * Harmony type keys
 */
export type HarmonyTypeKey =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'splitComplementary'
  | 'tetradic'
  | 'square'
  | 'monochromatic'
  | 'compound'
  | 'shades';

/**
 * Locale data structure matching generated JSON files
 */
export interface LocaleData {
  locale: LocaleCode;
  meta: {
    version: string;
    generated: string;
    dyeCount: number;
  };
  labels: Record<TranslationKey, string>;
  dyeNames: Record<string, string>;
  categories: Record<string, string>;
  acquisitions: Record<string, string>;
  metallicDyeIds: number[];
  harmonyTypes: Record<HarmonyTypeKey, string>;
  visionTypes: Record<VisionType, string>;
}

/**
 * Locale preference for resolving user's preferred language
 * Priority: explicit > guild > system > fallback
 */
export interface LocalePreference {
  /** Explicit user selection (highest priority) */
  explicit?: LocaleCode;
  /** Guild/server preference (Discord only) */
  guild?: string;
  /** User's system language */
  system?: string;
  /** Fallback locale (always 'en') */
  fallback: LocaleCode;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Universalis API response for item prices
 */
export interface PriceData {
  itemID: number;
  currentAverage: number;
  currentMinPrice: number;
  currentMaxPrice: number;
  lastUpdate: number;
}

/**
 * Cached API data with TTL and integrity checking
 */
export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string; // Cache version for invalidation
  checksum?: string; // Optional checksum for corruption detection
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Severity levels for application errors
 */
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Custom error class with severity and code
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public severity: ErrorSeverity = 'error'
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      stack: this.stack,
    };
  }
}

/**
 * Error codes for different failure scenarios
 */
export enum ErrorCode {
  INVALID_HEX_COLOR = 'INVALID_HEX_COLOR',
  INVALID_RGB_VALUE = 'INVALID_RGB_VALUE',
  DYE_NOT_FOUND = 'DYE_NOT_FOUND',
  DATABASE_LOAD_FAILED = 'DATABASE_LOAD_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  API_CALL_FAILED = 'API_CALL_FAILED',
  LOCALE_LOAD_FAILED = 'LOCALE_LOAD_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
