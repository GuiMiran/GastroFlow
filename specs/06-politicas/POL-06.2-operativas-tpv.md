# 06.2 — Políticas Operativas del TPV

> **Sección**: 06.2 de Capa 06 — Políticas de Decisión  
> **Dominio**: Operativas TPV / Sala  
> **Total políticas**: 5 (POL-010 a POL-014)  
> **Agentes**: AG-001 AgenteTPV  
> **Fecha**: 2026-03-14

---

**POL-010: Destino de las líneas de comanda**  
```
SI el producto pertenece a categoría "Cocina" (platos, entrantes, postres) → Enviar a pantalla COCINA
SI_NO SI el producto pertenece a categoría "Barra" (bebidas, cafés, cócteles) → Enviar a pantalla BARRA
SI_NO SI el producto pertenece a ambas categorías → Enviar a AMBOS destinos
SI_NO → No enviar a ningún destino (producto directo, ej: pan de cortesía)
```
- Referencia: HU-012, HU-013

**POL-011: Autorización para anular comanda en preparación**  
```
SI la comanda está en estado "enviada" (no ha empezado a prepararse) → Camarero puede anular directamente
SI_NO SI la comanda está en estado "en preparación" o "lista" → Requiere clave de encargado/gerente
SI_NO SI la comanda está en estado "servida" y no cobrada → Requiere clave de gerente + motivo documentado
SI_NO SI ya está cobrada → No se puede anular. Usar factura rectificativa (OP-033)
```
- Referencia: OP-003, RN-035

**POL-012: División de cuenta — Método de redondeo**  
```
SI se divide a partes iguales y no es exacto → 
    Los primeros N-1 tickets llevan el valor truncado a 2 decimales.
    El último ticket lleva el resto para que la suma sea exacta.
    Ejemplo: 100€ entre 3 → 33,33€ + 33,33€ + 33,34€
```
- Referencia: INV-013

**POL-013: Cuándo mostrar alerta de alérgenos**  
```
SI un producto de la comanda contiene algún alérgeno registrado → Mostrar icono de alerta en la línea de comanda
SI_NO SI el producto no tiene alérgenos configurados → Mostrar advertencia "Alérgenos no configurados" (para que el propietario lo complete)
```
- Referencia: RN-070

**POL-014: Gestión de propinas en el cobro**  
```
SI el cliente declara propina voluntaria → Registrar como propina (NO incluir en base imponible del ticket, NO cobrar IVA sobre ella)
SI_NO SI hay cargo por servicio obligatorio en carta → Incluir en base imponible del ticket y cobrar IVA
```
- Referencia: RN-037

---

### Trazabilidad

| POL | Skills que la aplican | Reglas | Invariantes | HU relacionadas |
|-----|-----------------------|--------|-------------|-----------------|
| POL-010 | SK-002 | — | — | HU-M1-CMD-001, HU-M1-CMD-003 |
| POL-011 | — | RN-035 | — | HU-M1-CMD-004 |
| POL-012 | SK-004 | RN-034 | INV-013 | HU-M1-COB-002 |
| POL-013 | SK-002, SK-067 | RN-070 | — | HU-M2-CAT-003 |
| POL-014 | SK-005 | RN-037 | — | HU-M1-COB-001 |
