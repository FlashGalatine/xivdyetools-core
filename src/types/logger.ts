/**
 * @xivdyetools/core - Logger Interface
 *
 * Injectable logger interface for library consumers to customize logging behavior.
 * Prevents library code from polluting consumer application logs.
 *
 * NOTE: This file now re-exports from @xivdyetools/logger/library for consistency
 * across the xivdyetools ecosystem. For new projects, consider importing
 * directly from @xivdyetools/logger/library.
 *
 * @module types/logger
 */

// Re-export everything from @xivdyetools/logger/library for backward compatibility
export type { Logger } from '@xivdyetools/logger/library';
export { NoOpLogger, ConsoleLogger, createLibraryLogger } from '@xivdyetools/logger/library';
