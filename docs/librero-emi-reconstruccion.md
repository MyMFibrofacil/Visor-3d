# Librero Emi: reconstrucción del 8 de octubre de 2026

Esta revisión reemplaza la geometría del visor anterior. Se eliminaron los módulos obsoletos `librero.js` y `librero_rebuilt.js`; permanecen recuperables en Git.

## Fuentes y reproducción

- Contornos: `Librero Emi.dxf`, del mismo producto que `Librero Emi.art`. No se usa Librero x8.
- Mecanizados: XML MA000904000201180101, 202180101, 203180101 y 204180101, en la carpeta Flex MA0009040002 Librero.
- Referencias de armado: foto del PDF Librero Emi y vista previa interna de Librero.f3d. La vista previa sirve como referencia visual; no se importaron sólidos de Fusion.
- Ejecutar `python scripts/reconstruir_librero.py` con Python y ezdxf instalados. Las rutas de origen están al inicio del script.
- Salida: `src/librero-data.json`, consumida por `src/librero_v2.js`. Coordenadas en milímetros, espesor terminado 18,5 mm.

## Interpretación por pieza

| Pieza | Interpretación y orientación |
|---|---|
| Laterales, dos | Perfil DXF 27E: profundidad 305 mm y altura 390 mm. Pico alto central y pies bajos en ambos extremos. XML 201 contiene dos posiciones distintas de plantilla; se transforman por separado. Nueve operaciones interiores por lateral y dos operaciones exteriores de tornillo/avellanado. |
| Separador con manija | Perfil DXF 274 y calado 273. Ancho 503,9 mm, altura 370 mm. Vertical en el centro de la profundidad, apoyado sobre la base. XML 202 de 37 mm corresponde a dos placas de 18,5 mm apiladas; se toma una capa y se depuran operaciones repetidas. |
| Base | 503,9 × 269 × 18,5 mm. Horizontal. XML 203: cara superior hacia el separador, cantos largos hacia los frentes y cantos cortos hacia los laterales. |
| Frentes, dos | 503,9 × 106 × 18,5 mm. En los dos bordes opuestos de la base, agujeros de cara hacia adentro. XML 204 trabaja un panel previo de 216,4 mm de ancho, dividido en dos frentes con corte de 4,4 mm. También contempla placas apiladas. El segundo frente se gira 180° después del corte para dejar su fila de agujeros abajo. |

## Control de uniones y diferencias reales

El generador compara los ejes enfrentados de los agujeros entre piezas y exige 48 extremos de tarugos emparejados, correspondientes a las 24 uniones. Conserva diámetro, posición y referencia a la operación XML en cada punto.

En esta revisión genera seis piezas y 58 operaciones visibles de mecanizado. Los puntos para tarugos de 8 mm son azules; tornillos y avellanados se muestran oscuros, incluido el avellanado exterior de 8 mm del lateral. Los mecanizados aparecen durante el despiece y permanecen ocultos en el armado.

Los archivos no coinciden matemáticamente al 100 %:

- La plantilla de laterales ubica las uniones de los frentes a ±143,25 mm; base de 269 mm más medio espesor de frente requiere ±143,75 mm. Diferencia: 0,50 mm.
- Algunas uniones entre separador y laterales difieren hasta 0,7956 mm, incluida la referencia de tornillo.

Los puntos conservan las coordenadas de origen. No se desplazaron para ocultar estas diferencias, ni se modificaron los archivos de máquina. La correspondencia aceptada para el visor usa un límite de 1 mm; no certifica tolerancias de fabricación ni reemplaza una prueba física de armado.

## Verificación

- Generación de datos y comprobación de correspondencias ejecutadas.
- Compilación Vite correcta.
- Armado y despiece revisados en navegador local; selección roja del separador y laterales; contornos completos y puntos en caras/cantos.
- Geometría contrastada con la foto de producto y la vista previa de Fusion: separador central, dos frentes opuestos, laterales altos en el centro.
- Las etiquetas y los XML de máquina no se modifican en esta revisión.
