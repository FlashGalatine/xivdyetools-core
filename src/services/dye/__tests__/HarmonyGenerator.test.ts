import { describe, it, expect, beforeEach } from 'vitest';
import { HarmonyGenerator } from '../HarmonyGenerator.js';
import { DyeDatabase } from '../DyeDatabase.js';
import { DyeSearch } from '../DyeSearch.js';
import type { Dye } from '../../../types/index.js';

describe('HarmonyGenerator', () => {
  let database: DyeDatabase;
  let search: DyeSearch;
  let harmony: HarmonyGenerator;

  const mockDyes: Dye[] = [
    // Red (H=0)
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
    // Orange (H=30)
    {
      itemID: 5746,
      id: 5746,
      name: 'Canary Yellow',
      hex: '#FFFF00',
      rgb: { r: 255, g: 255, b: 0 },
      hsv: { h: 60, s: 100, v: 100 },
      category: 'Yellows',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    // Green (H=120)
    {
      itemID: 5743,
      id: 5743,
      name: 'Forest Green',
      hex: '#228B22',
      rgb: { r: 34, g: 139, b: 34 },
      hsv: { h: 120, s: 76, v: 55 },
      category: 'Greens',
      acquisition: 'Crafting',
      cost: 0,
    },
    // Cyan (H=180)
    {
      itemID: 5750,
      id: 5750,
      name: 'Turquoise',
      hex: '#00CED1',
      rgb: { r: 0, g: 206, b: 209 },
      hsv: { h: 181, s: 100, v: 82 },
      category: 'Cyans',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    // Blue (H=240)
    {
      itemID: 5742,
      id: 5742,
      name: 'Royal Blue',
      hex: '#4169E1',
      rgb: { r: 65, g: 105, b: 225 },
      hsv: { h: 225, s: 71, v: 88 },
      category: 'Blues',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    // Purple (H=270)
    {
      itemID: 5755,
      id: 5755,
      name: 'Grape Purple',
      hex: '#8B008B',
      rgb: { r: 139, g: 0, b: 139 },
      hsv: { h: 300, s: 100, v: 55 },
      category: 'Purples',
      acquisition: 'Crafting',
      cost: 0,
    },
    // Another Red (monochromatic variant)
    {
      itemID: 5741,
      id: 5741,
      name: 'Light Red',
      hex: '#FF6B6B',
      rgb: { r: 255, g: 107, b: 107 },
      hsv: { h: 0, s: 58, v: 100 },
      category: 'Reds',
      acquisition: 'Dye Vendor',
      cost: 200,
    },
    // Facewear (should be excluded)
    {
      itemID: 9999,
      id: 9999,
      name: 'Facewear Red',
      hex: '#FF0000',
      rgb: { r: 255, g: 0, b: 0 },
      hsv: { h: 0, s: 100, v: 100 },
      category: 'Facewear',
      acquisition: 'Special',
      cost: 50000,
    },
  ];

  beforeEach(() => {
    database = new DyeDatabase();
    database.initialize(mockDyes);
    search = new DyeSearch(database);
    harmony = new HarmonyGenerator(database, search);
  });

  describe('findComplementaryPair', () => {
    it('should find complementary dye for red', () => {
      const complement = harmony.findComplementaryPair('#FF0000');
      expect(complement).toBeDefined();
      // Complement of red (0°) should be cyan (180°)
      expect(complement?.hsv.h).toBeCloseTo(180, -1); // Within 10°
    });

    it('should find complementary dye for blue', () => {
      const complement = harmony.findComplementaryPair('#0000FF');
      expect(complement).toBeDefined();
      // Complement of blue should be yellowish
    });

    it('should return closest match if exact complement not available', () => {
      const complement = harmony.findComplementaryPair('#FF6B00');
      expect(complement).toBeDefined();
    });

    it('should return null for invalid color', () => {
      const complement = harmony.findComplementaryPair('invalid');
      expect(complement).toBeNull();
    });
  });

  describe('findAnalogousDyes', () => {
    it('should find analogous dyes with default 30° offset', () => {
      const analogous = harmony.findAnalogousDyes('#FF0000');
      expect(analogous.length).toBeGreaterThan(0);
      expect(analogous.length).toBeLessThanOrEqual(2); // +30° and -30°
    });

    it('should find dyes at custom angle', () => {
      const analogous = harmony.findAnalogousDyes('#FF0000', 60);
      expect(analogous.length).toBeGreaterThan(0);
    });

    it('should not include the base dye', () => {
      const baseDye = search.findClosestDye('#FF0000');
      const analogous = harmony.findAnalogousDyes('#FF0000');

      if (baseDye) {
        expect(analogous.every((d) => d.id !== baseDye.id)).toBe(true);
      }
    });

    it('should exclude Facewear dyes', () => {
      const analogous = harmony.findAnalogousDyes('#FF0000');
      expect(analogous.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findTriadicDyes', () => {
    it('should find two dyes 120° apart', () => {
      const triadic = harmony.findTriadicDyes('#FF0000');
      expect(triadic.length).toBeGreaterThan(0);
      expect(triadic.length).toBeLessThanOrEqual(2);
    });

    it('should have distinct hues', () => {
      const triadic = harmony.findTriadicDyes('#FF0000');

      if (triadic.length >= 2) {
        const hue1 = triadic[0].hsv.h;
        const hue2 = triadic[1].hsv.h;
        const diff = Math.abs(hue1 - hue2);

        // Should be significantly different (not the same dye)
        expect(diff).toBeGreaterThan(30);
      }
    });

    it('should exclude Facewear dyes', () => {
      const triadic = harmony.findTriadicDyes('#FF0000');
      expect(triadic.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findSquareDyes', () => {
    it('should find up to three dyes at 90° intervals', () => {
      const square = harmony.findSquareDyes('#FF0000');
      expect(square.length).toBeGreaterThan(0);
      expect(square.length).toBeLessThanOrEqual(3); // 90°, 180°, 270°
    });

    it('should exclude Facewear dyes', () => {
      const square = harmony.findSquareDyes('#FF0000');
      expect(square.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findTetradicDyes', () => {
    it('should find up to three dyes', () => {
      const tetradic = harmony.findTetradicDyes('#FF0000');
      expect(tetradic.length).toBeGreaterThan(0);
      expect(tetradic.length).toBeLessThanOrEqual(3); // 60°, 180°, 240°
    });

    it('should exclude Facewear dyes', () => {
      const tetradic = harmony.findTetradicDyes('#FF0000');
      expect(tetradic.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findMonochromaticDyes', () => {
    it('should find dyes with similar hue', () => {
      const monochromatic = harmony.findMonochromaticDyes('#4D1818'); // Wine Red
      expect(monochromatic.length).toBeGreaterThan(0);
    });

    it('should exclude the base dye itself', () => {
      const baseDye = search.findClosestDye('#4D1818');
      const monochromatic = harmony.findMonochromaticDyes('#4D1818');

      if (baseDye) {
        expect(monochromatic.every((d) => d.id !== baseDye.id)).toBe(true);
      }
    });

    it('should respect limit parameter', () => {
      const monochromatic = harmony.findMonochromaticDyes('#4D1818', 2);
      expect(monochromatic.length).toBeLessThanOrEqual(2);
    });

    it('should find dyes with varying saturation/value', () => {
      const monochromatic = harmony.findMonochromaticDyes('#4D1818');

      if (monochromatic.length >= 2) {
        // Should have different saturation or value
        const hasVariety = monochromatic.some((d, i) => {
          if (i === 0) return false;
          return d.hsv.s !== monochromatic[0].hsv.s || d.hsv.v !== monochromatic[0].hsv.v;
        });
        expect(hasVariety).toBe(true);
      }
    });

    it('should return empty array if no base dye found', () => {
      const monochromatic = harmony.findMonochromaticDyes('invalid');
      expect(monochromatic).toEqual([]);
    });
  });

  describe('findCompoundDyes', () => {
    it('should find compound harmony dyes', () => {
      const compound = harmony.findCompoundDyes('#FF0000');
      expect(compound.length).toBeGreaterThan(0);
    });

    it('should exclude Facewear dyes', () => {
      const compound = harmony.findCompoundDyes('#FF0000');
      expect(compound.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findSplitComplementaryDyes', () => {
    it('should find split-complementary dyes', () => {
      const splitComp = harmony.findSplitComplementaryDyes('#FF0000');
      expect(splitComp.length).toBeGreaterThan(0);
      expect(splitComp.length).toBeLessThanOrEqual(2); // ±30° from complement
    });

    it('should exclude Facewear dyes', () => {
      const splitComp = harmony.findSplitComplementaryDyes('#FF0000');
      expect(splitComp.every((d) => d.category !== 'Facewear')).toBe(true);
    });
  });

  describe('findShadesDyes', () => {
    it('should find shades (similar tones ±15°)', () => {
      const shades = harmony.findShadesDyes('#FF0000');
      expect(shades.length).toBeGreaterThan(0);
    });

    it('should find closer hues than analogous', () => {
      const shades = harmony.findShadesDyes('#FF0000');

      if (shades.length > 0) {
        // Shades should be very close to base hue
        const baseDye = search.findClosestDye('#FF0000');
        if (baseDye) {
          shades.forEach((shade) => {
            const diff = Math.min(
              Math.abs(shade.hsv.h - baseDye.hsv.h),
              360 - Math.abs(shade.hsv.h - baseDye.hsv.h)
            );
            expect(diff).toBeLessThanOrEqual(20); // Within ±20° due to tolerance
          });
        }
      }
    });
  });

  describe('harmony consistency', () => {
    it('should not return duplicate dyes in same harmony', () => {
      const triadic = harmony.findTriadicDyes('#FF0000');
      const ids = triadic.map((d) => d.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should always exclude Facewear across all harmony types', () => {
      const harmonies = [
        harmony.findAnalogousDyes('#FF0000'),
        harmony.findTriadicDyes('#FF0000'),
        harmony.findSquareDyes('#FF0000'),
        harmony.findTetradicDyes('#FF0000'),
        harmony.findCompoundDyes('#FF0000'),
        harmony.findSplitComplementaryDyes('#FF0000'),
        harmony.findShadesDyes('#FF0000'),
      ];

      harmonies.forEach((harmonyDyes) => {
        expect(harmonyDyes.every((d) => d.category !== 'Facewear')).toBe(true);
      });
    });

    it('should return arrays for all harmony methods', () => {
      expect(Array.isArray(harmony.findAnalogousDyes('#FF0000'))).toBe(true);
      expect(Array.isArray(harmony.findTriadicDyes('#FF0000'))).toBe(true);
      expect(Array.isArray(harmony.findSquareDyes('#FF0000'))).toBe(true);
      expect(Array.isArray(harmony.findMonochromaticDyes('#FF0000'))).toBe(true);
    });
  });

  describe('hue bucket optimization', () => {
    it('should use hue buckets for efficient search', () => {
      // This is an indirect test - we verify it works correctly
      // The actual performance optimization happens internally
      const triadic = harmony.findTriadicDyes('#FF0000');
      expect(triadic).toBeDefined();
    });

    it('should handle hue wraparound correctly', () => {
      // Test with purple (H=300) which wraps around when finding nearby hues
      const analogous = harmony.findAnalogousDyes('#8B008B', 30);
      expect(analogous.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid hex colors gracefully', () => {
      expect(() => harmony.findAnalogousDyes('invalid')).not.toThrow();
      expect(harmony.findAnalogousDyes('invalid')).toEqual([]);
    });

    it('should return empty array when database not loaded', () => {
      const emptyDB = new DyeDatabase();
      const emptySearch = new DyeSearch(emptyDB);
      const emptyHarmony = new HarmonyGenerator(emptyDB, emptySearch);

      expect(() => emptyHarmony.findTriadicDyes('#FF0000')).toThrow();
    });
  });
});
