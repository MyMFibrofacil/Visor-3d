# Cama Montessori Emi

## Fuentes

- Perfiles y anidado: `Cama 1.dxf` a `Cama 4.dxf`.
- Referencia de corte: archivos ART y CNC con el mismo nombre.
- Mecanizados: programas Flex `MA000904000101180101.xml` a `MA000904000104180101.xml`.
- Medidas, materiales y foto terminada: ficha técnica `Cama Montessori Emi.pdf`.

## Conjunto por cama

| Pieza | Cantidad | Medida nominal |
|---|---:|---:|
| Lateral con hueco | 1 | 2025 × 440 × 18 mm |
| Lateral completo | 1 | 2025 × 440 × 18 mm |
| Cabecera / pie | 2 | 838 × 440 × 18 mm |
| Parrilla | 10 | 815 × 100 × 18 mm |
| Tirante | 2 | 1900 × 50 × 18 mm |

Los cuatro cerramientos se orientan con el zócalo continuo abajo. En el lateral con hueco, la abertura queda hacia arriba. Los perfiles se giraron dentro de su geometría sin girar las coordenadas de los mecanizados Flex.

Los cuatro mecanizados de cada parrilla se muestran sobre la cara inferior, orientados hacia los tirantes que la reciben.

## Reconstrucción

`scripts/reconstruir_cama.py` extrae los perfiles cerrados del DXF, identifica los calados de 245 × 55 mm y guarda el resultado en `src/cama-data.json`. `src/cama.js` arma la escena con las dimensiones nominales y muestra puntos de mecanizado al avanzar el despiece.

Las parrillas y los tirantes se separan de sus paneles de fabricación para representar las piezas finales. Los QR usan la URL pública y el parámetro `pieza` para resaltar la pieza correspondiente.

## Comprobaciones

- Los cuatro DXF reúnen 6 laterales con hueco, 6 laterales completos, 12 cabeceras/pies y 8 paneles de parrillas.
- El MDF completa 6 paneles de dos tirantes y 4 paneles de cinco parrillas.
- El total para seis camas es 6 laterales con hueco, 6 laterales completos, 12 cabeceras/pies, 60 parrillas y 12 tirantes.
- La compilación de Vite debe finalizar sin errores.
- En vista armada, el lateral con hueco conserva su base inferior. En despiece, los calados y puntos permanecen ligados a su pieza.
