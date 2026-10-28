import csv
import json
import time
import requests

URL = "https://www.dia.es/api/v1/plp-back/reduced"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9",
}

s = requests.Session()
# DIA responde 403 si la petición se presenta como navegador: se envían las cabeceras por defecto de requests


def get(page):
    params = {"navigation": "L2001", "page": page}  # devuelve el catálogo completo paginado
    for intento in range(4):
        try:
            r = s.get(URL, params=params, timeout=30)
            # DIA responde 404 con el catálogo completo cuando la categoría no existe: lo aceptamos si trae productos
            if r.status_code in (200, 404):
                data = r.json()
                if "plp_items" in data:
                    return data
        except (requests.RequestException, ValueError):
            pass
        time.sleep(3 * (intento + 1))
    raise RuntimeError(f"No se pudo descargar la página {page}")


def bonito(slug):
    return slug.replace("-", " ").capitalize() if slug else None


def main():
    productos = {}
    primera = get(1)
    total_paginas = primera["pagination"]["total_pages"]
    total = primera["total_items"]
    for page in range(1, total_paginas + 1):
        data = primera if page == 1 else get(page)
        for p in data.get("plp_items", []):
            pr = p.get("prices", {}) or {}
            partes = (p.get("url") or "").strip("/").split("/")
            productos[p["object_id"]] = {
                "id": p["object_id"],
                "nombre": p.get("display_name"),
                "marca": p.get("brand"),
                "categoria": bonito(partes[0]) if len(partes) > 2 else None,
                "subcategoria": bonito(partes[1]) if len(partes) > 2 else None,
                "precio": pr.get("price"),
                "precio_sin_oferta": pr.get("strikethrough_price"),
                "en_oferta": bool(pr.get("is_promo_price")) or (pr.get("discount_percentage") or 0) > 0,
                "precio_club_dia": bool(pr.get("is_club_price")),
                "precio_por_unidad_ref": pr.get("price_per_unit"),
                "unidad_ref": pr.get("measure_unit"),
                "url": "https://www.dia.es" + p["url"] if p.get("url") else None,
                "imagen": "https://www.dia.es" + p["image"] if p.get("image") else None,
            }
        time.sleep(0.3)  # ser amable con el servidor

    lista = list(productos.values())
    with open("productos_dia.json", "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
    with open("productos_dia.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(lista[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(lista)
    print(f"{len(lista)} productos guardados (la web anuncia {total})")


if __name__ == "__main__":
    main()
