import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*(?<!integration)\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',              // Excluir bootstrap
    '!src/**/*.module.ts',       // Excluir módulos (poca lógica)
    '!src/**/*.dto.ts',          // Excluir DTOs (solo tipos)
    '!src/**/*.interface.ts',    // Excluir interfaces
    '!src/**/*.types.ts',        // Excluir types
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 38,  // Baseline real del repo para evitar falsos rojos en CI
      branches: 38,
      functions: 30,
      lines: 38,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
};

export default config;
