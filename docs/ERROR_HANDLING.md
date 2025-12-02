# Error Handling Patterns

This document describes the error handling conventions used across xivdyetools-core services.

## Overview

The library uses three distinct error handling patterns depending on the operation type:

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Throw `AppError`** | Validation failures, critical errors | Invalid hex color format |
| **Return `null`** | Not found, recoverable failures | Dye not found in database |
| **Silent handling** | Optional operations, graceful degradation | Cache miss |

## Service-Specific Patterns

### ColorService / ColorConverter

**Pattern: Throws `AppError` for validation errors**

```typescript
// ColorConverter.hexToRgb throws for invalid input
try {
    const rgb = ColorService.hexToRgb('#INVALID');
} catch (error) {
    if (error instanceof AppError) {
        console.log(error.code); // 'INVALID_HEX_COLOR'
        console.log(error.severity); // 'error'
    }
}
```

**Error Codes:**
- `INVALID_HEX_COLOR` - Invalid hexadecimal color format
- `INVALID_RGB_VALUE` - RGB values outside 0-255 range

### DyeService / DyeDatabase

**Pattern: Throws `AppError` for initialization, returns `null` for lookups**

```typescript
// Initialization throws on failure
try {
    dyeService = new DyeService(invalidData);
} catch (error) {
    if (error instanceof AppError && error.code === ErrorCode.DATABASE_LOAD_FAILED) {
        // Database failed to load
    }
}

// Lookups return null when not found
const dye = dyeService.getDyeById(99999);
if (dye === null) {
    console.log('Dye not found');
}
```

**Error Codes:**
- `DATABASE_LOAD_FAILED` - Database failed to initialize (thrown)
- `DYE_NOT_FOUND` - Dye lookup returned no results (returns `null`)

### DyeSearch

**Pattern: Returns `null` or empty arrays for search failures**

```typescript
// Single result searches return null on failure
const closest = dyeService.findClosestDye('#INVALID');
if (closest === null) {
    console.log('No match found or invalid input');
}

// Multi-result searches return empty arrays
const matches = dyeService.findDyesByCategory('InvalidCategory');
console.log(matches.length); // 0
```

### APIService

**Pattern: Returns `null` for API failures, logs errors via logger**

```typescript
// API calls never throw - return null on failure
const price = await apiService.getPriceData(12345);
if (price === null) {
    console.log('Price data unavailable');
}

// Use ConsoleLogger to see error details
import { ConsoleLogger } from 'xivdyetools-core';
const apiService = new APIService({ logger: ConsoleLogger });
```

**Error Codes:**
- `API_CALL_FAILED` - Internal error (logged, not thrown)

### LocalizationService

**Pattern: Returns fallback values, throws on critical failures**

```typescript
// Missing translations return the key or English fallback
const name = LocalizationService.getDyeName(99999);
// Returns null if not found, not an error

// Locale loading failures throw
try {
    await LocalizationService.setLocale('invalid');
} catch (error) {
    if (error.code === ErrorCode.LOCALE_LOAD_FAILED) {
        // Invalid locale code
    }
}
```

## Error Handling Best Practices

### 1. Always check for null returns from lookup methods

```typescript
const dye = dyeService.getDyeById(id);
if (!dye) {
    // Handle missing dye gracefully
    return;
}
// Safe to use dye here
```

### 2. Wrap initialization in try-catch

```typescript
let dyeService: DyeService;
try {
    dyeService = new DyeService(dyeDatabase);
} catch (error) {
    if (error instanceof AppError) {
        // Log error with structured data
        console.error('Initialization failed:', error.toJSON());
    }
    throw error; // Re-throw if unrecoverable
}
```

### 3. Use AppError.toJSON() for logging

```typescript
catch (error) {
    if (error instanceof AppError) {
        const errorInfo = error.toJSON();
        // { name, code, message, severity, stack }
        logger.error(errorInfo);
    }
}
```

### 4. Check severity for error handling decisions

```typescript
catch (error) {
    if (error instanceof AppError) {
        switch (error.severity) {
            case 'critical':
                // Application should stop
                process.exit(1);
                break;
            case 'error':
                // Log and continue with fallback
                break;
            case 'warning':
                // Log only, operation may have partially succeeded
                break;
            case 'info':
                // Informational, not a real error
                break;
        }
    }
}
```

## Summary Table

| Service | Method Type | Error Pattern | Returns on Error |
|---------|-------------|---------------|------------------|
| ColorConverter | Conversion | Throws `AppError` | N/A |
| DyeDatabase | Initialization | Throws `AppError` | N/A |
| DyeDatabase | Lookup | Returns `null` | `null` |
| DyeSearch | Search | Returns `null`/`[]` | `null` or `[]` |
| APIService | API calls | Returns `null` | `null` |
| LocalizationService | Translation | Returns fallback | Key or English |
| LocalizationService | Initialization | Throws `AppError` | N/A |
