import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // Os testes nunca devem depender de credenciais reais.
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      // server.js e instrumentacao.js só fazem wiring de processo. Os adaptadores
      // de banco externo são cobertos pelos testes de contrato, que rodam quando há
      // banco de teste (POSTGRES_TEST_URL no Jenkins; SUPABASE_TEST_* opcional).
      exclude: [
        'src/server.js',
        'src/instrumentacao.js',
        'src/infrastructure/supabase/**',
        'src/infrastructure/postgres/**',
      ],
      reporter: ['text', 'html', 'cobertura'],
      reportsDirectory: 'reports/coverage',
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
