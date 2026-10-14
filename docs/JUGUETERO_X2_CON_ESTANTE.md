# Juguetero x2 con Estante — reconstrucción y control

## Fuentes

- `Juguetero Emi x2.art`: diseño ArtCAM del lote.
- `Juguetero emi.dxf`: distribución de cinco muebles en dos placas, exportada el 14-10-2026.
- `Juguetero Emi x2.dxf`: perfil individual del lateral.
- XML Flex `MA000904000801180101.xml` a `MA000904000806180101.xml`.
- `Medio.dxf` y `Plantilla Medio 1.xml` / `Plantilla Medio 2.xml`: referencias del utillaje del divisor.
- Ficha técnica y foto del producto armado aportadas por el cliente.

El DXF contiene cinco perfiles dobles de lateral. Cada uno equivale a dos laterales terminados. También muestra cinco piezas por tipo para base, fondo, estante y medio, y diez frentes: **40 piezas terminadas para cinco muebles**. Las separaciones estrechas entre determinadas bases y fondos no permiten el paso de la fresa; salen unidas y se terminan en seccionadora. Esto explica que el DXF dibuje contornos individuales mientras la ficha describe paneles temporales unidos.

## Posición de armado contrastada con Flex

Coordenadas del visor en mm: ancho `X`, altura `Y`, profundidad `Z`; `Z` crece hacia el frente. Espesor nominal de los modelos 18,5 mm. El lateral mide 700 × 405 mm y el ancho libre entre laterales es 664 mm.

| Unión | Comprobación |
|---|---|
| Laterales ↔ base | Puntos laterales en profundidad 123,964 y 287,037; base en 43 + 80,964 y 43 + 244,037. Coinciden. Centro de base en altura 133,25. |
| Laterales ↔ estante | Puntos laterales en profundidad 99,011 y 243,140; estante en 43 + 56,011 y 43 + 200,140. Coinciden. Centro de estante en altura 482,143. |
| Laterales ↔ fondo | Ambos usan profundidad 33,875. El borde delantero del fondo queda en 43,125. |
| Laterales ↔ frentes | Ambos usan profundidad 377,25; alturas 153,048 y 225,548. |
| Fondo ↔ base | Agujeros del fondo en ancho 166 y 498, altura 133,25; la base tiene los correspondientes agujeros en su canto posterior. |
| Fondo ↔ estante | Agujeros del fondo en ancho 166 y 498, altura 482,143; el estante tiene los correspondientes agujeros en su canto posterior. |
| Medio ↔ frentes | Dos agujeros por cara del medio se registran a profundidad 377,06 y alturas 153,048 / 225,548. La diferencia en profundidad con los frentes es 0,19 mm. |
| Medio ↔ estante | Tres agujeros del canto superior del medio quedan a profundidades 98,87 / 170,94 / 243,00; los del estante a 99,063 / 171,128 / 243,192. Diferencia máxima 0,26 mm. |
| Base ↔ medio | Ambos perfiles tienen una ranura central. El contorno de la base debe girarse 180° respecto del sistema de coordenadas del XML para que las ranuras entren desde extremos opuestos; los puntos Flex permanecen alineados con el fondo y los laterales. |

El XML del medio usa una plantilla de 480 × 585 mm para una pieza de perfil final de 399,3 × 496,5 mm. Los puntos de las etiquetas se registran contra el perfil de la plantilla. En el visor, el contorno del DXF de lote se ajusta visualmente entre piso y cara inferior del estante; los puntos de unión se registran con las coincidencias anteriores. La longitud de 23,6 mm de diferencia entre la plantilla y el perfil de lote requiere una comprobación sobre la primera pieza física antes de considerar el divisor validado en taller.

## Visor

La URL usa `cliente=picky-kids&mueble=juguetero-x2-con-estante&pieza=<tipo>`. Los tipos son `lateral`, `frente`, `base`, `medio`, `fondo` y `estante`. Hay ocho objetos en el modelo: dos laterales, dos frentes y uno de cada tipo restante. La pieza seleccionada se resalta en rojo; los puntos aparecen con el primer movimiento del despiece.

Generar los datos desde las fuentes con `python scripts/reconstruir_juguetero_estante.py` y verificar con `npm run build`. La correspondencia geométrica está documentada arriba para evitar volver a orientar piezas solo por su aspecto visual.
