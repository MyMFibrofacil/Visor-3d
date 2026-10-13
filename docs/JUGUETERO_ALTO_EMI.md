# Juguetero Alto Emi

## Fuente geométrica

El visor se reconstruye con `scripts/reconstruir_juguetero_alto.py` desde:

- `Juguetero Alto.dxf`: contornos exactos de laterales, fondo, frente y estantes.
- XML Flex `701` a `704`: agujeros de cara y canto.

El archivo generado es `src/juguetero-alto-data.json`. El modelo y la interacción están en `src/juguetero_alto.js`.

## Armado

- Ancho interior: 414 mm; espesor nominal usado por Flex: 18,5 mm.
- Laterales: 1180 x 466,3 mm, con las caras mecanizadas hacia el interior.
- Fondo: 1130,5 x 414 mm, desde 29,75 mm de altura y centrado en profundidad 38,75 mm.
- Estantes: cuatro piezas de 414 x 270 mm, a 39, 515, 833 y 1151 mm.
- Frente: 414 x 280 mm, inclinado 33,87 grados desde el punto inferior aproximado Y 53,4 / Z 283,35.

Las posiciones se obtienen al hacer coincidir las coordenadas de los agujeros entre piezas. El XML `704` contiene operaciones equivalentes en ambas caras para dos laterales; el visor distribuye un juego sobre la cara interior de cada lateral.

## Ruta y piezas

Ruta base:

`?cliente=picky-kids&mueble=juguetero-alto`

Valores de `pieza`: `lateral`, `fondo`, `frente` y `estante`.

Los mecanizados se muestran al comenzar el despiece. Los agujeros de canto conservan el eje del canto y los de cara se muestran como puntos circulares.

