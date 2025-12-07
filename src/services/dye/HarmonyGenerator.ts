/**
 * Harmony Generator
 * Per R-4: Focused class for color harmony generation
 * Handles triadic, analogous, complementary, and other harmony schemes
 */

import type { Dye } from '../../types/index.js';
import { ColorManipulator } from '../color/ColorManipulator.js';
import type { DyeDatabase } from './DyeDatabase.js';
import type { DyeSearch } from './DyeSearch.js';

/**
 * Color harmony generator
 * Per R-4: Single Responsibility - harmony generation only
 */
export class HarmonyGenerator {
  constructor(
    private database: DyeDatabase,
    private search: DyeSearch
  ) {}

  /**
   * Find dyes that form a complementary color pair
   * Excludes Facewear dyes (generic names like "Red", "Blue")
   */
  findComplementaryPair(hex: string): Dye | null {
    this.database.ensureLoaded();

    try {
      const complementaryHex = ColorManipulator.invert(hex);
      // Find closest dye, excluding Facewear
      return this.findClosestNonFacewearDye(complementaryHex);
    } catch {
      // Invalid hex color
      return null;
    }
  }

  /**
   * Find the closest dye that is not Facewear
   * Iteratively searches until a non-Facewear dye is found
   */
  private findClosestNonFacewearDye(hex: string, excludeIds: number[] = []): Dye | null {
    const allExcluded = [...excludeIds];

    for (let i = 0; i < 10; i++) {
      const candidate = this.search.findClosestDye(hex, allExcluded);
      if (!candidate) return null;

      if (candidate.category !== 'Facewear') {
        return candidate;
      }

      // This candidate is Facewear, exclude it and try again
      allExcluded.push(candidate.id);
    }

    return null;
  }

  /**
   * Find analogous dyes (adjacent on color wheel)
   * Returns dyes at ±angle degrees from the base color
   *
   * @remarks
   * May return fewer dyes than expected if no suitable matches exist
   * at the target hue positions or if all candidates are excluded.
   */
  findAnalogousDyes(hex: string, angle: number = 30): Dye[] {
    // Use harmony helper to find dyes at +angle and -angle positions
    return this.findHarmonyDyesByOffsets(hex, [angle, -angle]);
  }

  /**
   * Find triadic color scheme (colors 120° apart on color wheel)
   *
   * @remarks
   * May return 0, 1, or 2 dyes depending on available matches.
   * Use the length of the returned array to determine actual results.
   */
  findTriadicDyes(hex: string): Dye[] {
    return this.findHarmonyDyesByOffsets(hex, [120, 240]);
  }

  /**
   * Find square color scheme (colors 90° apart on color wheel)
   *
   * @remarks
   * May return fewer than 3 dyes if suitable matches are not found.
   */
  findSquareDyes(hex: string): Dye[] {
    return this.findHarmonyDyesByOffsets(hex, [90, 180, 270]);
  }

  /**
   * Find tetradic color scheme (two complementary pairs)
   *
   * @remarks
   * May return fewer than 3 dyes if suitable matches are not found.
   */
  findTetradicDyes(hex: string): Dye[] {
    // Two adjacent hues + their complements (e.g., base+60 and base+240)
    return this.findHarmonyDyesByOffsets(hex, [60, 180, 240]);
  }

  /**
   * Find monochromatic dyes (same hue, varying saturation/brightness)
   * Excludes Facewear dyes (generic names like "Red", "Blue")
   */
  findMonochromaticDyes(hex: string, limit: number = 6): Dye[] {
    this.database.ensureLoaded();

    const baseDye = this.findClosestNonFacewearDye(hex);
    if (!baseDye) return [];

    const baseHue = baseDye.hsv.h;
    const results: Array<{ dye: Dye; satValDiff: number }> = [];
    const dyes = this.database.getDyesInternal();

    // Find dyes with similar hue but different saturation/value
    for (const dye of dyes) {
      // Skip Facewear dyes (generic names)
      if (dye.category === 'Facewear') continue;

      const hueDiff = Math.min(Math.abs(dye.hsv.h - baseHue), 360 - Math.abs(dye.hsv.h - baseHue));

      // Hue must be very close (within ±15°)
      if (hueDiff <= 15 && dye.id !== baseDye.id) {
        // Calculate difference in saturation and value
        const satDiff = Math.abs(dye.hsv.s - baseDye.hsv.s);
        const valDiff = Math.abs(dye.hsv.v - baseDye.hsv.v);
        const satValDiff = satDiff + valDiff;

        results.push({ dye, satValDiff });
      }
    }

    // Sort by saturation/value difference (prefer more variety)
    results.sort((a, b) => b.satValDiff - a.satValDiff);

    return results.slice(0, limit).map((item) => item.dye);
  }

