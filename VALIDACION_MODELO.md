# Validación geométrica — Mesa y Sillas Emi

Fuentes usadas: TCN de pantógrafo, DXF de las plantillas y los siete XML de Flex.

| Unión | Distancia del componente (mm) | Distancia/posición en la pieza receptora (mm) | Diferencia (mm) | Resultado |
|---|---:|---:|---:|---|
| Faja ↔ tapa (X) | 190.830 | 190.880 | 0.050 | OK |
| Faja ↔ tapa (X) | 210.750 | 210.800 | 0.050 | OK |
| Faja ↔ tapa (X) | 589.250 | 589.200 | 0.050 | OK |
| Faja ↔ tapa (X) | 609.170 | 609.120 | 0.050 | OK |
| Faja ↔ lateral (Y) | 450.500 | 450.500 | 0.000 | OK |
| Faja ↔ lateral (Y) | 418.500 | 418.500 | 0.000 | OK |
| Faja ↔ lateral (Z) | 79.000 | 79.000 | 0.000 | OK |
| Faja ↔ lateral (Z) | 421.000 | 421.000 | 0.000 | OK |
| Lateral ↔ tapa (Z) | 140.750 | 140.750 | 0.000 | OK |
| Lateral ↔ tapa (Z) | 250.000 | 250.000 | 0.000 | OK |
| Lateral ↔ tapa (Z) | 359.250 | 359.250 | 0.000 | OK |
| Asiento ↔ lateral | 47.285 | 47.280 | 0.005 | OK |
| Asiento ↔ lateral | 47.285 | 47.290 | 0.005 | OK |
| Respaldo ↔ lateral | 42.931 | 42.934 | 0.003 | OK |
| Respaldo ↔ lateral | 42.931 | 42.931 | 0.000 | OK |
| Trava ↔ lateral | 20.000 | 19.993 | 0.007 | OK |

## Conteo validado por combo

- Mesa: **12 tarugos + 10 minifix**.
- Dos sillas: **20 tarugos + 12 tornillos negros**.
- Cada silla mostrada en el visor: **10 tarugos + 6 tornillos**.

## Escenas del visor

- Una pieza de mesa abre la mesa sola.
- Una pieza de silla abre una sola silla.
- Los perfiles de los laterales salen de `Plantilla Mesa.dxf` y `Plantilla Silla.dxf`.
- Los restantes perfiles salen del TCN compensando los 4 mm de radio de herramienta.

## Ajuste visual de uniones y orientación — 2026-10-08

- El visor usa puntos simples: azul para tarugo y oscuro para tornillo/minifix.
- Cada punto se muestra una sola vez, en la cara mecanizada indicada por el archivo de origen.
- Se invirtió el eje longitudinal del respaldo y de la traba para que sus tres y dos puntos de unión, respectivamente, coincidan con los mecanizados de los laterales.
- Verificación geométrica posterior al ajuste: desajuste máximo de 0,0043 mm para el respaldo y 0,0070 mm para la traba, comparando las posiciones reconstruidas con las coordenadas de los XML/DXF normalizadas en `model-data.json`.


## Relevamiento de mecanizados Flex — 2026-10-08

Se contrastó cada punto del visor con los XML de Flex de `MA0009040003 Mesa y Silla`.

| Pieza | Archivo XML | Mecanizados representados |
|---|---|---:|
| Tapa | `MA000904000303180101.xml` | 14 verticales |
| Faja | `MA000904000302180101.xml` | 12: 4 de cara, 4 de canto superior y 4 de extremos |
| Lateral de mesa | `Plantilla Mesa.xml` | 5 de cara y 3 de canto por lateral |
| Lateral de silla | `MA000904000304180101.xml` y `Plantilla Silla.xml` | 8 de frente y 6 de dorso por lateral |
| Asiento | `MA000904000305180101.xml` | 3 horizontales por extremo |
| Respaldo | `MA000904000306180101.xml` | 3 horizontales por extremo |
| Traba | `MA000904000307180101.xml` | 2 horizontales por extremo de cada traba |

Los tornillos de asiento, respaldo y traba se corrigieron a diámetro 6 mm, tal como indican sus XML. Las seis perforaciones del dorso del lateral de silla se añadieron con la cara indicada por `Back Vertical Hole`.
