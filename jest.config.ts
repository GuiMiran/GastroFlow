import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*(?<!integration)\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/common/events/**/*.ts',
    'src/common/prisma/**/*.ts',
    'src/common/types/iva.ts',
    'src/modules/auth/**/*.service.ts',
    'src/modules/contable/**/*.service.ts',
    'src/modules/empleado/**/*.service.ts',
    'src/modules/tpv/services/**/*.ts',
    'src/modules/verifactu/**/*.service.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
};

export default config;
