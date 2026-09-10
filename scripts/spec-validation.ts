/**
 * spec-validation.ts — Stage SDD del pipeline
 *
 * Cruza las specs modularizadas con los tests existentes para verificar
 * que cada criterio de aceptación implementado tiene cobertura de tests.
 *
 * Uso: npx tsx scripts/spec-validation.ts
 * Salida: resumen + exit code 0 (ok) o 1 (fallo si Must sin test)
 */
import * as fs from 'fs';
import * as path from 'path';

const SPECS_DIR = path.resolve(__dirname, '..', 'specs');
const TEST_DIR = path.resolve(__dirname, '..', 'test');

function collectFilesRecursively(dir: string, predicate: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFilesRecursively(entryPath, predicate);
    return predicate(entry.name) ? [entryPath] : [];
  });
}

// ──────────────────────────────────────
// 1. Leer AC IDs de las specs
// ──────────────────────────────────────
function extractACIds(dir: string): string[] {
  const acDir = path.join(dir, '11-criterios-aceptacion');
  const ids: string[] = [];

  if (!fs.existsSync(acDir)) {
    console.error('No se encontró directorio de criterios de aceptación');
    return ids;
  }

  const files = collectFilesRecursively(acDir, (file) => file.startsWith('AC-'));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/AC-\d{3}/g);
    if (matches) {
      ids.push(...new Set(matches));
    }
  }

  return [...new Set(ids)].sort();
}

// ──────────────────────────────────────
// 2. Leer AC IDs de los tests
// ──────────────────────────────────────
function extractTestedACIds(dir: string): string[] {
  const ids: string[] = [];

  if (!fs.existsSync(dir)) {
    console.error('No se encontró directorio de tests');
    return ids;
  }

  const files = collectFilesRecursively(dir, (file) => file.endsWith('.spec.ts'));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/AC-\d{3}/g);
    if (matches) {
      ids.push(...new Set(matches));
    }
  }

  return [...new Set(ids)].sort();
}

// ──────────────────────────────────────
// 3. Extraer RN IDs de specs y tests
// ──────────────────────────────────────
function extractRNIds(dir: string): string[] {
  const rnDir = path.join(dir, '03-reglas-negocio');
  const ids: string[] = [];

  if (!fs.existsSync(rnDir)) return ids;

  const files = collectFilesRecursively(rnDir, (file) => file.startsWith('RN-'));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/RN-\d{3}/g);
    if (matches) {
      ids.push(...new Set(matches));
    }
  }

  return [...new Set(ids)].sort();
}

function extractTestedRNIds(dir: string): string[] {
  const ids: string[] = [];

  if (!fs.existsSync(dir)) return ids;

  const files = collectFilesRecursively(dir, (file) => file.endsWith('.spec.ts'));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/RN-\d{3}/g);
    if (matches) {
      ids.push(...new Set(matches));
    }
  }

  return [...new Set(ids)].sort();
}

// ──────────────────────────────────────
// 4. Ejecutar validación
// ──────────────────────────────────────
function main(): void {
  console.log('═══════════════════════════════════════════');
  console.log('  SPEC VALIDATION — GastroFlow SDD Pipeline');
  console.log('═══════════════════════════════════════════\n');

  // AC coverage
  const specACs = extractACIds(SPECS_DIR);
  const testedACs = extractTestedACIds(TEST_DIR);
  const missingACs = specACs.filter((id) => !testedACs.includes(id));
  const coveredACs = specACs.filter((id) => testedACs.includes(id));

  const acCoverage = specACs.length > 0 ? ((coveredACs.length / specACs.length) * 100).toFixed(1) : '0';

  console.log('📋 CRITERIOS DE ACEPTACIÓN (AC)');
  console.log(`   Especificados: ${specACs.length}`);
  console.log(`   Con test:      ${coveredACs.length}`);
  console.log(`   Sin test:      ${missingACs.length}`);
  console.log(`   Cobertura:     ${acCoverage}%`);

  if (missingACs.length > 0) {
    console.log(`   ⚠️  Sin test:   ${missingACs.join(', ')}`);
  }

  // RN coverage
  const specRNs = extractRNIds(SPECS_DIR);
  const testedRNs = extractTestedRNIds(TEST_DIR);
  const coveredRNs = specRNs.filter((id) => testedRNs.includes(id));

  const rnCoverage = specRNs.length > 0 ? ((coveredRNs.length / specRNs.length) * 100).toFixed(1) : '0';

  console.log('\n📋 REGLAS DE NEGOCIO (RN)');
  console.log(`   Especificadas: ${specRNs.length}`);
  console.log(`   Con test:      ${coveredRNs.length}`);
  console.log(`   Cobertura:     ${rnCoverage}%`);

  // INV coverage
  const testedINVs: string[] = [];
  if (fs.existsSync(TEST_DIR)) {
    const testFiles = collectFilesRecursively(TEST_DIR, (file) => file.endsWith('.spec.ts'));
    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/INV-\d{3}/g);
      if (matches) testedINVs.push(...new Set(matches));
    }
  }

  console.log('\n📋 INVARIANTES (INV)');
  console.log(`   Con test:      ${[...new Set(testedINVs)].length}`);

  // Resumen
  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════');

  const totalSpec = specACs.length + specRNs.length;
  const totalTested = coveredACs.length + coveredRNs.length;
  const totalCoverage = totalSpec > 0 ? ((totalTested / totalSpec) * 100).toFixed(1) : '0';

  console.log(`   Total artefactos spec:  ${totalSpec}`);
  console.log(`   Total con test:         ${totalTested}`);
  console.log(`   Cobertura global spec:  ${totalCoverage}%`);

  // Umbral: por ahora informativo, en el futuro se puede poner un gate
  const UMBRAL_AC = 30; // % mínimo de AC con test para pasar
  if (parseFloat(acCoverage) < UMBRAL_AC) {
    console.log(`\n⚠️  ADVERTENCIA: Cobertura AC (${acCoverage}%) por debajo del umbral (${UMBRAL_AC}%)`);
    console.log('   El pipeline NO falla por esto aún (fase de adopción).');
    console.log('   Cuando se alcance >50%, activar gate obligatorio.\n');
  } else {
    console.log(`\n✅ Cobertura AC por encima del umbral (${UMBRAL_AC}%)\n`);
  }

  // Exit 0 siempre durante fase de adopción
  // Cambiar a process.exit(1) cuando se quiera gate obligatorio
  process.exit(0);
}

main();
