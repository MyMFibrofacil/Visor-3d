# Juguetero Bajo x2 Emi

## Fuentes

- Ficha: `Juguetero Bajo x2 Emi.pdf`.
- Pantógrafo Hermes 28: `Juguetero Bajo 1/2.art`, sus CNC y DXF, y `Juguetero Bajo x2.dxf`.
- Flex: `MA0009040004 Juguetero Bajo x2`, XML 401 a 406.

## Piezas y orientación

El visor usa los perfiles del DXF general y los agujeros de los XML. Las piezas principales por juguetero son dos laterales, un divisor central, fondo, tapa, piso y dos frentes. Los laterales muestran los mecanizados hacia adentro; la tapa y el fondo presentan sus curvas hacia afuera; el divisor central se gira 90 grados con el triángulo hacia el frente y sus puntos se transforman junto con el perfil.

El conjunto se arma con dos laterales, fondo trasero, piso, tapa, divisor central y frentes inclinados. El visor permite seleccionar cada tipo, girar la cámara y separar todas las piezas.

## Producción y etiquetas

Los frentes parten de una tira de pantógrafo y se refilan en seccionadora a 361 x 160 mm. Las etiquetas se generan en JPEG horizontal de 100 x 60 mm para Zebra y en una plancha A4 de prueba. Cada etiqueta incluye pieza, posición, secuencia de procesos, puntos de mecanizado, Code 128 con el XML y QR al visor de la pieza.

La tanda generada contiene 53 etiquetas: piezas del juguetero y las sillas que aparecen en las dos placas. Los planos de placa se generan en A4 con numeración coincidente.

## Verificación y límite conocido

Se comprobó que los 53 JPEG contienen un Code 128 y un QR legibles. Se ejecutó `npm run build` y se revisaron el armado y el despiece en navegador local. El XML `...404.xml` contiene 8 operaciones del divisor, mientras que el DXF general conserva dos puntos adicionales de 5 mm; esa diferencia debe confirmarse en Flex antes de fabricar una nueva tanda.

## Regeneración

El generador reproducible está en `outputs/generador_juguetero/generar_juguetero.py` y el reconstruidor del modelo en `scripts/reconstruir_juguetero.py`.
