import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*(?<!integration)\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/common/events/domain-events.ts',
    'src/common/prisma/prisma.service.ts',
    'src/common/types/iva.ts',
    'src/modules/auth/auth.service.ts',
    'src/modules/contable/asiento.service.ts',
    'src/modules/empleado/empleado.service.ts',
    'src/modules/tpv/services/caja.service.ts',
    'src/modules/tpv/services/cobro.service.ts',
    'src/modules/tpv/services/comanda.service.ts',
    'src/modules/tpv/services/kds.service.ts',
    'src/modules/tpv/services/mesa.service.ts',
    'src/modules/verifactu/verifactu.service.ts',
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
