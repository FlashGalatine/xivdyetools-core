/**
 * Dye Search
 * Per R-4: Focused class for dye search and matching operations
 * Handles finding dyes by name, category, color distance, etc.
 */

import type { Dye } from '../../types/index.js';
import { ColorConverter } from '../color/ColorConverter.js';
import type { Point3D } from '../../utils/kd-tree.js';
import type { DyeDatabase } from './DyeDatabase.js';

/**
 * Dye search and matching utilities
 * Per R-4: Single Responsibility - search operations only
 */
export class DyeSearch {
  constructor(private database: DyeDatabase) {}

  /**
   * Search dyes by name (case-insensitive, partial match)
   */
  searchByName(query: string): Dye[] {
    this.database.ensureLoaded();
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery.length === 0) {
      return [];
    }

    const dyes = this.database.getDyesInternal();
    return dyes.filter((dye) => dye.name.toLowerCase().includes(lowerQuery));
  }

  /**
   * Search dyes by category
   */
  searchByCategory(category: string): Dye[] {
    this.database.ensureLoaded();
    const lowerCategory = category.toLowerCase();

    const dyes = this.database.getDyesInternal();
    return dyes.filter((dye) => dye.category.toLowerCase() === lowerCategory);
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
    this.database.ensureLoaded();
    let results = [...this.database.getDyesInternal()];

    if (filter.category) {
      results = results.filter((dye) => dye.category === filter.category);
    }

    if (filter.excludeIds && filter.excludeIds.length > 0) {
      const excludeSet = new Set(filter.excludeIds);
      results = results.filter((dye) => !excludeSet.has(dye.id));
    }

    if (filter.minPrice !== undefined) {
      results = results.filter((dye) => dye.cost >= filter.minPrice!);
    }

    if (filter.maxPrice !== undefined) {
      results = results.filter((dye) => dye.cost <= filter.maxPrice!);
    }

    return results;
  }

  /**
   * Find closest dye to a given hex color
   * Per P-7: Uses k-d tree for O(log n) average case vs O(n) linear search
   */
  findClosestDye(hex: string, excludeIds: number[] = []): Dye | null {
    this.database.ensureLoaded();

    try {
      const targetRgb = ColorConverter.hexToRgb(hex);
      const targetPoint: Point3D = {
        x: targetRgb.r,
        y: targetRgb.g,
        z: targetRgb.b,
      };

      // Per P-7: Use k-d tree if available
      const kdTree = this.database.getKdTree();
      if (kdTree && !kdTree.isEmpty()) {
        const excludeSet = new Set(excludeIds);
        const nearest = kdTree.nearestNeighbor(targetPoint, (data) => {
          const dye = data as Dye;
          return excludeSet.has(dye.id);
        });

        if (nearest && nearest.data) {
          return nearest.data as Dye;
        }
      }

      // Fallback to linear search (shouldn't happen if k-d tree is built)
      let closest: Dye | null = null;
      let minDistance = Infinity;
      const excludeSet = new Set(excludeIds);
      const dyes = this.database.getDyesInternal();

      for (const dye of dyes) {
        if (excludeSet.has(dye.id) || dye.category === 'Facewear') {
          continue;
        }

        try {
          const distance = ColorConverter.getColorDistance(hex, dye.hex);
          if (distance < minDistance) {
            minDistance = distance;
            closest = dye;
          }
        } catch {
          continue;
        }
      }

      return closest;
    } catch {
      return null;
    }
  }

  /**
   * Find dyes within a color distance threshold
   * Per P-7: Uses k-d tree for efficient range queries
   */
  findDyesWithinDistance(hex: string, maxDistance: number, limit?: number): Dye[] {
    this.database.ensureLoaded();

    try {
      const targetRgb = ColorConverter.hexToRgb(hex);
      const targetPoint: Point3D = {
        x: targetRgb.r,
        y: targetRgb.g,
        z: targetRgb.b,
      };

      // Per P-7: Use k-d tree if available
      const kdTree = this.database.getKdTree();
      if (kdTree && !kdTree.isEmpty()) {
        const kdResults = kdTree.pointsWithinDistance(targetPoint, maxDistance);

        // Convert to Dye array and apply limit
        const dyes = kdResults.map((item) => item.point.data as Dye);

        if (limit && limit > 0) {
          return dyes.slice(0, limit);
        }

        return dyes;
      }

      // Fallback to linear search
      const results: Array<{ dye: Dye; distance: number }> = [];
      const dyes = this.database.getDyesInternal();

      for (const dye of dyes) {
        try {
          if (dye.category === 'Facewear') {
            continue;
          }

          const distance = ColorConverter.getColorDistance(hex, dye.hex);
          if (distance <= maxDistance) {
            results.push({ dye, distance });
          }
        } catch {
          continue;
        }
      }

      results.sort((a, b) => a.distance - b.distance);

      if (limit) {
        results.splice(limit);
      }

      return results.map((item) => item.dye);
    } catch {
      return [];
    }
  }

  /**
   * Get dyes sorted by brightness
   */
  getDyesSortedByBrightness(ascending: boolean = true): Dye[] {
    this.database.ensureLoaded();

    return [...this.database.getDyesInternal()].sort((a, b) => {
      const brightnessA = a.hsv.v;
      const brightnessB = b.hsv.v;

      return ascending ? brightnessA - brightnessB : brightnessB - brightnessA;
    });
  }

  /**
   * Get dyes sorted by saturation
   */
  getDyesSortedBySaturation(ascending: boolean = true): Dye[] {
    this.database.ensureLoaded();

    return [...this.database.getDyesInternal()].sort((a, b) => {
      const satA = a.hsv.s;
      const satB = b.hsv.s;

      return ascending ? satA - satB : satB - satA;
    });
  }

  /**
   * Get dyes sorted by hue
   */
  getDyesSortedByHue(ascending: boolean = true): Dye[] {
    this.database.ensureLoaded();

    return [...this.database.getDyesInternal()].sort((a, b) => {
      const hueA = a.hsv.h;
      const hueB = b.hsv.h;

      return ascending ? hueA - hueB : hueB - hueA;
    });
  }
}

