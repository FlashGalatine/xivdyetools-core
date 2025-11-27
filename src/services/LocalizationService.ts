/**
 * LocalizationService - Facade for localization functionality
 *
 * Per R-4: Facade pattern - delegates to focused service classes
 * Provides multi-language support with lazy loading and fallback chains
 *
 * @module services
 */

import type {
  LocaleCode,
  TranslationKey,
  HarmonyTypeKey,
  VisionType,
  LocalePreference,
} from '../types/index.js';
import { LocaleLoader } from './localization/LocaleLoader.js';
import { LocaleRegistry } from './localization/LocaleRegistry.js';
import { TranslationProvider } from './localization/TranslationProvider.js';

/**
 * LocalizationService - Main entry point for localization features
 *
 * @example Basic usage
 * ```typescript
 * import { LocalizationService } from 'xivdyetools-core';
 *
 * // Set locale (lazy loads locale data)
 * await LocalizationService.setLocale('ja');
 *
 * // Get localized label
 * const label = LocalizationService.getLabel('dye'); // "カララント:"
 *
 * // Get localized dye name
 * const dyeName = LocalizationService.getDyeName(5729); // "スノウホワイト"
 * ```
 *
 * @example Discord bot locale resolution
 * ```typescript
 * const preference: LocalePreference = {
 *     explicit: interaction.options.getString('language'),
 *     guild: interaction.guildLocale,
 *     system: interaction.locale,
 *     fallback: 'en'
 * };
 * await LocalizationService.setLocaleFromPreference(preference);
 * ```
 */
export class LocalizationService {
  private static loader: LocaleLoader = new LocaleLoader();
  private static registry: LocaleRegistry = new LocaleRegistry();
  private static translator: TranslationProvider = new TranslationProvider(
    LocalizationService.registry
  );

  private static currentLocale: LocaleCode = 'en';
  private static isInitialized: boolean = false;

  /**
   * Set active locale (loads locale file if not cached)
   *
   * @param locale - Locale code ('en', 'ja', 'de', 'fr')
   * @throws {AppError} If locale file fails to load
   *
   * @example
   * ```typescript
   * await LocalizationService.setLocale('ja');
   * console.log(LocalizationService.getCurrentLocale()); // 'ja'
   * ```
   */
  static async setLocale(locale: LocaleCode): Promise<void> {
    // Check if already loaded
    if (this.registry.hasLocale(locale)) {
      this.currentLocale = locale;
      this.isInitialized = true;
      return;
    }

    // Load locale data
    const localeData = await this.loader.loadLocale(locale);
    this.registry.registerLocale(localeData);
    this.currentLocale = locale;
    this.isInitialized = true;
  }

  /**
   * Set locale from preference object with priority chain
   * Priority: explicit > guild > system > fallback
   *
   * @param preference - Locale preference with fallback chain
   *
   * @example
   * ```typescript
   * // Discord bot usage
   * await LocalizationService.setLocaleFromPreference({
   *     explicit: 'de',     // User selected German
   *     guild: 'ja',        // Server is Japanese
   *     system: 'en-US',    // User's system is English
   *     fallback: 'en'
   * });
   * // Sets locale to 'de' (highest priority)
   * ```
   */
  static async setLocaleFromPreference(preference: LocalePreference): Promise<void> {
    const supportedLocales: LocaleCode[] = ['en', 'ja', 'de', 'fr'];

    // 1. Try explicit user selection (highest priority)
    if (preference.explicit && supportedLocales.includes(preference.explicit)) {
      await this.setLocale(preference.explicit);
      return;
    }

    // 2. Try guild/server preference
    if (preference.guild) {
      const guildLocale = this.extractLocaleCode(preference.guild);
      if (guildLocale && supportedLocales.includes(guildLocale)) {
        await this.setLocale(guildLocale);
        return;
      }
    }

    // 3. Try user's system language
    if (preference.system) {
      const systemLocale = this.extractLocaleCode(preference.system);
      if (systemLocale && supportedLocales.includes(systemLocale)) {
        await this.setLocale(systemLocale);
        return;
      }
    }

    // 4. Fallback
    await this.setLocale(preference.fallback);
  }

  /**
   * Extract 2-letter locale code from longer locale strings
   *
   * @param locale - Locale string (e.g., 'en-US', 'ja', 'de-DE')
   * @returns 2-letter locale code or null
   * @private
   *
   * @example
   * ```typescript
   * extractLocaleCode('en-US') // 'en'
   * extractLocaleCode('ja') // 'ja'
   * ```
   */
  private static extractLocaleCode(locale: string): LocaleCode | null {
    const code = locale.split('-')[0].toLowerCase();
    const supportedLocales: LocaleCode[] = ['en', 'ja', 'de', 'fr'];

    return supportedLocales.includes(code as LocaleCode) ? (code as LocaleCode) : null;
  }

