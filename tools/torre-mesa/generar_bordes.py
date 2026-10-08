"""Agrega contornos negros como geometría visible tanto en web como en AR."""
from collections import defaultdict
import numpy as np


def agregar_bordes(cuerpos, radio=0.00055, angulo_grados=35):
    """Traza aristas de contorno y pliegues; omite diagonales coplanares."""
    resultado = dict(cuerpos)
    total = 0
    for nombre, cuerpo in cuerpos.items():
        triangulos = cuerpo['posiciones'].reshape(-1, 3, 3).astype(float)
        aristas = defaultdict(list)
        for triangulo in triangulos:
            normal = np.cross(triangulo[1]-triangulo[0], triangulo[2]-triangulo[0])
            longitud = np.linalg.norm(normal)
            if longitud < 1e-12:
                continue
            normal /= longitud
            for a, b in zip(triangulo, np.roll(triangulo, -1, axis=0)):
                clave = tuple(sorted((tuple(np.round(a, 7)), tuple(np.round(b, 7)))))
                aristas[clave].append(normal.copy())
        posiciones, normales = [], []
        umbral = np.cos(np.radians(angulo_grados))
        for (inicio, fin), adyacentes in aristas.items():
            if len(adyacentes) > 1 and all(np.dot(a, b) >= umbral
                    for i, a in enumerate(adyacentes) for b in adyacentes[i+1:]):
                continue
            a, b = np.array(inicio), np.array(fin)
            direccion = b-a
            longitud = np.linalg.norm(direccion)
            if longitud < 1e-7:
                continue
            direccion /= longitud
            referencia = np.eye(3)[np.argmin(np.abs(direccion))]
            u = np.cross(direccion, referencia); u /= np.linalg.norm(u)
            v = np.cross(direccion, u)
            anillo = [np.cos(t)*u+np.sin(t)*v for t in np.linspace(0, 2*np.pi, 7)[:-1]]
            for i in range(6):
                n1, n2 = anillo[i], anillo[(i+1)%6]
                p1, p2, p3, p4 = a+radio*n1, a+radio*n2, b+radio*n1, b+radio*n2
                posiciones.extend([p1, p2, p3, p2, p4, p3])
                normales.extend([n1, n2, n1, n2, n2, n1])
            total += 1
        if posiciones:
            resultado[nombre+'_Bordes'] = {'posiciones': np.array(posiciones, dtype=np.float32),
                'normales': np.array(normales, dtype=np.float32), 'material': 'bordes'}
    return resultado, total
