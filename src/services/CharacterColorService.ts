/**
 * @xivdyetools/core - Character Color Service
 *
 * Service for accessing FFXIV character customization colors and
 * finding matching dyes for hair, eye, skin tones etc.
 *
 * @module services/CharacterColorService
 * @example
 * ```typescript
 * import { CharacterColorService, DyeService, dyeDatabase } from '@xivdyetools/core';
 *
 * const characterColors = new CharacterColorService();
 * const dyeService = new DyeService(dyeDatabase);
 *
 * // Get all eye colors
 * const eyeColors = characterColors.getEyeColors();
 *
 * // Find closest dyes to an eye color
 * const matches = characterColors.findClosestDyes(eyeColors[47], dyeService, 3);
 * ```
 */

import type {
  CharacterColor,
  CharacterColorMatch,
  SharedColorCategory,
  RaceSpecificColorCategory,
  SubRace,
  Gender,
} from '@xivdyetools/types';
import type { RGB, MatchingMethod, OklchWeights } from '../types/index.js';
import type { DyeService } from './DyeService.js';
import { ColorConverter } from './color/ColorConverter.js';

/**
 * Options for finding closest dye matches from character colors.
 */
export interface CharacterMatchOptions {
  /** Number of matches to return (default: 3) */
  count?: number;
  /** Color matching algorithm (default: 'oklab') */
  matchingMethod?: MatchingMethod;
  /** Custom weights for oklch-weighted method */
  weights?: OklchWeights;
}

// Import character color data
import characterColorData from '../data/character_colors.json';

/**
 * Internal data structure for the JSON file
 */
interface CharacterColorData {
  meta: {
    version: string;
    description: string;
    gridColumns: number;
  };
  shared: Record<string, CharacterColor[]>;
  raceSpecific: {
    hairColors: Record<string, Record<string, CharacterColor[]>>;
    skinColors: Record<string, Record<string, CharacterColor[]>>;
  };
}

/**
 * Service for accessing FFXIV character customization colors
 */
export class CharacterColorService {
  private data: CharacterColorData;

  constructor() {
    this.data = characterColorData as CharacterColorData;
  }

  // ==========================================================================
  // Shared Colors (Race-Agnostic)
  // ==========================================================================

  /**
   * Get all eye colors (192 colors)
   */
  getEyeColors(): CharacterColor[] {
    return this.data.shared.eyeColors || [];
  }

  /**
   * Get all hair highlight colors (192 colors)
   */
  getHighlightColors(): CharacterColor[] {
    return this.data.shared.highlightColors || [];
  }

  /**
   * Get all dark lip colors (96 colors)
   */
  getLipColorsDark(): CharacterColor[] {
    return this.data.shared.lipColorsDark || [];
  }

  /**
   * Get all light lip colors (96 colors)
   */
  getLipColorsLight(): CharacterColor[] {
    return this.data.shared.lipColorsLight || [];
  }

  /**
   * Get all tattoo/limbal ring colors (192 colors)
   */
  getTattooColors(): CharacterColor[] {
    return this.data.shared.tattooColors || [];
  }

  /**
   * Get all dark face paint colors (96 colors)
   */
  getFacePaintColorsDark(): CharacterColor[] {
    return this.data.shared.facePaintColorsDark || [];
  }

  /**
   * Get all light face paint colors (96 colors)
   */
  getFacePaintColorsLight(): CharacterColor[] {
    return this.data.shared.facePaintColorsLight || [];
  }

  /**
   * Get shared colors by category
   */
  getSharedColors(category: SharedColorCategory): CharacterColor[] {
    return this.data.shared[category] || [];
  }

  // ==========================================================================
  // Race-Specific Colors
  // ==========================================================================

  /**
   * Get hair colors for a specific subrace and gender (192 colors each)
   */
  getHairColors(subrace: SubRace, gender: Gender): CharacterColor[] {
    return this.data.raceSpecific.hairColors?.[subrace]?.[gender] || [];
  }

  /**
   * Get skin colors for a specific subrace and gender (192 colors each)
   */
  getSkinColors(subrace: SubRace, gender: Gender): CharacterColor[] {
    return this.data.raceSpecific.skinColors?.[subrace]?.[gender] || [];
  }

  /**
   * Get race-specific colors by category
   */
  getRaceSpecificColors(
    category: RaceSpecificColorCategory,
    subrace: SubRace,
    gender: Gender
  ): CharacterColor[] {
    return this.data.raceSpecific[category]?.[subrace]?.[gender] || [];
  }

  // ==========================================================================
  // Color Matching
  // ==========================================================================

