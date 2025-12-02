/**
 * @xivdyetools/core - Logger Interface
 *
 * Injectable logger interface for library consumers to customize logging behavior.
 * Prevents library code from polluting consumer application logs.
 *
 * @module types/logger
 */

/**
 * Logger interface for customizable logging
 *
 * Implement this interface to control how the library logs messages.
 * By default, the library uses a no-op logger that suppresses all output.
 *
 * @example Using the console logger
 * ```typescript
 * import { ConsoleLogger, DyeService } from 'xivdyetools-core';
 *
 * // Enable console logging for debugging
 * const dyeService = new DyeService({ logger: ConsoleLogger });
 * ```
 *
 * @example Creating a custom logger
 * ```typescript
 * const myLogger: Logger = {
 *     info: (msg) => myLoggingFramework.info(`[xivdyetools] ${msg}`),
 *     warn: (msg) => myLoggingFramework.warn(`[xivdyetools] ${msg}`),
 *     error: (msg, error) => myLoggingFramework.error(`[xivdyetools] ${msg}`, error),
 *     debug: (msg) => myLoggingFramework.debug(`[xivdyetools] ${msg}`),
 * };
 * ```
 */
export interface Logger {
  /**
   * Log an informational message
   * @param message - Message to log
   */
  info: (message: string) => void;

  /**
   * Log a warning message
   * @param message - Message to log
   */
  warn: (message: string) => void;

  /**
   * Log an error message
   * @param message - Message to log
   * @param error - Optional error object for additional context
   */
  error: (message: string, error?: unknown) => void;

  /**
   * Log a debug message (optional, typically suppressed in production)
   * @param message - Message to log
   */
  debug?: (message: string) => void;
}

/**
 * No-op logger that suppresses all output
 *
 * This is the default logger used by the library to prevent
 * polluting consumer application logs.
 *
 * @example
 * ```typescript
 * // Default behavior - no console output
 * const service = new DyeService();
 * ```
 */
export const NoOpLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

/**
 * Console logger for development and debugging
 *
 * Use this when you want to see library log messages in the console.
 * Prefixes all messages with [xivdyetools] for easy identification.
 *
 * @example
 * ```typescript
 * import { ConsoleLogger, DyeService } from 'xivdyetools-core';
 *
 * // Enable verbose logging during development
 * const dyeService = new DyeService({ logger: ConsoleLogger });
 * ```
 */
export const ConsoleLogger: Logger = {
  info: (message: string) => console.info(`[xivdyetools] ${message}`),
  warn: (message: string) => console.warn(`[xivdyetools] ${message}`),
  error: (message: string, error?: unknown) => {
    if (error) {
      console.error(`[xivdyetools] ${message}`, error);
    } else {
      console.error(`[xivdyetools] ${message}`);
    }
  },
  debug: (message: string) => console.debug(`[xivdyetools] ${message}`),
};
