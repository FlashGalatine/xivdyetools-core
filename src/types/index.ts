/**
 * @xivdyetools/core - Shared Type Definitions
 *
 * Type definitions for color science and FFXIV dyes.
 *
 * NOTE: These types are now re-exported from @xivdyetools/types for consistency
 * across the xivdyetools ecosystem. For new projects, consider importing
 * directly from @xivdyetools/types.
 *
 * @module types
 */

/**
 * @deprecated Import directly from '@xivdyetools/logger/library' instead.
 * These re-exports will be removed in the next major version.
 */
export type { Logger } from '@xivdyetools/logger/library';
/**
 * @deprecated Import directly from '@xivdyetools/logger/library' instead.
 * These re-exports will be removed in the next major version.
 */
export { NoOpLogger, ConsoleLogger } from '@xivdyetools/logger/library';

// ============================================================================
// Re-export all types from @xivdyetools/types
// ============================================================================

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type { RGB, HSV, HexColor, DyeId, Hue, Saturation } from '@xivdyetools/types';
/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export { createHexColor, createDyeId, createHue, createSaturation } from '@xivdyetools/types';
/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type { VisionType, Matrix3x3, ColorblindMatrices } from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type { Dye, LocalizedDye, DyeWithDistance, DyeDatabase } from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type {
  PresetCategory,
  PresetStatus,
  PresetSortOption,
  CategoryMeta,
  PresetPalette,
  ResolvedPreset,
  PresetData,
  CommunityPreset,
  PresetSubmission,
  AuthenticatedPresetSubmission,
  PresetFilters,
  PresetEditRequest,
  PresetListResponse,
  PresetSubmitResponse,
  PresetEditResponse,
  VoteResponse,
  ModerationResponse,
  CategoryListResponse,
} from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type {
  AuthProvider,
  AuthSource,
  AuthContext,
  PrimaryCharacter,
  JWTPayload,
  OAuthState,
  DiscordTokenResponse,
  DiscordUser,
  XIVAuthTokenResponse,
  XIVAuthCharacter,
  XIVAuthCharacterRegistration,
  XIVAuthSocialIdentity,
  XIVAuthUser,
  AuthUser,
  AuthResponse,
  RefreshResponse,
  UserInfoResponse,
} from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type {
  APIResponse,
  CachedData,
  ModerationResult,
  ModerationLogEntry,
  ModerationStats,
  PriceData,
  RateLimitResult,
} from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type {
  LocaleCode,
  TranslationKey,
  HarmonyTypeKey,
  JobKey,
  GrandCompanyKey,
  LocaleData,
  LocalePreference,
} from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export { ErrorCode, AppError } from '@xivdyetools/types';
/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type { ErrorSeverity } from '@xivdyetools/types';

/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export type { Result, AsyncResult, Nullable, Optional } from '@xivdyetools/types';
/**
 * @deprecated Import directly from '@xivdyetools/types' instead.
 * These re-exports will be removed in the next major version.
 */
export { isOk, isErr } from '@xivdyetools/types';
