# Guía técnica de la CLI de SPECTRA

Esta guía describe SPECTRA 0.5.0 en GastroFlow. Usa `npm run` o `npx spectra`
para ejecutar la versión local fijada en `package.json`, no una instalación
global antigua.

```cmd
npm run spectra:status
npx spectra status
```

## Resumen

| Comando | Lee | Escribe | ¿Usa IA? |
| --- | --- | --- | --- |
| `spectra init` | — | `.spectra/`, prompt e instrucciones | No |
| `spectra status` | `.spectra/` | — | No |
| `spectra validate` | `.spectra/` | — | No |
| `spectra trace` | specs y código | `.spectra/12-trace.md` | No |
| `spectra verify` | capa 11 y evidencia registrada | — | No |
| `spectra agent plan` | tarea y contexto acotado | artefacto opcional | No, con proveedores incluidos |
| `spectra evolve --init-config` | plantilla | configuración de evolución | No |
| `spectra evolve --objective "..."` | gaps locales | `.spectra/evolution/` | No |
| `spectra evolution-status` | registro y auditoría | — | No |

## Comandos diarios

### `spectra status`

```cmd
npm run spectra:status
```

Muestra capas, contenido e IDs. Es una vista de estado: no demuestra que una
regla sea correcta ni que el código cumpla el comportamiento.

### `spectra validate`

```cmd
npm run spectra:validate
```

Comprueba las 13 capas, plantillas pendientes, IDs duplicados y referencias a
IDs no definidos. No valida normativa ni ejecuta pruebas de software.

### `spectra trace`

```cmd
npm run spectra:trace
```

Lee los IDs de `.spectra/00–11`, busca etiquetas como `@spectra BR-001` en el
código y actualiza `.spectra/12-trace.md`. Relaciona artefactos, criterios de
aceptación y etiquetas sin ID válido. La matriz es declarativa: una etiqueta no
sustituye una prueba.

### `spectra:demo`

```cmd
npm run spectra:demo
```

Es el atajo de GastroFlow:

```text
spectra validate
→ pruebas Jest de CobroService
→ spectra trace
```

El piloto cubre únicamente el cobro de servicio.

## Inicialización

```cmd
npx spectra init
```

Crea `.spectra/`, `SPECTRA-PROMPT.md` y `.instructions.md`. No lo ejecutes en
GastroFlow: ya existe `.spectra/` y la CLI se detiene para evitar sobrescribirla.

## Evolución controlada y “superagentes”

Los “superagentes” de SPECTRA 0.5.0 no son agentes de IA que editan archivos o
envían pull requests. Son definiciones JSON de especialistas y planes
estructurados, creados por un motor local determinista.

```text
gaps locales
  → Meta-Intelligence: agrupa capacidades
  → Architect: selecciona roles
  → Agent Factory: crea candidatos declarativos
  → Structured Sandbox: hallazgos y planes sin efectos externos
  → Evaluator: compara con un baseline
  → Registry: promociona, rechaza o retira versiones
```

Los roles posibles incluyen análisis de fallos de tests, auditoría de trazas
inversas, aseguramiento de invariantes y planificación de implementación. No
arreglan código por sí solos.

### Preparar configuración

```cmd
npx spectra evolve --init-config
```

Crea `.spectra/evolution.config.json`. La política de seguridad bloquea red,
credenciales, escrituras de código, MCP, pull requests y re-ejecución.

### Ejecutar una evolución

```cmd
npx spectra evolve --objective "Cerrar gaps críticos de evidencia" --iterations 3
```

Lee solamente fuentes locales: `.spectra/12-trace.md`,
`.spectra/coverage-map.json` y `.spectra/allure-summary.json`. Escribe sus
resultados en `.spectra/evolution/`:

```text
registry.json       versiones y agentes activos
audit.jsonl         cadena de auditoría SHA-256
runs/<run-id>/      registro completo de ejecución
```

Un candidato solo puede variar `capabilities`, `instructions` y `strategy`.
No modifica código fuente automáticamente.

### Consultar auditoría

```cmd
npx spectra evolution-status
```

Verifica la cadena de auditoría y muestra las versiones activas.

## Evidencia ejecutada y planificación segura

La versión fuente nueva añade dos comandos. Hasta que se publique e instale,
ejecútalos desde el repositorio hermano:

```powershell
node ..\spectra\bin\spectra.js verify
node ..\spectra\bin\spectra.js agent plan `
  --task .spectra/tasks/cobro-evidence-audit.json `
  --context .spectra/contexts/cobro-evidence-audit.json `
  --provider dry-run `
  --output .spectra/agent-runs/cobro-evidence-audit.json
```

`verify` exige por defecto evidencia `passed` para todos los AC de la capa 11.
También acepta un alcance explícito con `--require AC-001,AC-002`. Solo valida
el registro `.spectra/evidence.json`; no ejecuta el comando escrito dentro.

`agent plan` valida una tarea, un contexto limitado y su proveniencia. Los
proveedores incluidos son `dry-run` y `null`: ninguno llama a IA ni puede
escribir código, acceder a red, ejecutar shell o leer credenciales. El plan
requiere aprobación humana.

Consulta [`SPECTRA-AUTONOMY-PILOT.md`](SPECTRA-AUTONOMY-PILOT.md) para ejecutar
el recorrido completo.

## ¿Cuándo interviene una IA?

La CLI no llama a OpenAI, Claude, Gemini ni a ningún endpoint. No necesita API
key ni conexión de red para sus comandos normales.

La IA interviene fuera de la CLI, cuando una persona entrega
`SPECTRA-PROMPT.md` a un modelo para proponer especificaciones o cuando da a un
agente de programación acceso a `.spectra/`. En GastroFlow, ese agente debe
seguir `AGENTS.md`; la CLI valida y registra resultados, pero no sustituye al
agente ni a la revisión humana.

## Recomendación para GastroFlow

El piloto actual no tiene gaps. Ejecutar `evolve` ahora no arreglaría nada ni
generaría código; como mucho produciría una evaluación de objetivo no medido.

Para el siguiente dominio migrado:

```text
actualizar .spectra/
→ spectra validate
→ crear o actualizar pruebas
→ modificar código con @spectra
→ ejecutar pruebas
→ spectra trace
```
