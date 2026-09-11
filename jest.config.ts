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
      statements: 35,  // Alineado con la cobertura base actual para mantener un gate útil en CI
      branches: 35,
      functions: 25,
      lines: 35,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
};

export default config;
