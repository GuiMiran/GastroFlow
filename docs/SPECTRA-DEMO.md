# SPECTRA demo — cobro de servicio

Este piloto integra una instantánea reproducible de SPECTRA 0.5.0 con un flujo
real de GastroFlow. La dependencia está fijada al commit `7237625` mediante un
archivo fuente de GitHub mientras esa versión no esté publicada en npm. No
intenta migrar de una vez las especificaciones históricas de `specs/`.

## Qué demuestra

```text
.spectra/00–11
      ↓ valida estructura y referencias
npm run spectra:validate
      ↓
CobroService + pruebas Jest
      ↓ declara relaciones y aporta evidencia independiente
npm run spectra:trace
      ↓
.spectra/12-trace.md
```

El flujo elegido es `CobrarServicio`: pago suficiente, cambio, ticket,
VeriFactu, cierre del servicio y liberación de la mesa.

## Ejecutar la demo

```powershell
npm install
npm run spectra:status
npm run spectra:validate
npx jest --config jest.config.ts --runInBand test/cobro.service.spec.ts
npm run spectra:trace
```

O ejecutar todo el recorrido:

```powershell
npm run spectra:demo
```

## Cómo leer el resultado

- `spectra:validate` comprueba archivos, IDs y referencias; no confirma que una
  regla fiscal sea jurídicamente correcta.
- Jest aporta la evidencia de comportamiento.
- `spectra:trace` comprueba declaraciones `@spectra` y actualiza la matriz; una
  declaración no sustituye a las pruebas.

## Convivencia temporal

- `.spectra/`: formato actual, canónico para el piloto de cobro.
- `specs/`: catálogo histórico, todavía canónico para los demás dominios.

La siguiente migración debe seleccionar otro flujo acotado, trasladar sus
reglas y pruebas, y solo entonces declararlo canónico en `.spectra/`.

Para el detalle de cada comando y del modo de evolución controlada, consulta
[`SPECTRA-CLI.md`](SPECTRA-CLI.md).

La separacion entre trazabilidad, evidencia ejecutada y planificacion segura
se demuestra en [`SPECTRA-AUTONOMY-PILOT.md`](SPECTRA-AUTONOMY-PILOT.md).
