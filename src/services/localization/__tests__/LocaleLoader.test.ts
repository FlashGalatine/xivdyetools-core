import { describe, it, expect, beforeEach } from 'vitest';
import { LocaleLoader } from '../LocaleLoader.js';
import type { LocaleCode } from '../../../types/index.js';
import { AppError, ErrorCode } from '../../../types/index.js';

describe('LocaleLoader', () => {
  let loader: LocaleLoader;

  beforeEach(() => {
    loader = new LocaleLoader();
  });

  describe('loadLocale', () => {
    it('should load English locale successfully', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData).toBeDefined();
      expect(localeData.locale).toBe('en');
      expect(localeData.meta).toBeDefined();
      expect(localeData.labels).toBeDefined();
      expect(localeData.dyeNames).toBeDefined();
      expect(localeData.categories).toBeDefined();
      expect(localeData.acquisitions).toBeDefined();
      expect(localeData.metallicDyeIds).toBeInstanceOf(Array);
      expect(localeData.harmonyTypes).toBeDefined();
      expect(localeData.visionTypes).toBeDefined();
    });

    it('should load Japanese locale successfully', async () => {
      const localeData = await loader.loadLocale('ja');

      expect(localeData).toBeDefined();
      expect(localeData.locale).toBe('ja');
      expect(localeData.meta).toBeDefined();
      expect(localeData.labels).toBeDefined();
    });

    it('should load German locale successfully', async () => {
      const localeData = await loader.loadLocale('de');

      expect(localeData).toBeDefined();
      expect(localeData.locale).toBe('de');
      expect(localeData.meta).toBeDefined();
    });

    it('should load French locale successfully', async () => {
      const localeData = await loader.loadLocale('fr');

      expect(localeData).toBeDefined();
      expect(localeData.locale).toBe('fr');
      expect(localeData.meta).toBeDefined();
    });

    it('should throw AppError for non-existent locale', async () => {
      await expect(loader.loadLocale('invalid' as LocaleCode)).rejects.toThrow(AppError);
    });

    it('should throw AppError with correct error code for invalid locale', async () => {
      try {
        await loader.loadLocale('xx' as LocaleCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        if (error instanceof AppError) {
          expect(error.code).toBe(ErrorCode.LOCALE_LOAD_FAILED);
        }
      }
    });

    it('should have valid metadata in English locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.meta.version).toBeDefined();
      expect(localeData.meta.generated).toBeDefined();
      expect(localeData.meta.dyeCount).toBeGreaterThan(0);
    });

    it('should have valid labels in English locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.labels.dye).toBe('Dye');
      expect(localeData.labels.dark).toBe('Dark');
      expect(localeData.labels.metallic).toBe('Metallic');
    });

    it('should have dye names in loaded locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.dyeNames['5729']).toBe('Snow White');
      expect(localeData.dyeNames['5740']).toBe('Wine Red');
    });

    it('should have categories in loaded locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.categories['Reds']).toBe('Reds');
      expect(localeData.categories['Blues']).toBe('Blues');
      expect(localeData.categories['Neutral']).toBe('Neutral');
    });

    it('should have acquisitions in loaded locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.acquisitions['Dye Vendor']).toBe('Dye Vendor');
      expect(localeData.acquisitions['Crafting']).toBe('Crafting');
    });

    it('should have metallic dye IDs array', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.metallicDyeIds).toBeInstanceOf(Array);
      expect(localeData.metallicDyeIds.length).toBeGreaterThan(0);
      expect(localeData.metallicDyeIds).toContain(13116); // Metallic Silver
      expect(localeData.metallicDyeIds).toContain(13117); // Metallic Gold
    });

    it('should have harmony types in loaded locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.harmonyTypes.complementary).toBe('Complementary');
      expect(localeData.harmonyTypes.triadic).toBe('Triadic');
      expect(localeData.harmonyTypes.analogous).toBe('Analogous');
    });

    it('should have vision types in loaded locale', async () => {
      const localeData = await loader.loadLocale('en');

      expect(localeData.visionTypes.normal).toBe('Normal Vision');
      expect(localeData.visionTypes.deuteranopia).toContain('Deuteranopia');
      expect(localeData.visionTypes.protanopia).toContain('Protanopia');
      expect(localeData.visionTypes.tritanopia).toContain('Tritanopia');
    });
  });

  describe('data validation', () => {
    it('should validate locale data structure', async () => {
      const localeData = await loader.loadLocale('en');

      // All required fields must be present
      expect(localeData).toHaveProperty('locale');
      expect(localeData).toHaveProperty('meta');
      expect(localeData).toHaveProperty('labels');
      expect(localeData).toHaveProperty('dyeNames');
      expect(localeData).toHaveProperty('categories');
      expect(localeData).toHaveProperty('acquisitions');
      expect(localeData).toHaveProperty('metallicDyeIds');
      expect(localeData).toHaveProperty('harmonyTypes');
      expect(localeData).toHaveProperty('visionTypes');
    });

    it('should have consistent data types across all locales', async () => {
      const enData = await loader.loadLocale('en');
      const jaData = await loader.loadLocale('ja');
      const deData = await loader.loadLocale('de');
      const frData = await loader.loadLocale('fr');

      // Check that all locales have the same structure
      for (const data of [enData, jaData, deData, frData]) {
        expect(typeof data.locale).toBe('string');
        expect(typeof data.meta).toBe('object');
        expect(typeof data.labels).toBe('object');
        expect(typeof data.dyeNames).toBe('object');
        expect(Array.isArray(data.metallicDyeIds)).toBe(true);
      }
    });
  });
});
