# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.5] - 2025-12-05

### Added
- **PaletteService**: New service for multi-color palette extraction from images
  - K-means++ clustering algorithm for accurate dominant color detection
  - `extractPalette(pixels, options)` - Extract N dominant colors with dominance percentages
  - `extractAndMatchPalette(pixels, dyeService, options)` - Extract and match to closest FFXIV dyes
  - Configurable: `colorCount` (3-5), `maxIterations`, `convergenceThreshold`, `maxSamples`
  - Helper functions: `pixelDataToRGB()`, `pixelDataToRGBFiltered()` for Canvas data conversion

### Usage Example
```typescript
import { PaletteService, DyeService, dyeDatabase } from 'xivdyetools-core';

const paletteService = new PaletteService();
const dyeService = new DyeService(dyeDatabase);

// Extract from Canvas ImageData
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const pixels = PaletteService.pixelDataToRGBFiltered(imageData.data);

// Get palette with matched dyes
const matches = paletteService.extractAndMatchPalette(pixels, dyeService, {
  colorCount: 4,
  maxIterations: 25
});

// Each match includes: extracted, matchedDye, distance, dominance
```

---

## [1.3.2] - 2025-12-04

### Added
- **Logger Test Coverage**: Comprehensive test suite for `logger.ts` (25% → 100% coverage)
  - 23 new tests covering `NoOpLogger`, `ConsoleLogger`, and custom `Logger` implementations
  - Tests for all log levels (info, warn, error, debug)
  - Branch coverage for error handling with and without error objects
  - Validation of Logger interface contract

## [1.3.1] - 2025-12-02

### Fixed
- **Security**: Added prototype pollution protection in `DyeDatabase.initialize()` for untrusted data sources
- **Data Integrity**: Fixed `price` vs `cost` field mismatch - JSON data uses `price` but `Dye` interface expects `cost`
- **Memory**: Removed duplicate ID mapping in `DyeDatabase` - now only maps `itemID` separately if it differs from `id`
- **Concurrency**: Fixed race condition in singleton patterns by using eager initialization for `ColorConverter` and `LocalizationService`
- **Integer Operations**: Fixed `generateChecksum` to use proper 32-bit integer conversion (`|0` instead of `&hash`)
- **Color Manipulation**: Fixed negative hue values in `rotateHue` - now properly normalizes to 0-360 range
- **Floating Point**: Consistent rounding strategy in `ColorConverter` between `rgbToHsv` and `hsvToRgb`
- **Tests**: Fixed Point3D typo in `kd-tree.test.ts` (`b` → `z`)

### Added
- **Logger Interface**: Injectable `Logger` interface with `NoOpLogger` (default) and `ConsoleLogger` implementations
- **Dye Validation**: Runtime validation for dye data with `isValidDye()` method
- **Test Isolation**: `LocalizationService.resetInstance()` for preventing test pollution
- **AbortError Detection**: `isAbortError()` utility function for timeout error handling in retry logic
- **Documentation**: Comprehensive `docs/ERROR_HANDLING.md` guide for error handling patterns

### Changed
- **API Retry**: `retry()` now includes AbortError/TimeoutError in retry loop for transient network issues
- **Harmony Methods**: Documented that `findTriadicDyes`, `findSquareDyes`, `findTetradicDyes` may return fewer results than expected
- **VERSION Sync**: VERSION constant now auto-generated from package.json during build

## [1.3.0] - 2025-12-01

### Added
- **Dye Type Flags**: Added locale-independent type flags to `Dye` interface for filtering
  - `isMetallic`: Identifies metallic dyes (14 dyes)
  - `isPastel`: Identifies pastel dyes (4 dyes)
  - `isDark`: Identifies dark dyes (5 dyes)
  - `isCosmic`: Identifies cosmic dyes from Cosmic Exploration/Fortunes (20 dyes)
  - Enables filtering by dye type regardless of user's language setting
  - All 136 dyes in `colors_xiv.json` now include these boolean flags

### Changed
- **Breaking Change**: `Dye` interface now requires four additional boolean properties
  - Applications using this package must update to handle the new properties
  - Existing code will continue to work but TypeScript will show type errors until updated

## [1.2.5] - 2025-11-30

### Fixed
- **Metallic Dyes**: Added "Gunmetal Black" (30122) and "Pearl White" (30123) to `metallicDyeIds` list in all locales.

## [1.2.4] - 2025-11-30

### Fixed
- **Japanese Locale**: Removed trailing colon from `labels.dye` ("カララント:" → "カララント")
- **Korean Locale**: Corrected Venture Coffers translation ("모험 보물상자" → "집사의 보물상자" - official term)

