import csv
import json
import time
import requests

BASE = "https://tienda.mercadona.es/api"
PARAMS = {"lang": "es", "wh": "vlc1"}  # almacén de Valencia (los precios pueden variar por zona)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9",
}

s = requests.Session()
s.headers.update(HEADERS)


def get(path):
    for intento in range(3):
        r = s.get(f"{BASE}/{path}", params=PARAMS, timeout=20)
        if r.status_code == 200:
            return r.json()
        time.sleep(2 * (intento + 1))
    r.raise_for_status()


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main():
    arbol = get("categories/")
    productos = {}
    for cat in arbol["results"]:
        for sub in cat.get("categories", []):
            data = get(f"categories/{sub['id']}/")
            for grupo in data.get("categories", []):
                for p in grupo.get("products", []):
                    pi = p.get("price_instructions", {}) or {}
                    productos[p["id"]] = {
                        "id": p["id"],
                        "nombre": p.get("display_name"),
                        "categoria": cat["name"],
                        "subcategoria": sub["name"],
                        "seccion": grupo.get("name"),
                        "envase": p.get("packaging"),
                        "precio": to_float(pi.get("unit_price")),
                        "precio_anterior": to_float(pi.get("previous_unit_price")),
                        "precio_por_unidad_ref": to_float(pi.get("reference_price")),
                        "unidad_ref": pi.get("reference_format"),
                        "tamano": pi.get("unit_size"),
                        "unidad_tamano": pi.get("size_format"),
                        "url": p.get("share_url"),
                        "imagen": p.get("thumbnail"),
                    }
            time.sleep(0.3)  # ser amable con el servidor
    lista = list(productos.values())
    with open("productos_mercadona.json", "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
    with open("productos_mercadona.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(lista[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(lista)
    print(f"{len(lista)} productos guardados")


if __name__ == "__main__":
    main()
