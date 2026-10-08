# Torre Mesa: visor independiente para GitHub Pages

## Archivos

- `public/torre-mesa/index.html`: página del producto y configuración de AR.
- `public/torre-mesa/css/visor.css`: diseño adaptable.
- `public/torre-mesa/js/visor.js`: carga, mensajes y vista inicial.
- `public/torre-mesa/js/model-viewer.min.js`: biblioteca 4.1.0 guardada localmente.
- `public/torre-mesa/assets/`: logo, vista previa, GLB y USDZ.
- `tools/torre-mesa/`: conversión modular de OBJ a modelos AR con bordes negros.

La página utiliza rutas relativas para funcionar tanto debajo de `/Visor-3d/`
como en un dominio propio. El despliegue existente publica todo `dist`; Vite copia
`public/torre-mesa/` a `dist/torre-mesa/`. No se necesita cambiar el flujo de publicación.

## Desarrollo y publicación

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

Abrir `/torre-mesa/` en el servidor local. Al enviar los cambios a `main`,
el flujo existente publica GitHub Pages. La raíz conserva el catálogo anterior.
URL del producto: https://mymfibrofacil.github.io/Visor-3d/torre-mesa/

## Regenerar los modelos

Instalar los requisitos de `tools/torre-mesa/requirements.txt` en un entorno Python:

```sh
python tools/torre-mesa/generar_modelos.py --obj "RUTA/Torre Mesa.obj"
```

La conversión conserva las 12 piezas, el ajuste nominal de ancho a 398 mm y
los contornos negros. No se modifica el OBJ original. El modelo usa metros y su
altura real sigue siendo 905,972 mm; la página muestra 906 mm por redondeo.
Los metadatos registran la procedencia y las dimensiones con salientes.

## Prueba en celular

Abrir el enlace HTTPS en Chrome de Android o Safari de iPhone. Tocar
**Ver en mi espacio** y permitir el acceso a cámara si el sistema lo solicita.
La escala está fijada; la posición y el giro se controlan mediante los gestos del visor.
No se incluye el aro experimental que se descartó.

Los modelos del sitio público son descargables. No se incluyen F3D, DXF,
credenciales, configuración de Sites ni historial del repositorio de Sites.
La licencia Apache 2.0 de model-viewer acompaña a la biblioteca en `js/`.
