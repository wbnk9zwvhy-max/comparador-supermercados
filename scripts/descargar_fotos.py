"""Descarga la foto de cada producto de Mercadona, Consum, DIA y LIDL.

Uso:  python3 descargar_fotos.py CARPETA_DATOS CARPETA_FOTOS
  CARPETA_DATOS: donde están productos_mercadona.json, productos_consum.json, ...
  CARPETA_FOTOS: donde se guardan las fotos (una subcarpeta por supermercado)

Las fotos se guardan como <supermercado>/<id del producto>.jpg (o .png).
Si una foto ya existe no se vuelve a descargar, así que ejecutarlo cada día
solo baja las de los productos nuevos. Genera indice_fotos.csv con la
relación producto -> archivo. Solo usa la librería estándar de Python.
"""
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TIENDAS = {"mercadona": "Mercadona", "consum": "Consum", "dia": "DIA", "lidl": "LIDL"}


def url_foto(tienda, p):
    u = p.get("imagen")
    if tienda == "consum" and p.get("codigo") and (not u or "_0" not in u.rsplit("/", 1)[-1]):
        # la imagen principal de Consum da 404; la primera de la galería sí existe
        u = f"https://cdn-consum.aktiosdigitalservices.com/tol/consum/media/product/img/300x300/{p['codigo']}_001.jpg"
    if tienda == "dia" and u:
        u = u.split("?")[0] + "?imwidth=300"  # el original pesa ~500 KB; a 300 px, ~25 KB
    return u


def baja(url, destino):
    for intento in range(3):
        try:
            # DIA rechaza (403) peticiones de Python que se presentan como navegador; sin cabeceras las acepta
            cab = {} if "dia.es" in url else {"User-Agent": UA, "Accept": "image/*"}
            req = urllib.request.Request(url, headers=cab)
            with urllib.request.urlopen(req, timeout=30) as r:
                datos = r.read()
                tipo = r.headers.get("Content-Type", "")
            if not tipo.startswith("image") or len(datos) < 200:
                return f"no es una imagen ({tipo})"
            if "png" in tipo:
                destino = destino[:-4] + ".png"
            tmp = destino + ".part"
            with open(tmp, "wb") as f:
                f.write(datos)
            os.replace(tmp, destino)
            return None
        except urllib.error.HTTPError as e:
            if 400 <= e.code < 500:  # la foto no existe o está bloqueada: no tiene sentido reintentar
                return str(e)
            err = str(e)
        except Exception as e:  # noqa: BLE001
            err = str(e)
            time.sleep(2 * (intento + 1))
    return err


def main():
    datos, fotos = sys.argv[1], sys.argv[2]
    solo = {a.lower() for a in sys.argv[3:]}  # opcional: supermercados concretos, p. ej. "dia lidl"
    indice, fallos = [], []
    resumen = {}
    for tienda, nombre_tienda in TIENDAS.items():
        if solo and tienda not in solo:
            continue
        ruta = os.path.join(datos, f"productos_{tienda}.json")
        if not os.path.exists(ruta):
            print(f"{nombre_tienda}: no hay {ruta}, se salta")
            continue
        productos = json.load(open(ruta, encoding="utf-8"))
        carpeta = os.path.join(fotos, nombre_tienda)
        os.makedirs(carpeta, exist_ok=True)
        existentes = {os.path.splitext(f)[0] for f in os.listdir(carpeta) if not f.endswith(".part")}
        tareas = []
        for p in productos:
            pid = str(p["id"])
            u = url_foto(tienda, p)
            if not u:
                continue
            if pid not in existentes:
                tareas.append((pid, u, os.path.join(carpeta, pid + ".jpg")))
        with ThreadPoolExecutor(max_workers=6) as ex:  # máximo 6 a la vez: ser amable con los servidores
            for (pid, u, _), err in zip(tareas, ex.map(lambda t: baja(t[1], t[2]), tareas)):
                if err:
                    fallos.append({"supermercado": nombre_tienda, "id": pid, "url": u, "error": err})
        archivos = {os.path.splitext(f)[0]: f for f in os.listdir(carpeta) if not f.endswith(".part")}
        for p in productos:
            pid = str(p["id"])
            if pid in archivos:
                indice.append({"supermercado": nombre_tienda, "id": pid, "nombre": p.get("nombre"),
                               "archivo": f"{nombre_tienda}/{archivos[pid]}"})
        resumen[nombre_tienda] = (len(tareas) - sum(1 for f in fallos if f["supermercado"] == nombre_tienda),
                                  len([p for p in productos if str(p["id"]) in archivos]), len(productos))
        print(f"{nombre_tienda}: {resumen[nombre_tienda][0]} fotos nuevas, "
              f"{resumen[nombre_tienda][1]} de {resumen[nombre_tienda][2]} productos con foto")

    with open(os.path.join(fotos, "indice_fotos.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["supermercado", "id", "nombre", "archivo"], delimiter=";")
        w.writeheader()
        w.writerows(indice)
    if fallos:
        with open(os.path.join(fotos, "fotos_fallidas.csv"), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["supermercado", "id", "url", "error"], delimiter=";")
            w.writeheader()
            w.writerows(fallos)
    print(f"Fallos: {len(fallos)}")


if __name__ == "__main__":
    main()
