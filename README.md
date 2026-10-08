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
└─ Mesa y Sillas Emi
```

Los datos del catálogo viven en `src/catalog.js`. Al incorporar un cliente o modelo, agregar su entrada allí y los archivos de modelo correspondientes.

## Enlaces QR

El formato nuevo abre directamente la pieza:

```text
?cliente=picky-kids&mueble=mesa-y-sillas-emi&pieza=lateral-silla
```

Los QR anteriores de Emi con el formato corto `?p=ls` continúan siendo compatibles.

## Desarrollo y publicación

Cada cambio enviado a `main` compila y publica GitHub Pages.

```bash
pnpm install
pnpm dev
pnpm build
```

En GitHub, configurar **Settings > Pages > GitHub Actions** como origen de publicación.
