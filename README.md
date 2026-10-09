# Visor 3D multi cliente

El sitio reúne las guías de armado por cliente y mueble.

## Navegación

- La raíz muestra el selector de **cliente**.
- Cada cliente muestra sus **muebles**.
- Cada mueble abre su visor 3D.
- El botón **Muebles** vuelve al catálogo.

Actualmente está cargado:

```text
Picky Kids
├─ Mesa y Sillas Emi
├─ Librero Emi
└─ Cama Montessori Emi
```

Los datos del catálogo viven en `src/catalog.js`. Al incorporar un cliente o modelo, agregar su entrada allí y los archivos de modelo correspondientes.

## Enlaces QR

El formato nuevo abre directamente la pieza:

```text
?cliente=picky-kids&mueble=mesa-y-sillas-emi&pieza=lateral-silla
```

Los QR anteriores de Emi con el formato corto `?p=ls` continúan siendo compatibles.

La cama abre sus piezas con `lateral-hueco`, `lateral-completo`, `cabecera`, `parrilla` y `tirante`.

## Desarrollo y publicación

Cada cambio enviado a `main` compila y publica GitHub Pages.

```bash
pnpm install
pnpm dev
pnpm build
```

## Torre Mesa en realidad aumentada

La página independiente está en `public/torre-mesa/`. Vite la copia al sitio publicado,
con sus modelos, logo y biblioteca del visor. No requiere ChatGPT, Sites ni un servidor propio.

Enlace: https://mymfibrofacil.github.io/Visor-3d/torre-mesa/

En Android admite WebXR y Scene Viewer; en iPhone utiliza el USDZ mediante Quick Look.
Conserva el logo, los bordes negros, las medidas redondeadas y el diseño sin aro de giro.
La cámara y la colocación deben comprobarse en un celular compatible.

La generación de modelos está separada en `tools/torre-mesa/`. El OBJ original se
mantiene local y se indica al regenerar; no se publica el proyecto de fabricación.
Consultar [la guía de Torre Mesa](docs/TORRE_MESA.md).

En GitHub, configurar **Settings > Pages > GitHub Actions** como origen de publicación.
