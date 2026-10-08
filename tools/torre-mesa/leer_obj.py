"""Lee los cuerpos y normales de una exportación OBJ de Fusion."""
from pathlib import Path
import numpy as np


def leer_cuerpos(path: Path):
    """Devuelve un diccionario de cuerpos con posiciones y normales por triángulo."""
    vertices, normales, grupos = [], [], {}
    grupo = "Producto"
    for linea in path.read_text(encoding="utf-8").splitlines():
        campos = linea.split()
        if not campos:
            continue
        if campos[0] == "v":
            vertices.append([float(x) for x in campos[1:4]])
        elif campos[0] == "vn":
            normales.append([float(x) for x in campos[1:4]])
        elif campos[0] == "g":
            grupo = campos[1]
        elif campos[0] == "f":
            if len(campos) != 4:
                raise ValueError("El OBJ debe contener caras triangulares.")
            destino = grupos.setdefault(grupo, {"posiciones": [], "normales": []})
            for punto in campos[1:]:
                indices = punto.split("/")
                destino["posiciones"].append(vertices[int(indices[0]) - 1])
                destino["normales"].append(normales[int(indices[2]) - 1])
    if not grupos:
        raise ValueError("El OBJ no contiene cuerpos.")
    for cuerpo in grupos.values():
        cuerpo["posiciones"] = np.asarray(cuerpo["posiciones"], dtype=np.float64)
        cuerpo["normales"] = np.asarray(cuerpo["normales"], dtype=np.float32)
    return grupos


def preparar_escena(cuerpos):
    """Convierte a metros, ajusta el ancho nominal y apoya el producto en Y=0."""
    todos = np.concatenate([c["posiciones"] for c in cuerpos.values()]) * 0.01
    minimo, maximo = todos.min(axis=0), todos.max(axis=0)
    origen = np.array([(minimo[0] + maximo[0]) / 2, minimo[1],
                       (minimo[2] + maximo[2]) / 2])
    escala = np.array([398.0 / 400.0, 1.0, 1.0])
    for cuerpo in cuerpos.values():
        cuerpo["posiciones"] = ((cuerpo["posiciones"] * 0.01 - origen) * escala).astype(np.float32)
        normales = cuerpo["normales"] / escala
        cuerpo["normales"] = (normales / np.linalg.norm(normales, axis=1)[:, None]).astype(np.float32)
    return {"dimensiones_modelo_mm": ((maximo - minimo) * escala * 1000).tolist(),
            "dimensiones_originales_mm": ((maximo - minimo) * 1000).tolist(),
            "origen_original_m": origen.tolist(), "escala_obj_a_metros": 0.01,
            "escala_ejes": escala.tolist(),
            "geometria": "12 cuerpos conservados; ajuste X de 0,5 % para ancho nominal 398 mm. Salientes incluidas."}
