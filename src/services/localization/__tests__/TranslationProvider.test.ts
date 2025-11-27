import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationProvider } from '../TranslationProvider.js';
import { LocaleRegistry } from '../LocaleRegistry.js';
import type {
  LocaleData,
  LocaleCode,
  TranslationKey,
  HarmonyTypeKey,
  VisionType,
} from '../../../types/index.js';

describe('TranslationProvider', () => {
  let registry: LocaleRegistry;
  let provider: TranslationProvider;

  // Mock locale data
  const mockEnglishData: LocaleData = {
    locale: 'en' as LocaleCode,
    meta: {
      version: '1.0.0',
      generated: '2025-01-01T00:00:00.000Z',
      dyeCount: 125,
    },
    labels: {
      dye: 'Dye',
      dark: 'Dark',
      metallic: 'Metallic',
      pastel: 'Pastel',
      cosmic: 'Cosmic',
      cosmicExploration: 'Cosmic Exploration',
      cosmicFortunes: 'Cosmic Fortunes',
    },
    dyeNames: {
      '5729': 'Snow White',
      '5740': 'Wine Red',
      '13116': 'Metallic Silver',
    },
    categories: {
      Reds: 'Reds',
      Blues: 'Blues',
      Neutral: 'Neutral',
      Greens: 'Greens',
    },
    acquisitions: {
      'Dye Vendor': 'Dye Vendor',
      Crafting: 'Crafting',
      'Ixali Vendor': 'Ixali Vendor',
    },
    metallicDyeIds: [13116, 13117],
    harmonyTypes: {
      complementary: 'Complementary',
      analogous: 'Analogous',
      triadic: 'Triadic',
      splitComplementary: 'Split-Complementary',
      tetradic: 'Tetradic',
      square: 'Square',
      monochromatic: 'Monochromatic',
      compound: 'Compound',
      shades: 'Shades',
    },
    visionTypes: {
      normal: 'Normal Vision',
      deuteranopia: 'Deuteranopia (Red-Green Colorblindness)',
      protanopia: 'Protanopia (Red-Green Colorblindness)',
      tritanopia: 'Tritanopia (Blue-Yellow Colorblindness)',
      achromatopsia: 'Achromatopsia (Total Colorblindness)',
    },
  };

  const mockJapaneseData: LocaleData = {
    ...mockEnglishData,
    locale: 'ja' as LocaleCode,
    labels: {
      dye: 'カララント',
      dark: '濃',
      metallic: 'メタリック',
      pastel: 'パステル',
      cosmic: 'コスミック',
      cosmicExploration: 'コズミック・エクスプロレーション',
      cosmicFortunes: 'コズミック・フォーチュン',
    },
    dyeNames: {
      '5729': 'スノウホワイト',
      '5740': 'ワインレッド',
      '13116': 'メタリックシルバー',
    },
    categories: {
      Reds: '赤系',
      Blues: '青系',
      Neutral: '無彩色',
      Greens: '緑系',
    },
    acquisitions: {
      'Dye Vendor': '染料販売業者',
      Crafting: 'クラフト',
      'Ixali Vendor': 'イクサル族',
    },
    harmonyTypes: {
      ...mockEnglishData.harmonyTypes,
      complementary: '補色',
      triadic: '三色配色',
    },
    visionTypes: {
      ...mockEnglishData.visionTypes,
      normal: '正常な視覚',
      deuteranopia: '2型色覚（赤緑色盲）',
    },
  };

  beforeEach(() => {
    registry = new LocaleRegistry();
    provider = new TranslationProvider(registry);
  });

  describe('getLabel', () => {
    it('should return label from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const label = provider.getLabel('dye' as TranslationKey, 'en');
      expect(label).toBe('Dye');
    });

    it('should return Japanese label when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const label = provider.getLabel('dye' as TranslationKey, 'ja');
      expect(label).toBe('カララント');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const label = provider.getLabel('dye' as TranslationKey, 'de');
      expect(label).toBe('Dye');
    });

    it('should format key when neither requested nor English locale available', () => {
      const label = provider.getLabel('cosmicExploration' as TranslationKey, 'de');
      expect(label).toBe('Cosmic Exploration');
    });

    it('should handle all label keys', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getLabel('dye' as TranslationKey, 'en')).toBe('Dye');
      expect(provider.getLabel('dark' as TranslationKey, 'en')).toBe('Dark');
      expect(provider.getLabel('metallic' as TranslationKey, 'en')).toBe('Metallic');
      expect(provider.getLabel('pastel' as TranslationKey, 'en')).toBe('Pastel');
    });
  });

  describe('getDyeName', () => {
    it('should return dye name from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const name = provider.getDyeName(5729, 'en');
      expect(name).toBe('Snow White');
    });

    it('should return Japanese dye name when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const name = provider.getDyeName(5729, 'ja');
      expect(name).toBe('スノウホワイト');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const name = provider.getDyeName(5729, 'de');
      expect(name).toBe('Snow White');
    });

    it('should return null for non-existent dye ID', () => {
      registry.registerLocale(mockEnglishData);

      const name = provider.getDyeName(99999, 'en');
      expect(name).toBeNull();
    });

    it('should handle multiple dye IDs correctly', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getDyeName(5729, 'en')).toBe('Snow White');
      expect(provider.getDyeName(5740, 'en')).toBe('Wine Red');
      expect(provider.getDyeName(13116, 'en')).toBe('Metallic Silver');
    });
  });

  describe('getCategory', () => {
    it('should return category from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const category = provider.getCategory('Reds', 'en');
      expect(category).toBe('Reds');
    });

    it('should return Japanese category when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const category = provider.getCategory('Reds', 'ja');
      expect(category).toBe('赤系');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const category = provider.getCategory('Reds', 'de');
      expect(category).toBe('Reds');
    });

    it('should return original category when not found in any locale', () => {
      const category = provider.getCategory('Unknown', 'en');
      expect(category).toBe('Unknown');
    });

    it('should handle all standard categories', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getCategory('Reds', 'en')).toBe('Reds');
      expect(provider.getCategory('Blues', 'en')).toBe('Blues');
      expect(provider.getCategory('Greens', 'en')).toBe('Greens');
      expect(provider.getCategory('Neutral', 'en')).toBe('Neutral');
    });
  });

  describe('getAcquisition', () => {
    it('should return acquisition method from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const acquisition = provider.getAcquisition('Dye Vendor', 'en');
      expect(acquisition).toBe('Dye Vendor');
    });

    it('should return Japanese acquisition when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const acquisition = provider.getAcquisition('Dye Vendor', 'ja');
      expect(acquisition).toBe('染料販売業者');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const acquisition = provider.getAcquisition('Crafting', 'de');
      expect(acquisition).toBe('Crafting');
    });

    it('should return original acquisition when not found', () => {
      const acquisition = provider.getAcquisition('Unknown', 'en');
      expect(acquisition).toBe('Unknown');
    });

    it('should handle various acquisition methods', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getAcquisition('Dye Vendor', 'en')).toBe('Dye Vendor');
      expect(provider.getAcquisition('Crafting', 'en')).toBe('Crafting');
      expect(provider.getAcquisition('Ixali Vendor', 'en')).toBe('Ixali Vendor');
    });
  });

  describe('getMetallicDyeIds', () => {
    it('should return metallic dye IDs from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const ids = provider.getMetallicDyeIds('en');
      expect(ids).toEqual([13116, 13117]);
    });

    it('should return same IDs regardless of locale', () => {
      registry.registerLocale(mockEnglishData);
      registry.registerLocale(mockJapaneseData);

      const enIds = provider.getMetallicDyeIds('en');
      const jaIds = provider.getMetallicDyeIds('ja');

      expect(enIds).toEqual(jaIds);
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const ids = provider.getMetallicDyeIds('de');
      expect(ids).toEqual([13116, 13117]);
    });

    it('should return empty array when no locale available', () => {
      const ids = provider.getMetallicDyeIds('en');
      expect(ids).toEqual([]);
    });

    it('should return array of numbers', () => {
      registry.registerLocale(mockEnglishData);

      const ids = provider.getMetallicDyeIds('en');
      expect(Array.isArray(ids)).toBe(true);
      ids.forEach((id) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  describe('getHarmonyType', () => {
    it('should return harmony type from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const harmony = provider.getHarmonyType('complementary' as HarmonyTypeKey, 'en');
      expect(harmony).toBe('Complementary');
    });

    it('should return Japanese harmony type when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const harmony = provider.getHarmonyType('complementary' as HarmonyTypeKey, 'ja');
      expect(harmony).toBe('補色');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const harmony = provider.getHarmonyType('triadic' as HarmonyTypeKey, 'de');
      expect(harmony).toBe('Triadic');
    });

    it('should format key when not found in any locale', () => {
      // Using 'fr' (valid LocaleCode) with no registry to test fallback to formatting
      const harmony = provider.getHarmonyType('splitComplementary' as HarmonyTypeKey, 'fr');
      expect(harmony).toBe('Split Complementary');
    });

    it('should handle all harmony types', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getHarmonyType('complementary' as HarmonyTypeKey, 'en')).toBe(
        'Complementary'
      );
      expect(provider.getHarmonyType('analogous' as HarmonyTypeKey, 'en')).toBe('Analogous');
      expect(provider.getHarmonyType('triadic' as HarmonyTypeKey, 'en')).toBe('Triadic');
      expect(provider.getHarmonyType('monochromatic' as HarmonyTypeKey, 'en')).toBe(
        'Monochromatic'
      );
    });
  });

  describe('getVisionType', () => {
    it('should return vision type from requested locale', () => {
      registry.registerLocale(mockEnglishData);

      const vision = provider.getVisionType('normal' as VisionType, 'en');
      expect(vision).toBe('Normal Vision');
    });

    it('should return Japanese vision type when requested', () => {
      registry.registerLocale(mockJapaneseData);

      const vision = provider.getVisionType('normal' as VisionType, 'ja');
      expect(vision).toBe('正常な視覚');
    });

    it('should fallback to English when requested locale not available', () => {
      registry.registerLocale(mockEnglishData);

      const vision = provider.getVisionType('deuteranopia' as VisionType, 'de');
      expect(vision).toContain('Deuteranopia');
    });

    it('should format key when not found in any locale', () => {
      // Using 'fr' (valid LocaleCode) with no registry to test fallback to formatting
      const vision = provider.getVisionType('achromatopsia' as VisionType, 'fr');
      expect(vision).toBe('Achromatopsia');
    });

    it('should handle all vision types', () => {
      registry.registerLocale(mockEnglishData);

      expect(provider.getVisionType('normal' as VisionType, 'en')).toBe('Normal Vision');
      expect(provider.getVisionType('deuteranopia' as VisionType, 'en')).toContain('Deuteranopia');
      expect(provider.getVisionType('protanopia' as VisionType, 'en')).toContain('Protanopia');
      expect(provider.getVisionType('tritanopia' as VisionType, 'en')).toContain('Tritanopia');
    });
  });

  describe('fallback chain', () => {
    it('should use requested locale → English → formatted key chain', () => {
      registry.registerLocale(mockEnglishData);

      // Requested locale (not registered)
      const label1 = provider.getLabel('dye' as TranslationKey, 'de');
      expect(label1).toBe('Dye'); // Falls back to English

      // No locale registered at all
      const emptyRegistry = new LocaleRegistry();
      const emptyProvider = new TranslationProvider(emptyRegistry);
      const label2 = emptyProvider.getLabel('cosmicExploration' as TranslationKey, 'en');
      expect(label2).toBe('Cosmic Exploration'); // Formatted key
    });

    it('should not fallback to English when locale is English', () => {
      registry.registerLocale(mockEnglishData);

      const label = provider.getLabel('dye' as TranslationKey, 'en');
      expect(label).toBe('Dye');
    });

    it('should handle multiple locales with proper fallback', () => {
      registry.registerLocale(mockEnglishData);
      registry.registerLocale(mockJapaneseData);

      // Japanese locale should use Japanese
      expect(provider.getLabel('dye' as TranslationKey, 'ja')).toBe('カララント');

      // Unregistered locale should fallback to English
      expect(provider.getLabel('dye' as TranslationKey, 'fr')).toBe('Dye');
    });
  });

  describe('key formatting', () => {
    it('should format camelCase keys to Title Case', () => {
      const formatted = provider.getLabel('cosmicExploration' as TranslationKey, 'de');
      expect(formatted).toBe('Cosmic Exploration');
    });

    it('should handle harmony type key formatting', () => {
      const formatted = provider.getHarmonyType('splitComplementary' as HarmonyTypeKey, 'de');
      expect(formatted).toBe('Split Complementary');
    });

    it('should handle vision type key formatting', () => {
      const formatted = provider.getVisionType('achromatopsia' as VisionType, 'de');
      expect(formatted).toBe('Achromatopsia');
    });
  });
});
