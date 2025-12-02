/**
 * Dye Database
 * Per R-4: Focused class for dye database management
 * Handles loading, indexing, and data access
 */

import type { Dye } from '../../types/index.js';
import { ErrorCode, AppError } from '../../types/index.js';
import { KDTree, type Point3D } from '../../utils/kd-tree.js';

/**
 * Dye database manager
 * Per R-4: Single Responsibility - database management only
 */
export class DyeDatabase {
  private dyes: Dye[] = [];
  private dyesByIdMap: Map<number, Dye> = new Map();
  // Per P-2: Hue-indexed map for fast harmony lookups (70-90% speedup)
  // Maps hue bucket (0-35 for 10° buckets) to array of dyes in that range
  private dyesByHueBucket: Map<number, Dye[]> = new Map();
  // Per P-7: k-d tree for fast nearest neighbor search in RGB space
  private kdTree: KDTree | null = null;
  private isLoaded: boolean = false;
  private lastLoaded: number = 0;

  // Per P-2: Hue bucket size (10 degrees per bucket for 36 buckets total)
  private static readonly HUE_BUCKET_SIZE = 10;
  private static readonly HUE_BUCKET_COUNT = 36; // 360 / 10

  /**
   * Dangerous prototype pollution keys to filter out
   * Per Security: Prevents prototype pollution attacks from untrusted data
   */
  private static readonly DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  /**
   * Create a safe copy of an object, filtering out prototype pollution keys
   * Per Security: Deep clones object while preventing prototype pollution
   */
  private safeClone(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(obj)) {
      if (DyeDatabase.DANGEROUS_KEYS.has(key)) {
        continue; // Skip dangerous keys
      }
      const value = obj[key];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.safeClone(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Initialize dye database from data
   * Per Security: Includes prototype pollution protection for untrusted data sources
   */
  initialize(dyeData: unknown): void {
    try {
      // Support both array and object formats
      const loadedDyes = Array.isArray(dyeData) ? dyeData : Object.values(dyeData as object);

      if (!Array.isArray(loadedDyes) || loadedDyes.length === 0) {
        throw new Error('Invalid dye database format');
      }

      // Normalize dyes: map itemID to id, price to cost, with prototype pollution protection
      this.dyes = loadedDyes.map((dye: unknown) => {
        // Per Security: Create a safe clone to prevent prototype pollution
        const normalizedDye = this.safeClone(dye as Record<string, unknown>);

        // If the dye has itemID but no id, use itemID as the id
        if (normalizedDye.itemID && !normalizedDye.id) {
          normalizedDye.id = normalizedDye.itemID;
        }

        // Per Bug Fix: Map 'price' field to 'cost' for Dye interface compatibility
        // JSON data uses 'price' but Dye interface expects 'cost'
        if (normalizedDye.price !== undefined && normalizedDye.cost === undefined) {
          normalizedDye.cost = normalizedDye.price ?? 0;
        }
        // Ensure cost is always a number (handle null values in JSON)
        if (normalizedDye.cost === null || normalizedDye.cost === undefined) {
          normalizedDye.cost = 0;
        }

        return normalizedDye as unknown as Dye;
      });

      // Build ID map for fast lookups
      this.dyesByIdMap.clear();
      // Per P-2: Build hue-indexed map for harmony lookups
      this.dyesByHueBucket.clear();

      // Per P-7: Build k-d tree for RGB color space
      const kdTreePoints: Point3D[] = [];

      for (const dye of this.dyes) {
        this.dyesByIdMap.set(dye.id, dye);
        if (dye.itemID) {
          this.dyesByIdMap.set(dye.itemID, dye);
        }

        // Per P-2: Index by hue bucket (10° buckets)
        const hueBucket = this.getHueBucket(dye.hsv.h);
        if (!this.dyesByHueBucket.has(hueBucket)) {
          this.dyesByHueBucket.set(hueBucket, []);
        }
        this.dyesByHueBucket.get(hueBucket)!.push(dye);

        // Per P-7: Add to k-d tree (exclude Facewear dyes from tree)
        if (dye.category !== 'Facewear') {
          kdTreePoints.push({
            x: dye.rgb.r,
            y: dye.rgb.g,
            z: dye.rgb.b,
            data: dye,
          });
        }
      }

      // Per P-7: Build k-d tree
      this.kdTree = new KDTree(kdTreePoints);

      this.isLoaded = true;
      this.lastLoaded = Date.now();

      console.info(`✅ Dye database loaded: ${this.dyes.length} dyes`);
    } catch (error) {
      this.isLoaded = false;
      throw new AppError(
        ErrorCode.DATABASE_LOAD_FAILED,
        `Failed to load dye database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'critical'
      );
    }
  }

  /**
   * Ensure database is loaded, throw error if not
   */
  ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new AppError(ErrorCode.DATABASE_LOAD_FAILED, 'Dye database is not loaded', 'critical');
    }
  }

  /**
   * Get all dyes (defensive copy)
   */
  getAllDyes(): Dye[] {
    this.ensureLoaded();
    return [...this.dyes];
  }

  /**
   * Get dye by ID
   */
  getDyeById(id: number): Dye | null {
    this.ensureLoaded();
    return this.dyesByIdMap.get(id) || null;
  }

  /**
   * Get multiple dyes by IDs
   */
  getDyesByIds(ids: number[]): Dye[] {
    this.ensureLoaded();
    return ids.map((id) => this.dyesByIdMap.get(id)).filter((dye): dye is Dye => dye !== undefined);
  }

  /**
   * Check if database is loaded
   */
  isLoadedStatus(): boolean {
    return this.isLoaded;
  }

  /**
   * Get timestamp of last load
   */
  getLastLoadedTime(): number {
    return this.lastLoaded;
  }

  /**
   * Get total dye count
   */
  getDyeCount(): number {
    this.ensureLoaded();
    return this.dyes.length;
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    this.ensureLoaded();
    const categories = new Set<string>();

    for (const dye of this.dyes) {
      categories.add(dye.category);
    }

    return Array.from(categories).sort();
  }

  /**
   * Get k-d tree (for search operations)
   */
  getKdTree(): KDTree | null {
    return this.kdTree;
  }

  /**
   * Get hue bucket index for a given hue (0-35 for 10° buckets)
   * Per P-2: Maps hue to bucket for indexed lookups
   */
  getHueBucket(hue: number): number {
    // Normalize hue to 0-360 range
    const normalizedHue = ((hue % 360) + 360) % 360;
    return Math.floor(normalizedHue / DyeDatabase.HUE_BUCKET_SIZE);
  }

  /**
   * Get hue buckets to search for a target hue with tolerance
   * Per P-2: Returns bucket indices that could contain matching dyes
   */
  getHueBucketsToSearch(targetHue: number, tolerance: number): number[] {
    const targetBucket = this.getHueBucket(targetHue);
    const bucketsToSearch = new Set<number>();

    // Add target bucket
    bucketsToSearch.add(targetBucket);

    // Add adjacent buckets based on tolerance
    // Each bucket is 10°, so tolerance/10 buckets on each side
    const bucketRange = Math.ceil(tolerance / DyeDatabase.HUE_BUCKET_SIZE);
    for (let i = -bucketRange; i <= bucketRange; i++) {
      const bucket =
        (targetBucket + i + DyeDatabase.HUE_BUCKET_COUNT) % DyeDatabase.HUE_BUCKET_COUNT;
      bucketsToSearch.add(bucket);
    }

    return Array.from(bucketsToSearch);
  }

  /**
   * Get dyes by hue bucket
   */
  getDyesByHueBucket(bucket: number): Dye[] {
    this.ensureLoaded();
    return this.dyesByHueBucket.get(bucket) || [];
  }

  /**
   * Get all dyes (internal access, no defensive copy)
   */
  getDyesInternal(): Dye[] {
    this.ensureLoaded();
    return this.dyes;
  }
}
