# 06.4 — Políticas de CRM y Fidelización

> **Sección**: 06.4 de Capa 06 — Políticas de Decisión  
> **Dominio**: CRM / Fidelización / Reservas  
> **Total políticas**: 4 (POL-030 a POL-033)  
> **Agentes**: AG-007 AgenteCRM  
> **Fecha**: 2026-03-14

---

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

### Trazabilidad

| POL | Skills que la aplican | Reglas | Invariantes | HU relacionadas |
|-----|-----------------------|--------|-------------|-----------------|
| POL-030 | SK-063 | — | INV-050 | HU-M4-FID-001 |
| POL-031 | SK-065 | — | — | HU-M4-FID-003 |
| POL-032 | SK-066 | RN-062 | INV-052 | HU-M4-CMP-002 |
| POL-033 | SK-062 | — | — | HU-M4-RES-003 |
