// Services
export { ColorService } from './services/ColorService.js';
export { DyeService } from './services/DyeService.js';
export { APIService, MemoryCacheBackend } from './services/APIService.js';
export type { ICacheBackend, APIServiceOptions } from './services/APIService.js';
export { LocalizationService } from './services/LocalizationService.js';
export { PresetService } from './services/PresetService.js';
export { PaletteService } from './services/PaletteService.js';
export type {
  PaletteExtractionOptions,
  ExtractedColor,
  PaletteMatch,
  PaletteServiceOptions,
} from './services/PaletteService.js';
export { CharacterColorService } from './services/CharacterColorService.js';

// Types
export type {
  Dye,
  LocalizedDye,
  RGB,
  HSV,
  HexColor,
  VisionType,
  Matrix3x3,
  ColorblindMatrices,
  ErrorSeverity,
  PriceData,
  CachedData,
  LocaleCode,
  TranslationKey,
  HarmonyTypeKey,
  JobKey,
  GrandCompanyKey,
  LocaleData,
  LocalePreference,
  Logger,
  // Preset types
  PresetCategory,
  CategoryMeta,
  PresetPalette,
  ResolvedPreset,
  PresetData,
  // Community preset types (for API integration)
  PresetStatus,
  CommunityPreset,
  PresetSubmission,
  PresetListResponse,
  PresetSubmitResponse,
  VoteResponse,
  PresetFilters,
  // Character types
  CharacterColor,
  CharacterColorMatch,
  SubRace,
  Gender,
  Race,
} from './types/index.js';
export {
  AppError,
  ErrorCode,
  createHexColor,
  NoOpLogger,
  ConsoleLogger,
  // Character constants
  RACE_SUBRACES,
  SUBRACE_TO_RACE,
  COLOR_GRID_DIMENSIONS,
} from './types/index.js';

// Constants
export {
  RGB_MIN,
  RGB_MAX,
  HUE_MIN,
  HUE_MAX,
  SATURATION_MIN,
  SATURATION_MAX,
  VALUE_MIN,
  VALUE_MAX,
  COLOR_DISTANCE_MAX,
  VISION_TYPES,
  VISION_TYPE_LABELS,
  BRETTEL_MATRICES,
  PATTERNS,
  UNIVERSALIS_API_BASE,
  UNIVERSALIS_API_TIMEOUT,
  UNIVERSALIS_API_RETRY_COUNT,
  UNIVERSALIS_API_RETRY_DELAY,
  API_CACHE_TTL,
  API_DEBOUNCE_DELAY,
  API_CACHE_VERSION,
  API_MAX_RESPONSE_SIZE,
  API_RATE_LIMIT_DELAY,
} from './constants/index.js';

// Utils
export {
  clamp,
  lerp,
  round,
  distance,
  unique,
  groupBy,
  sortByProperty,
  filterNulls,
  isValidHexColor,
  isValidRGB,
  isValidHSV,
  isString,
  isNumber,
  isArray,
  isObject,
  isNullish,
  sleep,
  retry,
  isAbortError,
  generateChecksum,
} from './utils/index.js';

// Data (for browser environments - to be injected)
export { default as dyeDatabase } from './data/colors_xiv.json' with { type: 'json' };
export { default as presetData } from './data/presets.json' with { type: 'json' };
export { default as characterColorData } from './data/character_colors.json' with { type: 'json' };

// Version (auto-generated from package.json during build)
export { VERSION } from './version.js';
