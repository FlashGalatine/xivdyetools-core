# Testing Strategy

**Per R-5: Integration Testing**

## Overview

This document outlines the testing strategy for the `xivdyetools-core` library, including unit tests, integration tests, and performance benchmarks.

## Test Structure

### Unit Tests
- **Location:** `src/**/*.test.ts` (alongside source files)
- **Purpose:** Test individual functions and methods in isolation
- **Coverage:** Core functionality, edge cases, error handling

### Integration Tests
- **Location:** `src/__tests__/integration/`
- **Purpose:** Test complete workflows combining multiple services
- **Files:**
  - `color-conversion-pipeline.test.ts` - Color conversion workflows
  - `dye-matching-workflow.test.ts` - Dye matching workflows
  - `harmony-workflow.test.ts` - Color harmony generation
  - `end-to-end-workflow.test.ts` - Complete end-to-end workflows
  - `performance-benchmarks.test.ts` - Performance testing

## Test Categories

### 1. Color Conversion Pipeline Tests
Tests the complete color conversion workflow:
- Hex → RGB → HSV → RGB → Hex round trips
- Color distance calculations
- Colorblindness simulation
- Cache performance

**Key Assertions:**
- Conversions maintain accuracy
- Round trips return original values
- Cache provides 60-80% speedup
- All formats are valid

### 2. Dye Matching Workflow Tests
Tests dye database operations:
- Color to dye matching
- Dye search and retrieval
- Batch operations
- Data consistency

**Key Assertions:**
- Matches are accurate (< 500 distance)
- All dyes have required fields
- Batch operations are efficient
- Results are consistent

### 3. Harmony Generation Tests
Tests color harmony generation:
- All harmony types (triadic, complementary, etc.)
- Harmony quality and validity
- Performance with hue-indexed lookups

**Key Assertions:**
- Harmonies are valid dyes
- Harmony relationships are correct
- Performance targets met (< 20ms per harmony)
- No duplicate dyes in results

### 4. End-to-End Workflow Tests
Tests complete user workflows:
- Match → Harmony → Colorblind simulation
- Multi-step color analysis
- Data consistency across operations

**Key Assertions:**
- Complete workflows succeed
- All intermediate steps are valid
- Performance targets met (< 50ms per workflow)
- Data remains consistent

### 5. Performance Benchmarks
Tests performance targets:
- Color conversion speed (< 0.1ms)
- Dye matching speed (< 5ms)
- Harmony generation speed (< 20ms)
- Cache hit rates (> 60%)

**Key Assertions:**
- All operations meet performance targets
- Cache provides significant speedup
- Batch operations scale well
- Memory usage is reasonable

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests Only
```bash
npm run test:integration
```

### Performance Benchmarks
```bash
npm run test -- src/__tests__/integration/performance-benchmarks.test.ts
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## CI/CD Integration

Integration tests run automatically on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Workflow:** `.github/workflows/integration-tests.yml`

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Build project
5. Run integration tests
6. Run performance benchmarks
7. Generate coverage report
8. Upload coverage to Codecov

## Performance Targets

Based on optimization goals:

| Operation | Target | Test |
|-----------|--------|------|
| Hex → RGB conversion | < 0.1ms | ✅ |
| RGB → HSV conversion | < 0.1ms | ✅ |
| Dye matching | < 5ms | ✅ |
| Harmony generation | < 20ms | ✅ |
| Complete workflow | < 50ms | ✅ |
| Cache hit rate | > 60% | ✅ |

## Coverage Goals

- **Unit Tests:** > 85% coverage
- **Integration Tests:** > 70% coverage
- **Overall:** > 80% coverage

## Best Practices

1. **Test Real Workflows**
   - Test complete user scenarios, not just isolated functions
   - Include error paths and edge cases

2. **Performance Testing**
   - Use realistic data volumes
   - Test both cache hits and misses
   - Measure actual performance, not just functionality

3. **Data Consistency**
   - Verify results are consistent across multiple runs
   - Test that operations don't corrupt data
   - Ensure thread-safety (if applicable)

4. **Error Handling**
   - Test error recovery
   - Verify error messages are helpful
   - Ensure errors don't crash the system

## Future Enhancements

- [ ] Load testing with concurrent requests
- [ ] Memory leak detection
- [ ] Stress testing with large datasets
- [ ] Browser compatibility testing
- [ ] Visual regression testing (for color accuracy)
