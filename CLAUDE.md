# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Core TypeScript library for FFXIV dye color tools. Provides color algorithms, a 136-dye database, Universalis API integration, and i18n support. Environment-agnostic (Node.js, browsers, edge runtimes).

## Commands

```bash
npm run build              # Compile TypeScript + build locales
npm test                   # Run vitest
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Test with coverage report
npm run test:integration   # Run integration tests only
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
npm run type-check         # TypeScript check without emit
npm run docs               # Generate TypeDoc documentation
```

### Running Specific Tests

```bash
npm test -- src/services/__tests__/ColorService.test.ts    # Single file
npm test -- --grep "hexToRgb"                               # Pattern match
npm run test:integration                                     # Integration tests
```

## Architecture

### Service Layer (Facade Pattern)

The library uses facade classes that delegate to focused sub-services:

```
ColorService (facade) ──► ColorConverter, ColorblindnessSimulator,
                          ColorAccessibility, ColorManipulator

DyeService (facade) ────► DyeDatabase, DyeSearch, HarmonyGenerator
```

### Key Services

| Service | Purpose |
|---------|---------|
| **ColorService** | Static methods for color conversion (hex/RGB/HSV), accessibility (WCAG contrast), colorblindness simulation (Brettel 1997) |
| **DyeService** | Instance-based, takes dyeDatabase. Dye lookup, color matching, harmony generation |
| **APIService** | Universalis API with pluggable cache backend (ICacheBackend interface) |
| **LocalizationService** | 6-language i18n (en, ja, de, fr, ko, zh) |
| **PaletteService** | K-means++ clustering for palette extraction from images |
| **PresetService** | Curated dye preset palettes |

### Performance Optimizations

- **k-d Tree**: DyeDatabase uses k-d tree in RGB space for O(log n) nearest-neighbor matching
- **Hue Bucketing**: HarmonyGenerator uses 10° hue buckets (36 total) for fast harmony lookups
- **LRU Caching**: ColorConverter maintains 5 caches × 1000 entries for repeated conversions

### Type System

Uses branded types for type safety:
- `HexColor` - validated hex string (#RRGGBB)
- `DyeId` - validated dye ID number
- `Hue`, `Saturation` - color component values

Create with helpers: `createHexColor()`, `createDyeId()`, `createHue()`

### Source Structure

```
src/
├── services/
│   ├── ColorService.ts      # Facade
│   ├── DyeService.ts        # Facade
│   ├── APIService.ts        # Universalis API + cache
│   ├── LocalizationService.ts
│   ├── PaletteService.ts
│   ├── PresetService.ts
│   ├── color/               # Sub-services
│   │   ├── ColorConverter.ts
│   │   ├── ColorAccessibility.ts
│   │   ├── ColorManipulator.ts
│   │   └── ColorblindnessSimulator.ts
│   ├── dye/
│   │   ├── DyeDatabase.ts   # k-d tree indexing
│   │   ├── DyeSearch.ts
│   │   └── HarmonyGenerator.ts
│   └── localization/
├── types/index.ts           # All type definitions
├── constants/index.ts       # Color theory + API constants
├── utils/                   # Helpers (kd-tree, validation)
├── data/                    # JSON: colors_xiv.json, presets.json
└── index.ts                 # Public API exports
```

## Usage Patterns

### Service Instantiation

```typescript
import { ColorService, DyeService, dyeDatabase } from 'xivdyetools-core';

// ColorService is static
const rgb = ColorService.hexToRgb('#FF6B6B');

// DyeService needs database injection
const dyeService = new DyeService(dyeDatabase);
const dye = dyeService.findClosestDye('#FF6B6B');
```

### Custom Cache Backend

APIService accepts pluggable cache via ICacheBackend interface:
```typescript
interface ICacheBackend {
  get(key: string): Promise<CachedData | null>;
  set(key: string, value: CachedData): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Testing

- Coverage threshold: 85% minimum (lines, functions, branches, statements)
- Test timeout: 10 seconds
- Integration tests in `src/__tests__/integration/`

## Publishing

After changes:
1. Run tests: `npm test`
2. Build: `npm run build`
3. Update version in package.json
4. Publish: `npm publish` (triggers prepublishOnly build)