  /**
   * Find compound harmony (analogous + complementary)
   *
   * @remarks
   * May return fewer than 3 dyes if suitable matches are not found.
   */
  findCompoundDyes(hex: string): Dye[] {
    // ±30° from base + complement
    return this.findHarmonyDyesByOffsets(hex, [30, -30, 180], { tolerance: 35 });
  }

  /**
   * Find split-complementary harmony (±30° from the complementary hue)
   *
   * @remarks
   * May return 0, 1, or 2 dyes depending on available matches.
   */
  findSplitComplementaryDyes(hex: string): Dye[] {
    return this.findHarmonyDyesByOffsets(hex, [150, 210]);
  }

  /**
   * Find shades (similar tones, ±15°)
   *
   * @remarks
   * May return 0, 1, or 2 dyes depending on available matches.
   */
  findShadesDyes(hex: string): Dye[] {
    this.database.ensureLoaded();

    // Use tighter tolerance (5°) for shades to ensure results are close to target hue
    return this.findHarmonyDyesByOffsets(hex, [15, -15], { tolerance: 5 });
  }

  /**
   * Generic helper for hue-based harmonies
   *
   * @remarks
   * This method may return fewer dyes than the number of offsets provided.
   * This can happen when:
   * - No dyes exist near the target hue position
   * - All candidate dyes are in the 'Facewear' category (excluded)
   * - The same dye would be selected multiple times (prevented by usedDyeIds)
   *
   * Consumers should check the returned array length rather than assuming
   * a fixed number of results.
   *
   * @param hex - Base hex color
   * @param offsets - Array of hue offsets in degrees
   * @param options - Options including tolerance (default: 45°)
   * @returns Array of matched dyes (may be shorter than offsets array)
   */
  private findHarmonyDyesByOffsets(
    hex: string,
    offsets: number[],
    options: { tolerance?: number } = {}
  ): Dye[] {
    this.database.ensureLoaded();

    const baseDye = this.search.findClosestDye(hex);
    if (!baseDye) return [];

    const usedDyeIds = new Set<number>([baseDye.id]);
    const results: Dye[] = [];
    const baseHue = baseDye.hsv.h;
    const tolerance = options.tolerance ?? 45;

    for (const offset of offsets) {
      const targetHue = (baseHue + offset + 360) % 360;
      const match = this.findClosestDyeByHue(targetHue, usedDyeIds, tolerance);
      if (match) {
        results.push(match);
        usedDyeIds.add(match.id);
      }
    }

    return results;
  }

  /**
   * Find closest dye by hue difference with graceful fallback
   * Per P-2: Uses hue-indexed map for 70-90% speedup
   */
  private findClosestDyeByHue(
    targetHue: number,
    usedIds: Set<number>,
    tolerance: number
  ): Dye | null {
    let withinTolerance: { dye: Dye; diff: number } | null = null;
    let bestOverall: { dye: Dye; diff: number } | null = null;

    // Per P-2: Only search relevant hue buckets instead of all dyes
    const bucketsToSearch = this.database.getHueBucketsToSearch(targetHue, tolerance);

    for (const bucket of bucketsToSearch) {
      const dyesInBucket = this.database.getDyesByHueBucket(bucket);

      for (const dye of dyesInBucket) {
        if (usedIds.has(dye.id) || dye.category === 'Facewear') {
          continue;
        }

        const diff = Math.min(
          Math.abs(dye.hsv.h - targetHue),
          360 - Math.abs(dye.hsv.h - targetHue)
        );

        if (!bestOverall || diff < bestOverall.diff) {
          bestOverall = { dye, diff };
        }

        if (diff <= tolerance) {
          if (!withinTolerance || diff < withinTolerance.diff) {
            withinTolerance = { dye, diff };
          }
        }
      }
    }

    return withinTolerance?.dye ?? bestOverall?.dye ?? null;
  }
}
