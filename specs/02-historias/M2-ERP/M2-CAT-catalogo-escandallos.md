# M2-CAT — Historias de Usuario: Catálogo y Escandallos

> **Módulo**: M2-ERP  
> **Ámbito**: CAT — Catálogo de Productos, Escandallos, Alérgenos  
> **Agente responsable**: AG-003 (AgenteInventario — catálogo)  
> **Estado**: Parcial (iteración 1)  
> **Última revisión**: 2026-03-14

---

## HU-M2-CAT-001 | Alta de productos en carta | Must

**COMO** propietario  
**QUIERO** dar de alta productos en la carta  
**PARA** que aparezcan en el TPV.

**Criterios de aceptación:**

- **AC-01**: DADO que creo "Hamburguesa Clásica" con PVP 12,50€, categoría "Carnes" y tipo IVA "Alimentación 10%" CUANDO guardo ENTONCES el producto aparece disponible en el TPV bajo "Carnes".
- **AC-02**: DADO que creo "Gin Tonic" con PVP 9,50€ y tipo IVA "Alcohol 21%" CUANDO guardo ENTONCES aplica IVA 21%.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-001 (tipos IVA aplicables) |
| Eventos | EVT-009 (ProductoCreado) |

**Estado implementación:**
- Backend: `CatalogoService` → `POST /catalogo/productos`
- Frontend: `SetupPage.tsx` (sección productos)

---

## HU-M2-CAT-002 | Escandallo / ficha técnica | Must

**COMO** propietario  
**QUIERO** crear el escandallo (ficha técnica) de un producto  
**PARA** saber su coste real y descontar stock al vender.

**Criterios de aceptación:**

- **AC-01**: DADO que creo el escandallo de "Gin Tonic": 50ml Ginebra (0,80€) + 200ml Tónica (0,40€) + hielo + limón CUANDO guardo ENTONCES el sistema calcula coste teórico 1,28€ y food cost 13,5%.
- **AC-02**: DADO que cambio el precio de la Ginebra a 0,95€ CUANDO actualizo ENTONCES el coste del Gin Tonic se recalcula automáticamente.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-020 (food cost = coste / PVP sin IVA × 100) |
| Invariantes | INV-015 (Σ ingredientes escandallo = coste teórico) |
| Skills | SK-020 (calcular_escandallo) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M2-CAT-003 | Alérgenos de productos | Must

**COMO** propietario  
**QUIERO** indicar los alérgenos de cada producto  
**PARA** cumplir la normativa de información alimentaria.

**Criterios de aceptación:**

- **AC-01**: DADO que la Hamburguesa lleva pan (gluten), huevo (huevos), lechuga CUANDO configuro alérgenos ENTONCES marca "Gluten" y "Huevos" y esta información se muestra en carta digital y alertas de comanda.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-021 (normativa alérgenos Reglamento 1169/2011) |

**Estado implementación:** Modelo Prisma incluye `alergenos: String[]` en Producto

---

## HU-M2-CAT-004 | Mermas por ingrediente | Should

**COMO** jefe de cocina  
**QUIERO** definir mermas por ingrediente  
**PARA** que el coste teórico sea más preciso.

**Criterios de aceptación:**

- **AC-01**: DADO que la lechuga tiene merma del 15% CUANDO el escandallo usa 200g de lechuga ENTONCES calcula que necesita 235g brutos.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-022 (cantidad_bruta = cantidad_neta / (1 – %merma)) |

**Estado implementación:** No implementado (backlog iteración 2)
