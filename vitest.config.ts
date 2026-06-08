import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Native Vite tsconfig path resolution (replaces vite-tsconfig-paths plugin)
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    // Integration tests hit the real VK API — generous timeout
    testTimeout: 30000,
    // Run test files sequentially to avoid Akaunting rate limiting (60 req/min)
    fileParallelism: false,
    // Run tests within each file sequentially
    sequence: {
      concurrent: false,
    },
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      exclude: ['src/lib/**/__tests__/**', 'src/lib/types/**', 'src/lib/i18n/locales/**'],
    },
  },
})
