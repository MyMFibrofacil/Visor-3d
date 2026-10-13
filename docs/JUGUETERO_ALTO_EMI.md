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
- Frente: 414 x 280 mm, inclinado desde abajo/atrás hacia arriba/adelante, con la ranura hacia arriba. Su origen inferior aproximado es Y 53,4 / Z 283,35.

Las posiciones se obtienen al hacer coincidir las coordenadas de los agujeros entre piezas. El XML `704` contiene operaciones equivalentes en ambas caras para dos laterales; el visor distribuye un juego sobre la cara interior de cada lateral. El lateral izquierdo se espeja como conjunto para llevar la punta hacia adelante y transformar también sus puntos XML al mismo eje mundial de profundidad que el lateral derecho.

En el frente, el tarugo a 48,815 mm coincide con el punto lateral Y 93,940 / Z 310,552; el minifix a 97,631 mm con Y 134,476 / Z 337,751; y el tarugo a 146,446 mm con Y 175,012 / Z 364,950. El contorno DXF se invierte verticalmente para mostrar la ranura arriba sin alterar esas coordenadas. Los minifix de cara se colocan sobre la cara interior, opuesta al frente exterior.

## Ruta y piezas

Ruta base:

`?cliente=picky-kids&mueble=juguetero-alto`

Valores de `pieza`: `lateral`, `fondo`, `frente` y `estante`.

Los mecanizados se muestran con el primer movimiento del despiece. Los agujeros de canto conservan el eje del canto y los de cara se muestran como puntos circulares. Los dos minifix de cara del frente se dibujan sobre su cara interior.

