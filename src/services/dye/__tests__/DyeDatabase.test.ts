import { describe, it, expect, beforeEach } from 'vitest';
import { DyeDatabase } from '../DyeDatabase.js';
import type { Dye } from '../../../types/index.js';
import { AppError, ErrorCode } from '../../../types/index.js';

describe('DyeDatabase', () => {
  let database: DyeDatabase;

  // Mock dye data for testing
  const mockDyes: Dye[] = [
    {
      itemID: 5729,
      id: 5729,
      name: 'Snow White',
      hex: '#FFFFFF',
      rgb: { r: 255, g: 255, b: 255 },
      hsv: { h: 0, s: 0, v: 100 },
      category: 'Neutral',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    {
      itemID: 5740,
      id: 5740,
      name: 'Wine Red',
      hex: '#4D1818',
      rgb: { r: 77, g: 24, b: 24 },
      hsv: { h: 0, s: 69, v: 30 },
      category: 'Reds',
      acquisition: 'Crafting',
      cost: 0,
    },
    {
      itemID: 13116,
      id: 13116,
      name: 'Metallic Silver',
      hex: '#8C8C8C',
      rgb: { r: 140, g: 140, b: 140 },
      hsv: { h: 0, s: 0, v: 55 },
      category: 'Neutral',
      acquisition: 'Ixali Vendor',
      cost: 10000,
    },
    {
      itemID: 6001,
      id: 6001,
      name: 'Sky Blue',
      hex: '#87CEEB',
      rgb: { r: 135, g: 206, b: 235 },
      hsv: { h: 197, s: 43, v: 92 },
      category: 'Blues',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    {
      itemID: 6002,
      id: 6002,
      name: 'Forest Green',
      hex: '#228B22',
      rgb: { r: 34, g: 139, b: 34 },
      hsv: { h: 120, s: 76, v: 55 },
      category: 'Greens',
      acquisition: 'Crafting',
      cost: 0,
    },
  ];

  beforeEach(() => {
    database = new DyeDatabase();
  });

  describe('initialization', () => {
    it('should initialize with array of dyes', () => {
      database.initialize(mockDyes);

      expect(database.isLoadedStatus()).toBe(true);
      expect(database.getDyeCount()).toBe(5);
    });

    it('should initialize with object of dyes', () => {
      const dyeObject = Object.fromEntries(mockDyes.map((d) => [d.id, d]));
      database.initialize(dyeObject);

      expect(database.isLoadedStatus()).toBe(true);
      expect(database.getDyeCount()).toBe(5);
    });

    it('should throw error for empty array', () => {
      expect(() => database.initialize([])).toThrow(AppError);
      expect(() => database.initialize([])).toThrow('Invalid dye database format');
    });

    it('should throw error for invalid format', () => {
      expect(() => database.initialize(null)).toThrow(AppError);
      expect(() => database.initialize('invalid')).toThrow(AppError);
    });

    it('should normalize dyes with itemID but no id', () => {
      const dyeWithoutId = {
        itemID: 9999,
        name: 'Test Dye',
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
        hsv: { h: 0, s: 100, v: 100 },
        category: 'Reds',
        acquisition: 'Test',
        cost: 0,
      };

      database.initialize([dyeWithoutId]);

      const dye = database.getDyeById(9999);
      expect(dye).toBeDefined();
      expect(dye?.id).toBe(9999);
    });

    it('should record last loaded time', () => {
      const before = Date.now();
      database.initialize(mockDyes);
      const after = Date.now();

      const lastLoaded = database.getLastLoadedTime();
      expect(lastLoaded).toBeGreaterThanOrEqual(before);
      expect(lastLoaded).toBeLessThanOrEqual(after);
    });

    it('should not be loaded before initialization', () => {
      expect(database.isLoadedStatus()).toBe(false);
      expect(database.getLastLoadedTime()).toBe(0);
    });
  });

  describe('ensureLoaded', () => {
    it('should not throw when database is loaded', () => {
      database.initialize(mockDyes);
      expect(() => database.ensureLoaded()).not.toThrow();
    });

    it('should throw when database is not loaded', () => {
      expect(() => database.ensureLoaded()).toThrow(AppError);
      expect(() => database.ensureLoaded()).toThrow('Dye database is not loaded');
    });
  });

  describe('getAllDyes', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should return all dyes', () => {
      const dyes = database.getAllDyes();
      expect(dyes).toHaveLength(5);
    });

    it('should return defensive copy', () => {
      const dyes1 = database.getAllDyes();
      const dyes2 = database.getAllDyes();

      expect(dyes1).not.toBe(dyes2); // Different array instances
      expect(dyes1).toEqual(dyes2); // Same contents
    });

    it('should throw if not loaded', () => {
      const emptyDB = new DyeDatabase();
      expect(() => emptyDB.getAllDyes()).toThrow(AppError);
    });
  });

  describe('getDyeById', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should find dye by id', () => {
      const dye = database.getDyeById(5729);
      expect(dye).toBeDefined();
      expect(dye?.name).toBe('Snow White');
    });

    it('should find dye by itemID', () => {
      const dye = database.getDyeById(13116);
      expect(dye).toBeDefined();
      expect(dye?.name).toBe('Metallic Silver');
    });

    it('should return null for non-existent ID', () => {
      const dye = database.getDyeById(99999);
      expect(dye).toBeNull();
    });

    it('should throw if not loaded', () => {
      const emptyDB = new DyeDatabase();
      expect(() => emptyDB.getDyeById(5729)).toThrow(AppError);
    });
  });

  describe('getDyesByIds', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should retrieve multiple dyes by IDs', () => {
      const dyes = database.getDyesByIds([5729, 5740, 13116]);
      expect(dyes).toHaveLength(3);
      expect(dyes[0].name).toBe('Snow White');
      expect(dyes[1].name).toBe('Wine Red');
      expect(dyes[2].name).toBe('Metallic Silver');
    });

    it('should skip non-existent IDs', () => {
      const dyes = database.getDyesByIds([5729, 99999, 5740]);
      expect(dyes).toHaveLength(2);
    });

    it('should return empty array for all non-existent IDs', () => {
      const dyes = database.getDyesByIds([99999, 88888]);
      expect(dyes).toHaveLength(0);
    });

    it('should handle empty ID array', () => {
      const dyes = database.getDyesByIds([]);
      expect(dyes).toHaveLength(0);
    });
  });

  describe('getDyeCount', () => {
    it('should return correct count', () => {
      database.initialize(mockDyes);
      expect(database.getDyeCount()).toBe(5);
    });

    it('should throw if not loaded', () => {
      expect(() => database.getDyeCount()).toThrow(AppError);
    });
  });

  describe('getCategories', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should return all unique categories', () => {
      const categories = database.getCategories();
      expect(categories).toContain('Neutral');
      expect(categories).toContain('Reds');
      expect(categories).toContain('Blues');
      expect(categories).toContain('Greens');
    });

    it('should return sorted categories', () => {
      const categories = database.getCategories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('should not have duplicates', () => {
      const categories = database.getCategories();
      const unique = [...new Set(categories)];
      expect(categories).toEqual(unique);
    });
  });

  describe('hue bucket indexing', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should calculate correct hue bucket', () => {
      expect(database.getHueBucket(0)).toBe(0);
      expect(database.getHueBucket(10)).toBe(1);
      expect(database.getHueBucket(120)).toBe(12);
      expect(database.getHueBucket(197)).toBe(19);
      expect(database.getHueBucket(350)).toBe(35);
    });

    it('should normalize negative hues', () => {
      expect(database.getHueBucket(-10)).toBe(35); // -10 + 360 = 350, 350/10 = 35
    });

    it('should normalize hues > 360', () => {
      expect(database.getHueBucket(370)).toBe(1); // 370 % 360 = 10, 10/10 = 1
    });

    it('should get hue buckets to search with tolerance', () => {
      const buckets = database.getHueBucketsToSearch(120, 15);
      expect(buckets).toContain(12); // Target bucket
      expect(buckets).toContain(11); // -15° bucket
      expect(buckets).toContain(13); // +15° bucket
    });

    it('should wrap around hue circle', () => {
      const buckets = database.getHueBucketsToSearch(0, 15);
      expect(buckets).toContain(0);
      expect(buckets).toContain(35); // Wraps to 350°
      expect(buckets).toContain(1);
    });

    it('should get dyes by hue bucket', () => {
      const redDyes = database.getDyesByHueBucket(0); // H=0
      expect(redDyes.length).toBeGreaterThan(0);
      expect(redDyes.some((d) => d.name === 'Snow White')).toBe(true);
    });
  });

  describe('k-d tree', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should have k-d tree after initialization', () => {
      const kdTree = database.getKdTree();
      expect(kdTree).not.toBeNull();
    });

    it('should exclude Facewear from k-d tree', () => {
      const facewearDye: Dye = {
        itemID: 9999,
        id: 9999,
        name: 'Facewear Test',
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
        hsv: { h: 0, s: 100, v: 100 },
        category: 'Facewear',
        acquisition: 'Test',
        cost: 0,
      };

      database.initialize([...mockDyes, facewearDye]);
      const kdTree = database.getKdTree();

      expect(kdTree).not.toBeNull();
      // K-d tree should not contain facewear dyes
    });
  });

  describe('error handling', () => {
    it('should throw AppError with DATABASE_LOAD_FAILED code', () => {
      try {
        database.initialize([]);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ErrorCode.DATABASE_LOAD_FAILED);
        expect((error as AppError).severity).toBe('critical');
      }
    });

    it('should throw AppError when accessing unloaded database', () => {
      try {
        database.getAllDyes();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ErrorCode.DATABASE_LOAD_FAILED);
      }
    });
  });

  describe('internal access', () => {
    beforeEach(() => {
      database.initialize(mockDyes);
    });

    it('should get internal dyes without defensive copy', () => {
      const dyes1 = database.getDyesInternal();
      const dyes2 = database.getDyesInternal();

      expect(dyes1).toBe(dyes2); // Same array instance
    });
  });
});
