# Piloto de autonomia controlada con SPECTRA

Este piloto separa tres afirmaciones distintas:

1. `spectra trace` comprueba enlaces declarados entre especificaciones y
   artefactos.
2. Jest ejecuta comportamiento del `CobroService`.
3. `spectra verify` comprueba que cada criterio de aceptacion requerido tiene
   un resultado ejecutado registrado.

Ninguna de ellas, por separado o en conjunto, certifica cumplimiento legal o
fiscal. El flujo de cobro sigue exigiendo revision humana.

## Archivos del piloto

```text
.spectra/11-acceptance-criteria.md
             |
             v
test/cobro.service.spec.ts  -- ejecutado por Jest
             |
             v
.spectra/evidence.json      -- resultado registrado por AC
             |
             v
spectra verify              -- gate que falla cerrado
```

La tarea de agente vive en
`.spectra/tasks/cobro-evidence-audit.json`. Su contexto se limita a
`.spectra/contexts/cobro-evidence-audit.json`; no entrega el repositorio
completo, secretos ni credenciales.

## Ejecutar ahora desde este workspace

La dependencia instalada de GastroFlow esta fijada a una instantanea de
SPECTRA 0.5.0 anterior a estos comandos. Mientras la nueva version no se
publique, se prueba el CLI fuente situado en el repositorio hermano:

```powershell
npx jest --config jest.config.ts --runInBand test/cobro.service.spec.ts
node ..\spectra\bin\spectra.js verify
node ..\spectra\bin\spectra.js agent plan `
  --task .spectra/tasks/cobro-evidence-audit.json `
  --context .spectra/contexts/cobro-evidence-audit.json `
  --provider dry-run `
  --output .spectra/agent-runs/cobro-evidence-audit.json
```

`verify` debe informar dos IDs requeridos y dos resultados `passed`.
`agent plan` debe informar cero escrituras, cero llamadas de red, cero lectura
de credenciales y aprobacion humana obligatoria.

El proveedor `dry-run` es determinista: valida el contrato, hashes, limites y
proveniencia, pero no llama a una IA. Con la proxima version instalada, los
dos comandos `node ..\spectra\bin\spectra.js` se reemplazan por
`npx spectra`.

## Limite de esta fase

- No hay un proveedor de modelo configurado.
- No hay constructor ni edicion automatica de codigo.
- No se ejecutan comandos obtenidos desde un modelo o desde `evidence.json`.
- No hay MCP, secretos, red, pull request, merge ni despliegue.
- Un resultado `passed` sigue necesitando procedencia de un runner confiable;
  el siguiente paso es generarlo automaticamente desde CI.

La siguiente fase debe conectar un proveedor de modelo exclusivamente para
planes de solo lectura, con presupuesto, registro de prompts y proteccion
contra instrucciones no confiables. Requiere una decision de arquitectura
separada antes de habilitarse.
