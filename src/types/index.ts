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

// Re-export logger types from @xivdyetools/logger/library
export type { Logger } from '@xivdyetools/logger/library';
export { NoOpLogger, ConsoleLogger } from '@xivdyetools/logger/library';

// ============================================================================
// Re-export all types from @xivdyetools/types
// ============================================================================

// Color Types
export type { RGB, HSV, HexColor, DyeId, Hue, Saturation } from '@xivdyetools/types';
export { createHexColor, createDyeId, createHue, createSaturation } from '@xivdyetools/types';
export type { VisionType, Matrix3x3, ColorblindMatrices } from '@xivdyetools/types';

// Dye Types
export type { Dye, LocalizedDye, DyeWithDistance, DyeDatabase } from '@xivdyetools/types';

// Preset Types
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

// Auth Types
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

// API Types
export type {
  APIResponse,
  CachedData,
  ModerationResult,
  ModerationLogEntry,
  ModerationStats,
  PriceData,
  RateLimitResult,
} from '@xivdyetools/types';

// Localization Types
export type {
  LocaleCode,
  TranslationKey,
  HarmonyTypeKey,
  JobKey,
  GrandCompanyKey,
  LocaleData,
  LocalePreference,
} from '@xivdyetools/types';

// Error Types
export { ErrorCode, AppError } from '@xivdyetools/types';
export type { ErrorSeverity } from '@xivdyetools/types';

// Utility Types
export type { Result, AsyncResult, Nullable, Optional } from '@xivdyetools/types';
export { isOk, isErr } from '@xivdyetools/types';
