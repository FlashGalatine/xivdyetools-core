import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test execution settings
    globals: true,
    environment: 'node',

    // Coverage configuration
    coverage: {
      // Use v8 coverage provider (Istanbul/nyc style)
      provider: 'v8',

      // Enable multiple reporters for different use cases
      // - text: Terminal output for quick checks
      // - html: Detailed interactive report for analysis
      // - json: Raw data for CI/CD integration
      // - json-summary: Aggregate metrics for programmatic checks
      reporter: ['text', 'html', 'json', 'json-summary'],

      // Output directory for coverage reports
      reportsDirectory: './coverage',

      // Files to include in coverage analysis
      include: ['src/**/*.ts'],

      // Files to exclude from coverage
      exclude: [
        'src/**/*.test.ts', // Test files
        'src/**/__tests__/**', // Test directories
        'src/data/**', // JSON data files (no logic to test)
        'src/index.ts', // Barrel export file (low testing value)
        'src/constants/index.ts', // Constant exports (low testing value)
        '**/*.d.ts', // TypeScript declaration files
        '**/node_modules/**', // Dependencies
        '**/dist/**', // Build output
        '**/.{git,cache,output,temp}/**', // Version control and temp dirs
      ],

      // Coverage thresholds - BUILD FAILS if below these values
      // Minimum: 85% (enforced), Target: 95%+
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },

      // Additional coverage options
      all: true, // Include all files, even if not imported in tests
      clean: true, // Clean coverage directory before each run
      skipFull: false, // Show files with 100% coverage in reports

      // Per-file thresholds (disabled for now, enable for stricter enforcement)
      perFile: false,
    },

    // Test execution timeouts
    testTimeout: 10000, // 10 seconds per test
    hookTimeout: 10000, // 10 seconds for beforeEach/afterEach hooks
  },
});
