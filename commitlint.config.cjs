module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bug
        'docs',     // Documentación
        'style',    // Formato (no afecta lógica)
        'refactor', // Refactoring
        'test',     // Añadir/corregir tests
        'chore',    // Mantenimiento
        'ci',       // CI/CD
        'perf',     // Mejora de rendimiento
        'revert',   // Revertir commit
      ],
    ],
    'scope-enum': [
      1,
      'always',
      ['tpv', 'erp', 'contabilidad', 'crm', 'specs', 'devops', 'prisma', 'frontend'],
    ],
  },
};
