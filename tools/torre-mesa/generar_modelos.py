"""Punto de entrada para preparar los archivos de realidad aumentada."""
import hashlib
import json
import argparse
from pathlib import Path
from leer_obj import leer_cuerpos, preparar_escena
from exportar_glb import exportar_glb
from exportar_usdz import exportar_usdz
from generar_bordes import agregar_bordes


def main():
    parametros = argparse.ArgumentParser(description="Regenera el modelo de Torre Mesa para GitHub Pages.")
    parametros.add_argument('--obj', type=Path, required=True, help='Archivo OBJ original exportado de Fusion')
    opciones = parametros.parse_args()
    proyecto = Path(__file__).resolve().parents[2]
    origen = opciones.obj.resolve()
    if not origen.is_file():
        parametros.error(f'No existe el archivo OBJ: {origen}')
    destino = proyecto / "public" / "torre-mesa" / "assets"
    destino.mkdir(parents=True, exist_ok=True)
    cuerpos = leer_cuerpos(origen)
    resumen = preparar_escena(cuerpos)
    escena, cantidad_bordes = agregar_bordes(cuerpos)
    exportar_glb(escena, destino / "torre-mesa.glb")
    exportar_usdz(escena, destino / "torre-mesa.usdz")
    resumen.update(dimensions_confirmadas_mm={"ancho": 398, "alto": 905.972, "profundidad": 470},
        cuerpos=len(cuerpos), triangulos=sum(len(c["posiciones"]) // 3 for c in cuerpos.values()),
        material="Color MDF aproximado; contornos negros de 1,1 mm de diámetro",
        segmentos_bordes=cantidad_bordes,
        triangulos_bordes=sum(len(c['posiciones']) // 3 for c in escena.values() if c.get('material') == 'bordes'),
        fuente_sha256=hashlib.sha256(origen.read_bytes()).hexdigest(),
        validacion_celular="Pendiente")
    Path(__file__).with_name("modelo-metadata.json").write_text(json.dumps(resumen, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(resumen, ensure_ascii=False))


if __name__ == "__main__":
    main()
