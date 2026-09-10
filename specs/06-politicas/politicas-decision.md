> **⚠️ DEPRECATED** — Este archivo ha sido modularizado.  
> Consultar `_index.md` y los archivos `POL-06.*.md` en este directorio.

# CAPA 06 — POLÍTICAS DE DECISIÓN

> Reglas de decisión condicionales: SI/ENTONCES  
> Tablas de decisión para lógica compleja  
> Formato: `POL-XXX: SI [condición] ENTONCES [acción] SI_NO [alternativa]`

---

## 06.1 — Políticas Fiscales — Determinación de IVA

**POL-001: Determinación del tipo de IVA de un producto**  

| Condición: Naturaleza del producto | Tipo IVA | Cuota |
|-----------------------------------|----------|-------|
| Bebida alcohólica (cerveza, vino, sidra, licor, combinado, cóctel) | General | 21% |
| Comida elaborada servida en local (platos, tapas, raciones, menús) | Reducido | 10% |
| Bebida no alcohólica servida en local (café, refrescos, agua, zumos, infusiones) | Reducido | 10% |
| Pan común, leche, quesos, huevos, frutas, verduras, legumbres vendidos sin elaborar | Superreducido | 4% |
| Bebida alcohólica para llevar (botella vino tienda) | General | 21% |
| Comida para llevar (take-away sin servicio de mesa) | Según naturaleza | 10% (servicio preparación) |
| Servicio no alimentario (alquiler de espacio, eventos) | General | 21% |

- Referencia: RN-001
- **Regla de resolución**: SI hay duda → aplicar tipo general (21%) como tipo más seguro para Hacienda.

**POL-002: Factura simplificada vs completa**  
```
SI el cliente solicita factura completa → Emitir factura completa (OP-006)
SI_NO SI el importe > 3.000€ → Emitir factura completa obligatoriamente (RN-012)
SI_NO SI el destinatario es Administración Pública → Emitir factura completa
SI_NO → Emitir factura simplificada (ticket)
```
- Referencia: RN-010, RN-012

**POL-003: Factura rectificativa — ¿Sustitución o diferencias?**  
```
SI se anulan TODOS los conceptos de la factura original → Rectificativa por sustitución
SI_NO SI se corrige solo parte (devolver 1 plato de 5) → Rectificativa por diferencias
SI_NO SI es error en datos (NIF incorrecto) → Rectificativa por sustitución
```
- Referencia: RN-016

**POL-004: ¿Debe declararse un proveedor en el Modelo 347?**  
```
SI total operaciones con el proveedor en el año natural (IVA incluido) > 3.005,06€ → SÍ, incluir en 347
SI_NO → NO declarar
```
- Referencia: RN-022
- **Excepción**: SI el establecimiento está en SII → NO presenta 347 (POL-005).

**POL-005: ¿Está obligado el establecimiento al SII?**  
```
SI facturación anual del establecimiento > 6.014.060,10€ → SÍ, obligado a SII
SI_NO SI se opta voluntariamente → SÍ
SI_NO → NO, declaración trimestral normal (303)
```
- Referencia: RN-025

**POL-006: ¿Aplicar recargo de equivalencia?**  
```
SI el titular es persona física (autónomo) Y vende productos sin transformar (tienda) → SÍ, aplicar recargo
SI_NO SI el titular es sociedad (SL, SA) → NO
SI_NO SI la actividad es hostelería/restauración (prestación de servicios) → NO
```
- Referencia: RN-004

**POL-007: Retención del alquiler del local**  
```
SI el local es alquilado → Retener 19% al arrendador y declarar en Modelo 115
SI_NO SI el local es propio → No hay retención de alquiler
EXCEPCIÓN: SI el arrendador tiene más de 10 inmuebles alquilados → No retener
EXCEPCIÓN: SI la renta anual del inmueble < 900€ → No retener
```
- Referencia: RN-024

---

## 06.2 — Políticas Operativas del TPV

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

## 06.3 — Políticas de Inventario

