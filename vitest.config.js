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
      // server.js só faz wiring de processo; o adaptador Supabase é coberto pelos
      // testes de contrato quando há banco de teste (tests/contrato/supabase.test.js).
      exclude: ['src/server.js', 'src/infrastructure/supabase/**'],
      reporter: ['text', 'html', 'cobertura'],
      reportsDirectory: 'reports/coverage',
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
