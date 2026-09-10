# INV-04.7 — Contrato de API y Documentación Swagger

> **Dominio**: Arquitectura / Documentación técnica  
> **Agentes afectados**: Todos (AG-001 a AG-007) — aplica a cada evolutivo  
> **Referencia cruzada**: [specs/12-documentacion/api-contract.md](../12-documentacion/api-contract.md)  
> **Schema source**: `src/common/swagger/swagger-schemas.ts`

---

## Instrucciones para la IA Agéntica

> Estas invariantes son transversales a todos los módulos.  
> **Se comprueban en CADA evolutivo que crea o modifica un endpoint de API.**  
> Si se viola alguna de estas invariantes, el evolutivo no está completo.

---

## INV-API-001 — Todo endpoint tiene documentación Swagger completa

```
∀ método HTTP registrado en NestJS:
  existe(@ApiOperation) ∧ summary ≠ "" ∧ description ≠ ""
```

**Qué debe incluir `@ApiOperation.description`:**
- Código de Historia de Usuario afectada (`HU-MX-XXX-00N`) si es funcional
- Codes de Skills involucrados (`SK-XXX`) si el endpoint delega en uno
- Invariantes de dominio que el endpoint respeta o puede violar (`INV-XXX`)

**Consecuencias de violación**: Swagger UI incompleto. La IA agéntica no puede razonar sobre el endpoint en futuros evolutivos.

---

## INV-API-002 — Respuestas documentadas

```
∀ endpoint con respuesta de datos:
  existe(@ApiOkResponse ∨ @ApiCreatedResponse) ∧ description ≠ ""
```

**Regla adicional**: Si la respuesta tiene schema reutilizable (devuelto por más de un endpoint), DEBE estar declarada como clase en `src/common/swagger/swagger-schemas.ts` con `@ApiProperty` en cada propiedad.

---

## INV-API-003 — Endpoints protegidos tienen `@ApiBearerAuth`

```
∀ endpoint con @UseGuards(JwtAuthGuard):
  controller tiene @ApiBearerAuth('JWT') ∨ metodo tiene @ApiBearerAuth('JWT')
```

**Consecuencia de violación**: El botón "Authorize" de Swagger UI no afecta a ese endpoint. Los tests manuales fallan en Swagger.

---

## INV-API-004 — Shapes de respuesta reutilizables centralizados

```
∀ DTO de respuesta usado en ≥ 2 endpoints:
  está declarado en src/common/swagger/swagger-schemas.ts
```

**Consecuencia de violación**: Duplicación de schemas; riesgo de inconsistencia entre documentación y implementación real.

---

## INV-API-005 — Operaciones fiscales citan invariantes fiscales

```
∀ endpoint que genera ticket | factura | asiento | liquidación IVA:
  @ApiOperation.description contiene ≥1 referencia a INV-00X (fiscales)
```

**Pourquoi**: Sin esta referencia, la IA agéntica puede ignorar restricciones fiscales críticas (INV-001 numeración, INV-007 VeriFactu, INV-004/005/006 IVA) al implementar los evolutivos.

---

## INV-API-006 — Nuevos tags registrados en `main.ts`

```
∀ @ApiTags('NombreTag') nuevo:
  main.ts contiene .addTag('NombreTag') con descripción
```

---

## Workflow de validación (para la IA agéntica)

Antes de cerrar cualquier evolutivo de API, ejecutar mentalmente este checklist:

```
EVOLUTIVO: [nombre del evolutivo]
  □ INV-API-001: @ApiOperation con summary + description (HU + SK + INV citados)
  □ INV-API-002: @ApiOkResponse o @ApiCreatedResponse con description
  □ INV-API-003: @ApiBearerAuth si el endpoint usa JwtAuthGuard
  □ INV-API-004: DTO de respuesta en swagger-schemas.ts si es reutilizable
  □ INV-API-005: Si genera doc fiscal → cita INV-00X en description
  □ INV-API-006: Si nuevo tag → registrado en main.ts con .addTag()
  □ EXTRA: Tabla de api-contract.md actualizada con el nuevo endpoint
  □ EXTRA: npm run build sin errores TypeScript
```

---

## Ejemplo de endpoint correcto (plantilla)

```typescript
@Get('servicio/:id/cuenta')
@ApiOperation({
  summary: 'Calcular cuenta del servicio',
  description: `
    Suma todos los importes de líneas activas del servicio.
    HU-M1-COB-001. SK-003.
    Respeta INV-002 (total = suma líneas) e INV-003 (IVA = suma por tipo).
    El resultado es idempotente: no modifica estado.
  `,
})
@ApiParam({ name: 'id', description: 'UUID del servicio de mesa' })
@ApiOkResponse({ description: 'Cuenta calculada correctamente', type: CuentaResponse })
@ApiNotFoundResponse({ description: 'Servicio no encontrado' })
calcularCuenta(@Param('id') id: string) { ... }
```

---

## Historial de versiones

| Fecha | Cambio |
|-------|--------|
| 2026-03-15 | Creación inicial — INV-API-001 a INV-API-006 |