**POL-020: Producto sin escandallo — ¿Descontar stock?**  
```
SI el producto vendido no tiene escandallo asignado → No descontar stock. Registrar advertencia en log para que el propietario configure el escandallo.
SI_NO → Descontar ingredientes según escandallo.
```
- Referencia: OP-023

**POL-021: Stock llega a nivel mínimo**  
```
SI stock_actual de ingrediente ≤ stock_mínimo → Generar alerta de reposición visible en backoffice.
SI_NO SI stock_actual < 0 (teórico) → Generar alerta URGENTE: stock negativo, posible desfase.
```
- Referencia: RN-040, HU-051

**POL-022: Actualización de precio de coste**  
```
SI se registra nueva factura de compra con precio diferente al registrado → Actualizar precio de coste del ingrediente al nuevo precio.
SI_NO SI se quiere mantener precio medio ponderado → precio = (stock_anterior × precio_anterior + cantidad_nueva × precio_nuevo) / (stock_anterior + cantidad_nueva)
```
- Referencia: RN-044
- **Decisión de negocio**: El propietario elige en configuración si usa "último precio" o "precio medio ponderado".

---

## 06.4 — Políticas de CRM y Fidelización

**POL-030: Asignación de puntos de fidelización**  
```
SI el cliente está registrado Y se identifica al cobrar → Asignar puntos: 1 punto por cada 1€ de gasto (sobre total con IVA)
SI_NO SI el cliente no está registrado → No asignar puntos. Sugerir al camarero ofrecer registro.
SI_NO SI el cliente está registrado pero no se identifica → No asignar puntos (no se puede retroactivamente).
EXCEPCIÓN: Los importes de canjeo de puntos NO generan puntos nuevos (evitar bucle infinito).
```
- Referencia: HU-110

**POL-031: Subida de nivel de fidelización**  
```
SI puntos_acumulados_historicos del cliente ≥ umbral_nivel_siguiente → Subir de nivel automáticamente
SI_NO → Mantener nivel actual
NOTA: Los niveles solo suben, nunca bajan (una vez Plata, siempre Plata como mínimo)
O ALTERNATIVA: Revisión anual — si no alcanza umbral mínimo, baja un nivel.
```
- **Decisión de negocio**: El propietario configura si los niveles son permanentes o se revisan.

**POL-032: Envío de comunicación de cumpleaños**  
```
SI el cliente tiene fecha_nacimiento registrada Y tiene consentimiento de comunicaciones → 
    1 día antes del cumpleaños: enviar mensaje personalizado con oferta configurada.
SI_NO SI no tiene consentimiento → No enviar nada.
SI_NO SI no tiene fecha de nacimiento → No aplica.
```
- Referencia: HU-121, RN-062

**POL-033: Gestión de no-show en reservas**  
```
SI la hora de la reserva + 30 minutos pasa sin que el cliente aparezca ni avise → Marcar reserva como "no-show". Liberar mesa.
SI_NO SI el cliente llega con ≤15min de retraso → Mantener reserva.
SI_NO SI el cliente avisa de retraso → Mantener reserva hasta hora indicada.
```
- Referencia: OP-043

---

## 06.5 — Políticas Laborales

**POL-040: Detección de conflicto de turno**  
```
SI se asigna un turno a un empleado Y ya tiene otro turno cuya franja se solapa → Rechazar asignación e informar del conflicto.
SI_NO SI el descanso entre turnos es < 12 horas → Advertir del incumplimiento legal y requerir confirmación del encargado.
SI_NO → Asignar turno normalmente.
```
- Referencia: INV-040, INV-041, RN-053

**POL-041: Control de horas extra**  
```
SI las horas trabajadas del empleado en el mes superan su jornada mensual → Las horas excedentes se computan como horas extra.
SI horas_extra_acumuladas_año + nuevas_horas_extra > 80 → Alerta GRAVE: se superaría el máximo legal. No permite asignar más turnos.
```
- Referencia: INV-042, RN-052

---
