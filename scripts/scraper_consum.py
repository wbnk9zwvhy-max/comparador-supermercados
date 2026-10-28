import csv
import json
import time
import requests

URL = "https://tienda.consum.es/api/rest/V1.0/catalog/product"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9",
}
LIMIT = 100

s = requests.Session()
s.headers.update(HEADERS)


def get(offset):
    params = {"limit": LIMIT, "offset": offset, "showRecommendations": "false"}
    for intento in range(4):
        try:
            r = s.get(URL, params=params, timeout=30)
            if r.status_code == 200:
                return r.json()
        except requests.RequestException:
            pass
        time.sleep(3 * (intento + 1))
    raise RuntimeError(f"No se pudo descargar offset={offset}")


def arbol_categorias():
    """id de categoría -> (nivel 1, nivel 2) del menú de la tienda."""
    try:
        r = s.get("https://tienda.consum.es/api/rest/V1.0/shopping/category/menu", timeout=30)
        menu = r.json()
    except (requests.RequestException, ValueError):
        return {}
    mapa = {}

    def recorre(nodos, ruta):
        for n in nodos or []:
            r2 = ruta + (n.get("nombre") or n.get("name"),)
            mapa[n["id"]] = (r2[0], r2[1] if len(r2) > 1 else r2[0])
            recorre(n.get("subcategories"), r2)
    recorre(menu, ())
    return mapa


IGNORAR_RAIZ = {"Ahora más barato", "Ecológico y saludable"}


def precio(prices, pid):
    for p in prices:
        if p.get("id") == pid:
            v = p.get("value", {})
            return v.get("centAmount"), v.get("centUnitAmount")
    return None, None


def main():
    arbol = arbol_categorias()
    productos = {}
    offset = 0
    while True:
        data = get(offset)
        for p in data.get("products", []):
            pd = p.get("productData", {}) or {}
            pr = (p.get("priceData", {}) or {})
            prices = pr.get("prices", [])
            precio_base, base_ud = precio(prices, "PRICE")
            precio_oferta, oferta_ud = precio(prices, "OFFER_PRICE")
            cheque, pack_ud, pack_precio = 0.0, None, None
            for o in p.get("offers") or []:
                desc = (o.get("shortDescription") or "").lower()
                if o.get("promotionType") == 2 or "cheque" in desc:  # Cheque Crece: euros que acumula el socio por unidad
                    cheque = max(cheque, float(o.get("amount") or 0))
                elif "pack" in desc and o.get("sectionUnits"):  # «En pack de N unidades a X €/ud»
                    pack_ud, pack_precio = int(o["sectionUnits"]), float(o.get("amount") or 0)
            cats = p.get("categories", [])
            ruta = next((arbol[c["id"]] for c in cats if c.get("id") in arbol
                         and arbol[c["id"]][0] not in IGNORAR_RAIZ), (None, None))
            productos[p["id"]] = {
                "id": p["id"],
                "codigo": p.get("code"),
                "ean": p.get("ean"),
                "nombre": pd.get("name"),
                "descripcion": pd.get("description"),
                "marca": (pd.get("brand") or {}).get("name"),
                "categoria": cats[0]["name"] if cats else None,
                "seccion": ruta[0],
                "seccion2": ruta[1],
                "precio": precio_oferta if precio_oferta is not None else precio_base,
                "precio_sin_oferta": precio_base,
                "en_oferta": precio_oferta is not None,
                "precio_por_unidad_ref": oferta_ud if oferta_ud is not None else base_ud,
                "unidad_ref": pr.get("unitPriceUnitType"),
                "disponible": pd.get("availability") == "1",
                "cheque_crece": round(cheque, 2),
                "pack_unidades": pack_ud,
                "pack_precio_ud": pack_precio,
                "url": pd.get("url"),
                # la imagen principal (imageURL) suele dar 404; la de la galería (media) sí funciona
                "imagen": ((p.get("media") or [{}])[0].get("url") or pd.get("imageURL")),
            }
        if not data.get("hasMore"):
            break
        offset += LIMIT
        time.sleep(0.3)  # ser amable con el servidor

    lista = list(productos.values())
    with open("productos_consum.json", "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
    with open("productos_consum.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(lista[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(lista)
    print(f"{len(lista)} productos guardados")


if __name__ == "__main__":
    main()