  /**
   * Calculate color distance using the specified matching method.
   * Converts RGB to hex for perceptual methods that require it.
   */
  private calculateDistanceWithMethod(
    rgb1: RGB,
    rgb2: RGB,
    method: MatchingMethod,
    weights?: OklchWeights
  ): number {
    // For RGB method, use simple Euclidean distance
    if (method === 'rgb') {
      return this.calculateDistance(rgb1, rgb2);
    }

    // Convert RGB to hex for perceptual methods
    const hex1 = ColorConverter.rgbToHex(rgb1.r, rgb1.g, rgb1.b);
    const hex2 = ColorConverter.rgbToHex(rgb2.r, rgb2.g, rgb2.b);

    switch (method) {
      case 'cie76':
        return ColorConverter.getDeltaE(hex1, hex2, 'cie76');
      case 'ciede2000':
        return ColorConverter.getDeltaE(hex1, hex2, 'cie2000');
      case 'oklab':
        return ColorConverter.getDeltaE_Oklab(hex1, hex2);
      case 'hyab':
        return ColorConverter.getDeltaE_HyAB(hex1, hex2);
      case 'oklch-weighted':
        return ColorConverter.getDeltaE_OklchWeighted(hex1, hex2, weights);
      default:
        return ColorConverter.getDeltaE_Oklab(hex1, hex2);
    }
  }

  /**
   * Find the closest matching dyes to a character color.
   *
   * Supports configurable matching algorithms via the options parameter.
   *
   * @param color - The character color to match
   * @param dyeService - DyeService instance for dye lookup
   * @param countOrOptions - Number of matches (legacy) or options object
   * @returns Array of matches sorted by distance (closest first)
   *
   * @example
   * ```typescript
   * const eyeColor = characterColors.getEyeColors()[47];
   *
   * // Legacy usage
   * const matches = characterColors.findClosestDyes(eyeColor, dyeService, 3);
   *
   * // New usage with options
   * const matches = characterColors.findClosestDyes(eyeColor, dyeService, {
   *   count: 3,
   *   matchingMethod: 'oklab'
   * });
   * ```
   */
  findClosestDyes(
    color: CharacterColor,
    dyeService: DyeService,
    countOrOptions: number | CharacterMatchOptions = 3
  ): CharacterColorMatch[] {
    // Support both legacy (count number) and new (options object) signatures
    const options: CharacterMatchOptions =
      typeof countOrOptions === 'number' ? { count: countOrOptions } : countOrOptions;

    const { count = 3, matchingMethod = 'oklab', weights } = options;

    const allDyes = dyeService.getAllDyes();
    const results: CharacterColorMatch[] = [];

    for (const dye of allDyes) {
      // Skip Facewear dyes (not usable for regular glamour)
      if (dye.category === 'Facewear') {
        continue;
      }

      const distance = this.calculateDistanceWithMethod(
        color.rgb,
        dye.rgb,
        matchingMethod,
        weights
      );
      results.push({
        characterColor: color,
        dye,
        distance,
      });
    }

    // Sort by distance and return top N
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, count);
  }

  /**
   * Find the single closest dye to a character color
   */
  findClosestDye(color: CharacterColor, dyeService: DyeService): CharacterColorMatch | null {
    const matches = this.findClosestDyes(color, dyeService, 1);
    return matches[0] || null;
  }

  /**
   * Find all dyes within a color distance threshold
   */
  findDyesWithinDistance(
    color: CharacterColor,
    dyeService: DyeService,
    maxDistance: number
  ): CharacterColorMatch[] {
    const allDyes = dyeService.getAllDyes();
    const results: CharacterColorMatch[] = [];

    for (const dye of allDyes) {
      if (dye.category === 'Facewear') {
        continue;
      }

      const distance = this.calculateDistance(color.rgb, dye.rgb);
      if (distance <= maxDistance) {
        results.push({
          characterColor: color,
          dye,
          distance,
        });
      }
    }

    results.sort((a, b) => a.distance - b.distance);
    return results;
  }

  // ==========================================================================
  // Color Lookup
  // ==========================================================================

  /**
   * Get a specific color by index from a shared category
   */
  getSharedColorByIndex(category: SharedColorCategory, index: number): CharacterColor | null {
    const colors = this.getSharedColors(category);
    return colors.find((c) => c.index === index) || null;
  }

  /**
   * Get a specific color by index from a race-specific category
   */
  getRaceSpecificColorByIndex(
    category: RaceSpecificColorCategory,
    subrace: SubRace,
    gender: Gender,
    index: number
  ): CharacterColor | null {
    const colors = this.getRaceSpecificColors(category, subrace, gender);
    return colors.find((c) => c.index === index) || null;
  }

  // ==========================================================================
  // Metadata
  // ==========================================================================

  /**
   * Get all available subraces
   */
  getAvailableSubraces(): SubRace[] {
    const hairColors = this.data.raceSpecific.hairColors || {};
    return Object.keys(hairColors) as SubRace[];
  }

  /**
   * Get the data version
   */
  getVersion(): string {
    return this.data.meta.version;
  }

  /**
   * Get grid column count (always 8)
   */
  getGridColumns(): number {
    return this.data.meta.gridColumns;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Calculate Euclidean distance in RGB space
   */
  private calculateDistance(rgb1: RGB, rgb2: RGB): number {
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
}
