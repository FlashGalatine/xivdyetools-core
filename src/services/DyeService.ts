/**
 * @xivdyetools/core - Dye Service
 *
 * FFXIV dye database management and search.
 * Provides access to the complete FFXIV dye database with search,
 * matching, and color harmony generation capabilities.
 *
 * Per R-4: Facade class that delegates to focused service classes
 * Maintains backward compatibility while using split services internally
 *
 * Environment-agnostic (Node.js + Browser).
 *
 * @module services/DyeService
 * @example
 * ```typescript
 * import { DyeService, dyeDatabase } from '@xivdyetools/core';
 *
 * const dyeService = new DyeService(dyeDatabase);
 *
 * // Find closest dye to a color
 * const closestDye = dyeService.findClosestDye('#FF0000');
 *
 * // Generate color harmonies
 * const harmonies = dyeService.findTriadicDyes('#FF0000');
 * ```
 */

import type { Dye, LocalizedDye, Logger } from '../types/index.js';
import { NoOpLogger } from '../types/index.js';
import { DyeDatabase } from './dye/DyeDatabase.js';
import { DyeSearch } from './dye/DyeSearch.js';
import { HarmonyGenerator } from './dye/HarmonyGenerator.js';
import { LocalizationService } from './LocalizationService.js';

/**
 * Configuration options for DyeService
 */
export interface DyeServiceOptions {
  /**
   * Logger for service operations (defaults to NoOpLogger)
   */
  logger?: Logger;
}

/**
 * Service for managing FFXIV dye database (Facade)
 * Per R-4: Delegates to focused service classes for better separation of concerns
 * Maintains backward compatibility with existing API
 *
 * @example
 * // Node.js
 * import { DyeService, dyeDatabase } from '@xivdyetools/core';
 * const dyeService = new DyeService(dyeDatabase);
 *
 * // Browser (Vite auto-imports JSON)
 * import { DyeService, dyeDatabase } from '@xivdyetools/core';
 * const dyeService = new DyeService(dyeDatabase);
 *
 * // With custom logger
 * import { ConsoleLogger } from '@xivdyetools/core';
 * const dyeService = new DyeService(dyeDatabase, { logger: ConsoleLogger });
 */
export class DyeService {
  private database: DyeDatabase;
  private search: DyeSearch;
  private harmony: HarmonyGenerator;

  /**
   * Initialize the dye database
   * @param dyeData - Array of dyes or JSON object with dye array
   * @param options - Optional configuration including logger
   */
  constructor(dyeData?: unknown, options: DyeServiceOptions = {}) {
    const logger = options.logger ?? NoOpLogger;
    this.database = new DyeDatabase({ logger });
    this.search = new DyeSearch(this.database);
    this.harmony = new HarmonyGenerator(this.database, this.search);

    if (dyeData) {
      this.database.initialize(dyeData);
    }
  }

  // ============================================================================
  // Database Access (delegated to DyeDatabase)
  // ============================================================================

  /**
   * Get all dyes (defensive copy)
   */
  getAllDyes(): Dye[] {
    return this.database.getAllDyes();
  }

  /**
   * Get dye by ID
   */
  getDyeById(id: number): Dye | null {
    return this.database.getDyeById(id);
  }

  /**
   * Get multiple dyes by IDs
   */
  getDyesByIds(ids: number[]): Dye[] {
    return this.database.getDyesByIds(ids);
  }

  /**
   * Check if database is loaded
   */
  isLoadedStatus(): boolean {
    return this.database.isLoadedStatus();
  }

  /**
   * Get timestamp of last load
   */
  getLastLoadedTime(): number {
    return this.database.getLastLoadedTime();
  }

  /**
   * Get total dye count
   */
  getDyeCount(): number {
    return this.database.getDyeCount();
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    return this.database.getCategories();
  }

  // ============================================================================
  // Search & Filter (delegated to DyeSearch)
  // ============================================================================

  /**
   * Search dyes by name (case-insensitive, partial match)
   */
  searchByName(query: string): Dye[] {
    return this.search.searchByName(query);
  }

  /**
   * Search dyes by category
   */
  searchByCategory(category: string): Dye[] {
    return this.search.searchByCategory(category);
  }

  /**
   * Filter dyes with optional exclusion list
   */
  filterDyes(
    filter: {
      category?: string;
      excludeIds?: number[];
      minPrice?: number;
      maxPrice?: number;
    } = {}
  ): Dye[] {
    return this.search.filterDyes(filter);
  }

  /**
   * Find closest dye to a given hex color
   * Per P-7: Uses k-d tree for O(log n) average case vs O(n) linear search
   */
  findClosestDye(hex: string, excludeIds: number[] = []): Dye | null {
    return this.search.findClosestDye(hex, excludeIds);
  }

  /**
   * Find dyes within a color distance threshold
   * Per P-7: Uses k-d tree for efficient range queries
   */
  findDyesWithinDistance(hex: string, maxDistance: number, limit?: number): Dye[] {
    return this.search.findDyesWithinDistance(hex, maxDistance, limit);
  }

  /**
   * Get dyes sorted by brightness
   */
  getDyesSortedByBrightness(ascending: boolean = true): Dye[] {
    return this.search.getDyesSortedByBrightness(ascending);
  }

  /**
   * Get dyes sorted by saturation
   */
  getDyesSortedBySaturation(ascending: boolean = true): Dye[] {
    return this.search.getDyesSortedBySaturation(ascending);
  }

