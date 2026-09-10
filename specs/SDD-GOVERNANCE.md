# Catalogo SDD Spectra

> Demo de uso e implementacion del catalogo Spec Driven Development (SDD) de Spectra en GastroFlow.
> Norma operativa para mantener GastroFlow como un producto dirigido por especificaciones.
> Última revisión: 2026-09-10

## Identidad de la demo

GastroFlow implementa el catalogo SDD de Spectra como demostracion funcional. La marca de agua `SPECTRA | SDD DEMO` se muestra en la aplicacion para identificar este entorno y no altera los flujos operativos.

## Orden de autoridad

1. Las invariantes de la capa 04 restringen cualquier decisión de diseño, código o prueba.
2. Las reglas de negocio (03), contratos (05) y políticas (06) definen el comportamiento esperado.
3. Las historias (02) y sus criterios de aceptación (11) describen el resultado verificable.
4. Los eventos (07), agentes (08), skills (09) y workflows (10) orquestan ese comportamiento.
5. El código y las pruebas implementan y demuestran la especificación; no la sustituyen.

## Fuentes de verdad

| Artefacto | Fuente canónica | Vista de navegación |
|-----------|-----------------|---------------------|
| Especificación de dominio | Capas 00 a 11 | SPEC-INDEX.md e índices de capa |
| Contrato HTTP | specs/12-documentacion/api-contract.md | Swagger generado por la API |
| Cobertura de aceptación | IDs AC/RN/INV en test/ | scripts/spec-validation.ts |
| Arquitectura ejecutable | src/, prisma/ y frontend/src/ | docs/ARCHITECTURE.md |

Los archivos marcados como `[DEPRECATED]` son solo referencia histórica. No se añaden IDs nuevos en ellos.

## Flujo obligatorio de cambio

1. Crear o actualizar la historia, sus AC y las reglas e invariantes aplicables.
2. Registrar el ID nuevo en el índice de la capa antes de usarlo en otras capas.
3. Escribir una prueba que cite los IDs AC, RN o INV que demuestra.
4. Implementar el cambio mínimo en `src/`, `prisma/` o `frontend/src/`.
5. Ejecutar `npm run spec:validate`, las pruebas afectadas y el typecheck correspondiente.

## Convenciones de catálogo

- Un ID representa un único concepto y solo puede tener una definición canónica.
- Un ID referenciado debe existir en su capa antes de integrarse en otra.
- Un criterio `Must` debe tener, como mínimo, una prueba trazable antes de considerarse implementado.
- AG-009 mantiene la trazabilidad, pero sus IDs `SK-080..084`, `RN-DOC-*` e `INV-DOC-*` son propuestas hasta que se publiquen en sus catálogos de capa.