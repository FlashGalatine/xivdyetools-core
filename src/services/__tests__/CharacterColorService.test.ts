import { describe, it, expect, beforeAll, vi } from 'vitest';
import { CharacterColorService } from '../CharacterColorService.js';
import type { CharacterColor, SubRace, Gender } from '../../types/index.js';
import type { DyeService } from '../DyeService.js';

describe('CharacterColorService', () => {
  let service: CharacterColorService;

  beforeAll(() => {
    service = new CharacterColorService();
  });

  describe('Shared Colors', () => {
    it('should return eye colors', () => {
      const colors = service.getEyeColors();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
      // All colors should have required properties
      colors.forEach((color) => {
        expect(color).toHaveProperty('index');
        expect(color).toHaveProperty('hex');
        expect(color).toHaveProperty('rgb');
        expect(color.rgb).toHaveProperty('r');
        expect(color.rgb).toHaveProperty('g');
        expect(color.rgb).toHaveProperty('b');
      });
    });

    it('should return highlight colors', () => {
      const colors = service.getHighlightColors();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return lip colors (dark)', () => {
      const colors = service.getLipColorsDark();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return lip colors (light)', () => {
      const colors = service.getLipColorsLight();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return tattoo colors', () => {
      const colors = service.getTattooColors();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return face paint colors (dark)', () => {
      const colors = service.getFacePaintColorsDark();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return face paint colors (light)', () => {
      const colors = service.getFacePaintColorsLight();
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return shared color by index', () => {
      const eyeColor = service.getSharedColorByIndex('eyeColors', 0);
      expect(eyeColor).toBeDefined();
      expect(eyeColor?.index).toBe(0);
    });

    it('should return null for invalid shared color index', () => {
      const color = service.getSharedColorByIndex('eyeColors', 9999);
      expect(color).toBeNull();
    });
  });

  describe('Race-Specific Colors', () => {
    const testSubrace: SubRace = 'Midlander';
    const testGender: Gender = 'Male';

    it('should return hair colors for a specific subrace and gender', () => {
      const colors = service.getHairColors(testSubrace, testGender);
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return skin colors for a specific subrace and gender', () => {
      const colors = service.getSkinColors(testSubrace, testGender);
      expect(colors).toBeDefined();
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('should return race-specific color by index', () => {
      const hairColor = service.getRaceSpecificColorByIndex(
        'hairColors',
        testSubrace,
        testGender,
        0
      );
      expect(hairColor).toBeDefined();
      expect(hairColor?.index).toBe(0);
    });

    it('should return null for invalid race-specific color index', () => {
      const color = service.getRaceSpecificColorByIndex(
        'hairColors',
        testSubrace,
        testGender,
        9999
      );
      expect(color).toBeNull();
    });

    it('should return all available subraces', () => {
      const subraces = service.getAvailableSubraces();
      expect(subraces).toContain('Midlander');
      expect(subraces).toContain('Highlander');
      expect(subraces).toContain('Wildwood');
      expect(subraces).toContain('SeekerOfTheSun');
      expect(subraces).toContain('Raen');
      expect(subraces).toContain('Rava');
    });

    it('should work with all subraces and genders', () => {
      const subraces = service.getAvailableSubraces();
      const genders: Gender[] = ['Male', 'Female'];

      for (const subrace of subraces) {
        for (const gender of genders) {
          const hairColors = service.getHairColors(subrace, gender);
          const skinColors = service.getSkinColors(subrace, gender);
          expect(hairColors.length).toBeGreaterThan(0);
          expect(skinColors.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Color Matching', () => {
    it('should find closest dyes for a color', () => {
      // Create a mock DyeService
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Snow White',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            hsv: { h: 0, s: 0, v: 100 },
            category: 'White Dyes',
          },
          {
            id: 2,
            name: 'Jet Black',
            hex: '#000000',
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 },
            category: 'Black Dyes',
          },
          {
            id: 3,
            name: 'Ruby Red',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Red Dyes',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      const matches = service.findClosestDyes(testColor, mockDyeService, 3);
      expect(matches).toBeDefined();
      expect(matches.length).toBe(3);

      // First match should be Ruby Red (exact match)
      expect(matches[0].dye.name).toBe('Ruby Red');
      expect(matches[0].distance).toBe(0);

      // All matches should be sorted by distance
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].distance).toBeGreaterThanOrEqual(matches[i - 1].distance);
      }
    });

    it('should find the single closest dye', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Snow White',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            hsv: { h: 0, s: 0, v: 100 },
            category: 'White Dyes',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FEFEFE',
        rgb: { r: 254, g: 254, b: 254 },
      };

      const match = service.findClosestDye(testColor, mockDyeService);
      expect(match).toBeDefined();
      expect(match?.dye.name).toBe('Snow White');
    });

    it('should find dyes within a maximum distance', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Perfect Match',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Red Dyes',
          },
          {
            id: 2,
            name: 'Close Match',
            hex: '#FE0000',
            rgb: { r: 254, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Red Dyes',
          },
          {
            id: 3,
            name: 'Far Away',
            hex: '#00FF00',
            rgb: { r: 0, g: 255, b: 0 },
            hsv: { h: 120, s: 100, v: 100 },
            category: 'Green Dyes',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      // Only matches within distance 5 should be returned
      const matches = service.findDyesWithinDistance(testColor, mockDyeService, 5);
      expect(matches.length).toBe(2); // Perfect Match and Close Match
      expect(matches.some((m) => m.dye.name === 'Perfect Match')).toBe(true);
      expect(matches.some((m) => m.dye.name === 'Close Match')).toBe(true);
      expect(matches.some((m) => m.dye.name === 'Far Away')).toBe(false);
    });

    it('should return empty array when no dyes are available', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      const matches = service.findClosestDyes(testColor, mockDyeService, 3);
      expect(matches).toEqual([]);
    });

    it('should skip Facewear dyes in findClosestDyes', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Regular Dye',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Red Dyes',
          },
          {
            id: 2,
            name: 'Facewear Red',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Facewear',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      const matches = service.findClosestDyes(testColor, mockDyeService, 5);
      // Should only return Regular Dye, not Facewear
      expect(matches.length).toBe(1);
      expect(matches[0].dye.name).toBe('Regular Dye');
    });

    it('should skip Facewear dyes in findDyesWithinDistance', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Regular Dye',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Red Dyes',
          },
          {
            id: 2,
            name: 'Facewear Red',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsv: { h: 0, s: 100, v: 100 },
            category: 'Facewear',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      const matches = service.findDyesWithinDistance(testColor, mockDyeService, 10);
      // Should only return Regular Dye, not Facewear
      expect(matches.length).toBe(1);
      expect(matches[0].dye.name).toBe('Regular Dye');
    });

    it('should return null from findClosestDye when no matches', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      const match = service.findClosestDye(testColor, mockDyeService);
      expect(match).toBeNull();
    });

    it('should filter out dyes beyond maxDistance threshold', () => {
      const mockDyeService = {
        getAllDyes: vi.fn().mockReturnValue([
          {
            id: 1,
            name: 'Far Away Blue',
            hex: '#0000FF',
            rgb: { r: 0, g: 0, b: 255 },
            hsv: { h: 240, s: 100, v: 100 },
            category: 'Blue Dyes',
          },
        ]),
      } as unknown as DyeService;

      const testColor: CharacterColor = {
        index: 0,
        hex: '#FF0000',
        rgb: { r: 255, g: 0, b: 0 },
      };

      // Red and Blue have a large distance, so with a small threshold, no matches
      const matches = service.findDyesWithinDistance(testColor, mockDyeService, 1);
      expect(matches.length).toBe(0);
    });
  });

  describe('Metadata', () => {
    it('should return version', () => {
      const version = service.getVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    it('should return grid columns', () => {
      const columns = service.getGridColumns();
      expect(columns).toBeDefined();
      expect(typeof columns).toBe('number');
      expect(columns).toBeGreaterThan(0);
    });
  });
});