  /**
   * Get dyes sorted by hue
   */
  getDyesSortedByHue(ascending: boolean = true): Dye[] {
    return this.search.getDyesSortedByHue(ascending);
  }

  // ============================================================================
  // Harmony & Palette Generation (delegated to HarmonyGenerator)
  // ============================================================================

  /**
   * Find dyes that form a complementary color pair
   */
  findComplementaryPair(hex: string): Dye | null {
    return this.harmony.findComplementaryPair(hex);
  }

  /**
   * Find analogous dyes (adjacent on color wheel)
   * Returns dyes at ±angle degrees from the base color
   */
  findAnalogousDyes(hex: string, angle: number = 30): Dye[] {
    return this.harmony.findAnalogousDyes(hex, angle);
  }

  /**
   * Find triadic color scheme (colors 120° apart on color wheel)
   */
  findTriadicDyes(hex: string): Dye[] {
    return this.harmony.findTriadicDyes(hex);
  }

  /**
   * Find square color scheme (colors 90° apart on color wheel)
   */
  findSquareDyes(hex: string): Dye[] {
    return this.harmony.findSquareDyes(hex);
  }

  /**
   * Find tetradic color scheme (two complementary pairs)
   */
  findTetradicDyes(hex: string): Dye[] {
    return this.harmony.findTetradicDyes(hex);
  }

  /**
   * Find monochromatic dyes (same hue, varying saturation/brightness)
   */
  findMonochromaticDyes(hex: string, limit: number = 6): Dye[] {
    return this.harmony.findMonochromaticDyes(hex, limit);
  }

  /**
   * Find compound harmony (analogous + complementary)
   */
  findCompoundDyes(hex: string): Dye[] {
    return this.harmony.findCompoundDyes(hex);
  }

  /**
   * Find split-complementary harmony (±30° from the complementary hue)
   */
  findSplitComplementaryDyes(hex: string): Dye[] {
    return this.harmony.findSplitComplementaryDyes(hex);
  }

  /**
   * Find shades (similar tones, ±15°)
   */
  findShadesDyes(hex: string): Dye[] {
    return this.harmony.findShadesDyes(hex);
  }

  // ============================================================================
  // Localization Support (NEW)
  // ============================================================================

  /**
   * Search dyes by name (searches both English + localized names)
   * If no locale is loaded, falls back to English-only search
   *
   * @param query - Search query
   * @returns Matching dyes
   *
   * @example
   * ```typescript
   * await LocalizationService.setLocale('ja');
   * const results = dyeService.searchByLocalizedName('スノウ');
   * // Finds "Snow White" (スノウホワイト)
   * ```
   */
  searchByLocalizedName(query: string): Dye[] {
    if (!LocalizationService.isLocaleLoaded()) {
      return this.searchByName(query); // Fallback to English-only
    }

    const lowerQuery = query.toLowerCase().trim();
    const dyes = this.database.getDyesInternal();

    return dyes.filter((dye) => {
      // Search English name - MEM-001: Use pre-computed nameLower
      if (dye.nameLower.includes(lowerQuery)) {
        return true;
      }

      // Search localized name (not pre-computed as it's dynamically loaded)
      const localizedName = LocalizationService.getDyeName(dye.itemID);
      if (localizedName?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get dye by ID with localized name
   * Returns Dye with localizedName property if locale loaded
   *
   * @param id - Dye ID
   * @returns Localized dye or null if not found
   *
   * @example
   * ```typescript
   * const dye = dyeService.getLocalizedDyeById(5729);
   * const displayName = dye.localizedName || dye.name;
   * // "スノウホワイト" (ja) or "Snow White" (en)
   * ```
   */
  getLocalizedDyeById(id: number): LocalizedDye | null {
    const dye = this.getDyeById(id);
    if (!dye) return null;

    if (!LocalizationService.isLocaleLoaded()) {
      return dye;
    }

    return {
      ...dye,
      localizedName: LocalizationService.getDyeName(dye.itemID) || undefined,
    };
  }

  /**
   * Get all dyes with localized names
   * Returns array of dyes with localizedName property if locale loaded
   *
   * @returns Array of localized dyes
   *
   * @example
   * ```typescript
   * await LocalizationService.setLocale('ja');
   * const dyes = dyeService.getAllLocalizedDyes();
   * dyes.forEach(dye => {
   *     console.log(dye.localizedName || dye.name);
   * });
   * ```
   */
  getAllLocalizedDyes(): LocalizedDye[] {
    const dyes = this.getAllDyes();

    if (!LocalizationService.isLocaleLoaded()) {
      return dyes;
    }

    return dyes.map((dye) => ({
      ...dye,
      localizedName: LocalizationService.getDyeName(dye.itemID) || undefined,
    }));
  }

  /**
   * Get all non-metallic dyes (locale-aware)
   * Excludes dyes based on metallic dye IDs from current locale
   *
   * @returns Array of non-metallic dyes
   *
   * @example
   * ```typescript
   * // Works in any locale - correctly excludes metallic dyes
   * const nonMetallic = dyeService.getNonMetallicDyes();
   * // Excludes: Metallic Silver, Metallic Brass, etc.
   * ```
   */
  getNonMetallicDyes(): Dye[] {
    const metallicIds = new Set(LocalizationService.getMetallicDyeIds());
    return this.getAllDyes().filter((dye) => !metallicIds.has(dye.itemID));
  }
}