  /**
   * Get current active locale
   *
   * @returns Current locale code
   *
   * @example
   * ```typescript
   * console.log(LocalizationService.getCurrentLocale()); // 'ja'
   * ```
   */
  static getCurrentLocale(): LocaleCode {
    return this.currentLocale;
  }

  /**
   * Check if service is initialized with a locale
   *
   * @returns true if locale data is loaded
   *
   * @example
   * ```typescript
   * if (!LocalizationService.isLocaleLoaded()) {
   *     await LocalizationService.setLocale('en');
   * }
   * ```
   */
  static isLocaleLoaded(): boolean {
    return this.isInitialized;
  }

  /**
   * Get localized UI label (with fallback to English)
   *
   * @param key - Translation key
   * @returns Localized label
   *
   * @example
   * ```typescript
   * const label = LocalizationService.getLabel('dye');
   * // Returns "カララント:" (ja) or "Dye" (en) or "Teinture" (fr)
   * ```
   */
  static getLabel(key: TranslationKey): string {
    return this.translator.getLabel(key, this.currentLocale);
  }

  /**
   * Get localized dye name by itemID
   *
   * @param itemID - Dye item ID (5729-48227)
   * @returns Localized name or null if not found
   *
   * @example
   * ```typescript
   * const name = LocalizationService.getDyeName(5729);
   * // Returns "スノウホワイト" (ja) or "Snow White" (en)
   * ```
   */
  static getDyeName(itemID: number): string | null {
    return this.translator.getDyeName(itemID, this.currentLocale);
  }

  /**
   * Get localized category name
   *
   * @param category - Category key (e.g., "Reds", "Blues")
   * @returns Localized category name
   *
   * @example
   * ```typescript
   * const category = LocalizationService.getCategory('Reds');
   * // Returns "赤系" (ja) or "Reds" (en)
   * ```
   */
  static getCategory(category: string): string {
    return this.translator.getCategory(category, this.currentLocale);
  }

  /**
   * Get all metallic dye IDs (for exclusion filtering)
   *
   * @returns Array of metallic dye item IDs
   *
   * @example
   * ```typescript
   * const metallicIds = LocalizationService.getMetallicDyeIds();
   * // Returns [13116, 13117, 13717, ...]
   *
   * // Use for filtering
   * const nonMetallic = dyes.filter(d => !metallicIds.includes(d.itemID));
   * ```
   */
  static getMetallicDyeIds(): number[] {
    return this.translator.getMetallicDyeIds(this.currentLocale);
  }

  /**
   * Get localized harmony type name
   *
   * @param key - Harmony type key
   * @returns Localized harmony type
   *
   * @example
   * ```typescript
   * const harmony = LocalizationService.getHarmonyType('triadic');
   * // Returns "三色配色" (ja) or "Triadic" (en)
   * ```
   */
  static getHarmonyType(key: HarmonyTypeKey): string {
    return this.translator.getHarmonyType(key, this.currentLocale);
  }

  /**
   * Get localized vision type name
   *
   * @param key - Vision type key
   * @returns Localized vision type
   *
   * @example
   * ```typescript
   * const vision = LocalizationService.getVisionType('deuteranopia');
   * // Returns "2型色覚（赤緑色盲）" (ja) or English description
   * ```
   */
  static getVisionType(key: VisionType): string {
    return this.translator.getVisionType(key, this.currentLocale);
  }

  /**
   * Get all available locale codes
   *
   * @returns Array of supported locale codes
   *
   * @example
   * ```typescript
   * const locales = LocalizationService.getAvailableLocales();
   * // Returns ['en', 'ja', 'de', 'fr']
   * ```
   */
  static getAvailableLocales(): LocaleCode[] {
    return ['en', 'ja', 'de', 'fr'];
  }

  /**
   * Preload multiple locales for instant switching
   * Useful for apps that need to switch locales without delay
   *
   * @param locales - Array of locale codes to preload
   *
   * @example
   * ```typescript
   * // Preload all locales during app init
   * await LocalizationService.preloadLocales(['en', 'ja', 'de', 'fr']);
   *
   * // Now switching is instant (no loading delay)
   * await LocalizationService.setLocale('ja'); // Instant
   * ```
   */
  static async preloadLocales(locales: LocaleCode[]): Promise<void> {
    await Promise.all(locales.map((locale) => this.setLocale(locale)));
  }

  /**
   * Clear all loaded locales from cache
   * Useful for testing or memory management
   *
   * @example
   * ```typescript
   * LocalizationService.clear();
   * ```
   */
  static clear(): void {
    this.registry.clear();
    this.currentLocale = 'en';
    this.isInitialized = false;
  }
}