### Added
- **Localization Reference Documentation**: New `docs/LOCALIZATION_REFERENCE.md` with verified official FFXIV terms
  - Official translations for Dye, Market Board, Dark, Pastel, Metallic across all 6 languages
  - Cosmic Exploration and Cosmic Fortunes translations
  - Venture Coffers translations (verified against official sources)
  - Allied Society Vendors (Beast Tribe Vendors) translations
  - Beast tribe names (Ixali, Sylph, Kobold, Amalj'aa, Sahagin)
  - Dye name format pattern documentation
- **Scrape Comparison Script**: New `scripts/compare-scrapes.js` for validating locale data against scraped sources

---

## [1.2.3] - 2025-11-28

### Added
- **Comprehensive Branch Coverage Testing**: Improved test coverage from ~85% to 95.8% branch coverage
  - **types/index.ts**: Added 66 new tests for branded type helpers (`createHexColor`, `createDyeId`, `createHue`, `createSaturation`) and `AppError` class (41.66% → 100%)
  - **DyeSearch.ts**: Added linear search fallback tests for when k-d tree is unavailable (74.5% → 98.03%)
  - **APIService.ts**: Added tests for oversized response handling, JSON parse errors, health check failures, worldID cache keys (84% → 93%)
  - **LocaleLoader.ts**: Added `isValidLocaleData` direct tests and mocked validation failure tests (84.21% → 94.73%)
  - **ColorblindnessSimulator.ts**: Added LRU cache eviction tests (73.33% → 86.66%)

### Changed
- All 17 source files now meet or approach 90%+ branch coverage target
- 1095 total tests across the entire test suite

---

## [1.2.2] - 2025-11-28

### Fixed
- **Locale File Updates**: Additional translation keys and refinements
  - Added missing harmony type descriptions
  - Updated category labels for consistency across all 6 locales
  - Minor translation corrections in Japanese, German, French locale files

---

## [1.2.0] - 2025-11-27

### Added
- **Chinese (zh) Localization**: Full Chinese translation support
  - All 125 dye names translated
  - UI labels, categories, acquisitions, harmony types, vision types
- **Korean (ko) Localization**: Full Korean translation support
  - All 125 dye names translated
  - UI labels, categories, acquisitions, harmony types, vision types
- **Expanded `LocaleCode` type**: Now includes `'ko'` and `'zh'` in addition to `'en'`, `'ja'`, `'de'`, `'fr'`
- **6 supported locales**: English, Japanese, German, French, Korean, Chinese

### Changed
- `SUPPORTED_LOCALES` array now contains 6 locales
- Updated tests to reflect new supported locales

---

## [1.1.2] - 2025-11-27

### Fixed
- **Locale files missing from npm package**: Added `copy:locales` build step to copy locale JSON files to `dist/data/locales/`
  - TypeScript's `tsc` only copies statically imported JSON files
  - Dynamic imports (used for locale code-splitting) require manual copy
  - Build now runs: `build:locales` → `tsc` → `copy:locales`

---

## [1.1.1] - 2025-11-27

### Added
- **Comprehensive Test Coverage**: Achieved 93%+ overall test coverage
  - **ColorService Tests**: 41 tests covering all facade delegation methods
  - **DyeService Tests**: 50 tests covering database access, search/filter, harmony generation, localization
  - **LocalizationService Tests**: Enhanced static API tests for 100% coverage
  - **Utils Tests**: 93 tests for all utility functions (clamp, lerp, validation, async helpers)
  - **882 total tests** across the entire test suite

### Changed
- **Test Quality Improvements**
  - Static API tests now actually call methods instead of just checking `typeof`
  - Harmony tests use flexible expectations for limited sample data scenarios
  - Retry utility tests use real timers for more reliable async behavior

### Fixed
- Test assertions for color brightness comparisons use `toBeLessThanOrEqual`
- Harmony generation tests handle variable result counts from limited dye datasets

---

## [1.1.0] - 2025-11-23

### Added
- **Performance Optimizations**
  - **LRU Caching**: Added LRU cache for color conversions (60-80% speedup)
    - Caches hex→RGB, RGB→HSV, HSV→RGB, hex→HSV, RGB→hex conversions
    - Caches colorblindness simulation results
    - Cache statistics and clearing methods
  - **Hue-Indexed Harmony Lookups**: 70-90% faster harmony generation
    - Hue bucket indexing (10° buckets, 36 total)
    - Optimized color wheel queries
  - **k-d Tree Implementation**: 10-20x speedup for color matching
    - Custom 3D RGB color space k-d tree
    - O(log n) average case vs O(n) linear search
    - Fast nearest neighbor and range queries

- **Type Safety**
  - **Branded Types**: Enhanced type safety with branded types
    - `HexColor`, `DyeId`, `Hue`, `Saturation` branded types
    - Factory functions with validation (`createHexColor`, `createDyeId`)

- **Service Architecture**
  - **Service Class Splitting**: Split services into focused classes
    - `ColorConverter`: Format conversions (hex ↔ RGB ↔ HSV)
    - `ColorblindnessSimulator`: Colorblindness simulation
    - `ColorAccessibility`: WCAG contrast, luminance calculations
    - `ColorManipulator`: Brightness, saturation, hue rotation
    - `DyeDatabase`: Database loading, indexing, data access
    - `DyeSearch`: Search and matching operations
    - `HarmonyGenerator`: Color harmony generation
  - Maintained backward compatibility with facade classes

- **Testing & Documentation**
  - **Integration Tests**: Comprehensive integration test suite
    - Harmony workflow tests
    - Color conversion pipeline tests
    - Dye matching workflow tests
    - End-to-end workflow tests
    - Performance benchmarks
  - **API Documentation**: TypeDoc generation configured
  - **Algorithm Documentation**: k-d tree algorithm documented

### Changed
- **Performance Improvements**
  - Color conversion operations now use LRU caching
  - Harmony generation uses hue-indexed lookups
  - Dye matching uses k-d tree for spatial indexing
  - Optimized RGB→HSV conversion (single-pass min/max)

- **Code Quality**
  - TypeScript strict mode enabled
  - ESLint and Prettier configured
  - Pre-commit hooks for code quality
  - Improved code organization and maintainability

### Performance
- **Color Conversions**: < 0.05ms per conversion (target: < 0.1ms) ✅
- **Dye Matching**: < 2ms per match (target: < 3ms) ✅
- **Harmony Generation**: < 15ms per harmony (target: < 20ms) ✅
- **Cache Hit Rate**: > 60% ✅

### Security
- **Dependency Scanning**: 0 high/critical vulnerabilities ✅
- All dependencies up to date

### Documentation
- Complete API documentation (TypeDoc)
- Algorithm documentation (k-d tree)
- Testing strategy documentation

---

## [1.0.2] - Previous Release

Initial stable release with core color algorithms and dye database functionality.










