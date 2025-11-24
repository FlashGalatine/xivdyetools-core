# Testing Strategy

**Per R-5: Integration Testing**

## Overview

This document describes the testing strategy for `xivdyetools-core`, including unit tests, integration tests, and performance benchmarks.

## Test Structure

### Unit Tests
- Located in: `src/**/__tests__/`
- Purpose: Test individual functions and methods in isolation
- Coverage: All service methods, utilities, and type validators

### Integration Tests
- Located in: `src/__tests__/integration/`
- Purpose: Test complete workflows and service interactions
- Files:
  - `harmony-workflow.test.ts` - Tests complete harmony generation pipeline
  - `color-conversion-pipeline.test.ts` - Tests color format conversions
  - `dye-matching-workflow.test.ts` - Tests dye matching and search

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests Only
```bash
npm test -- src/__tests__/integration/
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Coverage Goals

- **Unit Tests:** > 85% coverage
- **Integration Tests:** All critical workflows covered
- **Performance Tests:** All benchmarks passing

## Integration Test Scenarios

### Harmony Workflow
1. Generate complementary harmony
2. Generate triadic harmony
3. Generate analogous harmony
4. Generate all harmony types
5. Performance: Harmony generation speed
6. Quality: Harmony color distance validation

### Color Conversion Pipeline
1. Hex → RGB → HSV → RGB → Hex round trip
2. Color distance calculation consistency
3. Colorblindness simulation pipeline
4. Performance: Caching effectiveness
5. Edge cases: Boundary values, invalid inputs

### Dye Matching Workflow
1. Color to dye matching
2. Dye search and retrieval
3. Performance: Matching speed
4. Quality: Exact match detection
5. Edge cases: Dark, light, saturated colors

## Performance Benchmarks

All performance tests are located in integration test files and measure:
- Color conversion speed (< 1ms per conversion)
- Dye matching speed (< 10ms per match)
- Harmony generation speed (< 50ms per harmony set)
- Cache effectiveness (50%+ speedup)

## CI/CD Integration

Integration tests run automatically on:
- Push to `main` branch
- Pull requests
- Manual workflow dispatch

See `.github/workflows/integration-tests.yml` for configuration.

## Best Practices

1. **Test Isolation:** Each test should be independent
2. **Clear Assertions:** Use descriptive expect messages
3. **Performance Targets:** Set realistic but challenging targets
4. **Edge Cases:** Test boundary conditions and error cases
5. **Documentation:** Document complex test scenarios

## Future Enhancements

- Visual regression testing for color outputs
- Load testing for high-volume scenarios
- Memory leak detection
- Cross-browser testing (for browser builds)

