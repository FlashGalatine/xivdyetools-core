/**
 * LocaleLoader - Loads locale JSON files
 *
 * Per R-4: Single Responsibility - locale file loading only
 * Uses fs.readFileSync for Node.js compatibility (works with Node.js v23+)
 *
 * @module services/localization
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { LocaleCode, LocaleData } from '../../types/index.js';
import { AppError, ErrorCode } from '../../types/index.js';

// Get directory path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Loads locale data from JSON files
 */
export class LocaleLoader {
  /**
   * Load locale data from JSON file
   *
   * @param locale - Locale code to load
   * @returns Locale data
   * @throws {AppError} If locale file fails to load or is invalid
   *
   * @example
   * ```typescript
   * const loader = new LocaleLoader();
   * const jaData = loader.loadLocale('ja');
   * console.log(jaData.labels.dye); // "カララント:"
   * ```
   */
  loadLocale(locale: LocaleCode): LocaleData {
    try {
      // Use fs.readFileSync for Node.js v23+ compatibility
      // (avoids import assertion/attribute issues)
      const filePath = join(__dirname, '..', '..', 'data', 'locales', `${locale}.json`);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;

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
