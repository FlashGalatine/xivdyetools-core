/**
 * LocaleLoader - Loads locale JSON files via dynamic import
 *
 * Per R-4: Single Responsibility - locale file loading only
 * Uses dynamic import for tree-shaking (bundlers can code-split by locale)
 *
 * @module services/localization
 */

import type { LocaleCode, LocaleData } from '../../types/index.js';
import { AppError, ErrorCode } from '../../types/index.js';

/**
 * Loads locale data from JSON files
 */
export class LocaleLoader {
  /**
   * Load locale data from JSON file using dynamic import
   *
   * @param locale - Locale code to load
   * @returns Promise resolving to locale data
   * @throws {AppError} If locale file fails to load or is invalid
   *
   * @example
   * ```typescript
   * const loader = new LocaleLoader();
   * const jaData = await loader.loadLocale('ja');
   * console.log(jaData.labels.dye); // "カララント:"
   * ```
   */
  async loadLocale(locale: LocaleCode): Promise<LocaleData> {
    try {
      // Dynamic import allows bundlers to code-split by locale
      // Using string template for locale path
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const module = await import(`../../data/locales/${locale}.json`, {
        assert: { type: 'json' },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const data = (module.default || module) as unknown;

      // Validate structure
      if (!this.isValidLocaleData(data)) {
        throw new Error(`Invalid locale data structure for ${locale}`);
      }

      return data as LocaleData;
    } catch (error) {
      throw new AppError(
        ErrorCode.LOCALE_LOAD_FAILED,
        `Failed to load locale "${locale}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  }

  /**
   * Validate locale data structure
   *
   * @param data - Unknown data to validate
   * @returns true if data matches LocaleData interface
   * @private
   */
  private isValidLocaleData(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const localeData = data as Record<string, unknown>;

    return (
      typeof localeData.locale === 'string' &&
      typeof localeData.meta === 'object' &&
      typeof localeData.labels === 'object' &&
      typeof localeData.dyeNames === 'object' &&
      typeof localeData.categories === 'object' &&
      typeof localeData.acquisitions === 'object' &&
      Array.isArray(localeData.metallicDyeIds) &&
      typeof localeData.harmonyTypes === 'object' &&
      typeof localeData.visionTypes === 'object'
    );
  }
}
