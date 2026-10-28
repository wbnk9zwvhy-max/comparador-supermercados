"""Productos de supermercado de LIDL España.

LIDL no vende alimentación online, pero publica en su web una ficha de cada producto «En tienda».
Se recorren como lo haría una persona:
  1. el mapa del sitio de lidl.es (todas las fichas de producto que publica; las de supermercado
     tienen un número de 8 cifras, las de bazar de 9),
  2. su buscador, con cientos de búsquedas de alimentación y droguería,
y de cada ficha se lee el precio vigente (o el precio Lidl Plus si es el único), el formato, la
categoría, el código de barras y la foto. Cubre todo lo que LIDL publica en su web, que sigue
siendo menos que el surtido de la tienda física."""
import gzip
import re
from concurrent.futures import ThreadPoolExecutor
import csv
import json
import time
import requests

URL = "https://www.lidl.es/q/api/search"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9",
}

TERMINOS = """
leche yogur queso mantequilla nata huevos kefir postre flan natillas batido bebida vegetal
pan pan de molde tostadas biscotes bollería croissant magdalenas galletas cereales muesli avena
harina levadura azúcar sal aceite aceite de oliva vinagre mayonesa ketchup mostaza tomate frito salsa
especias pimienta orégano caldo sopa arroz pasta macarrones espaguetis fideos lentejas garbanzos alubias
legumbres conserva atún sardinas mejillones berberechos aceitunas encurtidos pepinillos maíz guisantes
espárragos pimientos tomate triturado fruta manzana plátano naranja mandarina pera uva fresa kiwi limón
melón sandía piña aguacate verdura lechuga ensalada tomate cebolla patata ajo zanahoria calabacín
berenjena pepino brócoli coliflor espinacas champiñones setas carne pollo pavo cerdo ternera cordero
hamburguesa salchichas carne picada lomo costillas jamón jamón serrano jamón cocido chorizo salchichón
fuet lomo embuchado pechuga bacon beicon mortadela pescado salmón merluza bacalao gambas langostinos
calamar pulpo surimi congelados pizza helado patatas fritas croquetas empanadillas nuggets lasaña
verduras congeladas chocolate cacao bombones caramelos chicles gominolas turrón snacks frutos secos
almendras nueces cacahuetes pistachos patatas chips palomitas café cápsulas té infusión zumo agua
refresco cola tónica cerveza vino tinto vino blanco cava sidra licor ginebra ron whisky vermut
miel mermelada crema de cacao tortitas barritas proteína sin gluten sin lactosa ecológico bio
comida preparada gazpacho hummus tortilla sandwich wrap tortillas de trigo nachos alimentación infantil
papilla potitos comida para perros comida para gatos detergente suavizante lavavajillas friegasuelos
lejía limpiador papel higiénico servilletas papel de cocina bolsas de basura champú gel de baño
desodorante pasta de dientes cepillo de dientes cuchillas compresas pañales toallitas crema hidratante
protector solar jabón colonia algodón
""".split("\n")


def terminos():
    vistos, out = set(), []
    # términos sueltos + compuestos buscados enteros
    simples = " ".join(TERMINOS).split()
    compuestos = ["pan de molde", "aceite de oliva", "tomate frito", "tomate triturado", "carne picada",
                  "jamón serrano", "jamón cocido", "lomo embuchado", "patatas fritas", "verduras congeladas",
                  "frutos secos", "patatas chips", "vino tinto", "vino blanco", "crema de cacao", "sin gluten",
                  "sin lactosa", "comida preparada", "tortillas de trigo", "alimentación infantil",
                  "comida para perros", "comida para gatos", "papel higiénico", "papel de cocina",
                  "bolsas de basura", "gel de baño", "pasta de dientes", "cepillo de dientes",
                  "crema hidratante", "protector solar", "bebida vegetal"]
    for t in compuestos + simples:
        if t not in vistos and len(t) > 2 and t not in ("para", "con", "sin"):
            vistos.add(t)
            out.append(t)
    return out


s = requests.Session()
s.headers.update(HEADERS)
HTML = {**HEADERS, "Accept": "text/html,application/xhtml+xml"}


def unflatten(arr):
    """Decodifica los datos que la web incrusta en la página (formato «devalue» de Nuxt)."""
    cache = {}

    def h(i):
        if isinstance(i, int) and i < 0:
            return None
        if i in cache:
            return cache[i]
        v = arr[i]
        if isinstance(v, list):
            if v and isinstance(v[0], str) and v[0] in ("ShallowReactive", "Reactive", "Ref", "ShallowRef", "EmptyRef",
                                                        "EmptyShallowRef", "Set", "Map", "Date", "BigInt", "RegExp", "null"):
                tag = v[0]
                out = (v[1] if tag in ("Date", "BigInt", "RegExp") else [h(x) for x in v[1:]] if tag == "Set"
                       else {str(h(v[k])): h(v[k + 1]) for k in range(1, len(v), 2)} if tag == "Map"
                       else None if tag in ("EmptyRef", "EmptyShallowRef") else {} if tag == "null" else h(v[1]))
                cache[i] = out
                return out
            out = []
            cache[i] = out
            out.extend(h(x) for x in v)
            return out
        if isinstance(v, dict):
            out = {}
            cache[i] = out
            for k, x in v.items():
                out[k] = h(x)
            return out
        cache[i] = v
        return v
    return h(0)


def urls_mapa():
    """Fichas de supermercado del mapa del sitio."""
    for intento in range(3):
        try:
            r = s.get("https://www.lidl.es/p/export/ES/es/product_sitemap.xml.gz", headers=HTML, timeout=60)
            if r.status_code == 200:
                xml = gzip.decompress(r.content).decode("utf-8", "replace") if r.content[:2] == b"\x1f\x8b" else r.text
                return [u for u in re.findall(r"<loc>([^<]+)</loc>", xml) if re.search(r"/p\d{8}$", u)]
        except (requests.RequestException, OSError):
            pass
        time.sleep(3 * (intento + 1))
    return []


def precio_de(p):
    """(precio, precio anterior, formato, precio por unidad, es precio Lidl Plus) vigente hoy."""
    pr = p.get("price") or {}
    if pr.get("price") is not None:
        disc = pr.get("discount") or {}
        return pr["price"], pr.get("oldPrice") or disc.get("deletedPrice"), (pr.get("packaging") or {}).get("text"), \
            (pr.get("basePrice") or {}).get("text"), False
    for reg in (p.get("regionsPrices") or {}).values():
        for clave, plus in (("currentPrice", False), ("currentLidlPlusPrice", True)):
            c = (reg or {}).get(clave) or {}
            c = c.get("price") if isinstance(c.get("price"), dict) else c
            if c and c.get("price") is not None:
                disc = c.get("discount") or {}
                return c["price"], c.get("oldPrice") or disc.get("deletedPrice"), (c.get("packaging") or {}).get("text"), \
                    (c.get("basePrice") or {}).get("text"), plus
    return None, None, None, None, False


def ficha(url):
    for intento in range(3):
        try:
            r = s.get(url, headers=HTML, timeout=40)
            if r.status_code == 404:
                return None
            if r.status_code == 200:
                m = re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', r.text, re.S)
                if not m:
                    return None
                d = unflatten(json.loads(m.group(1)))
                p = next(iter((d.get("data") or {}).values()), None)
                return p if isinstance(p, dict) and p.get("erpNumber") else None
        except (requests.RequestException, ValueError):
            pass
        time.sleep(2 * (intento + 1))
    return None


def producto_de_ficha(p):
    kf = p.get("keyfacts") or {}
    won = (kf.get("wonCategoryPrimary") or "").split("/")
    if not (won[:2] == ["Mundos de necesidad", "Comida y cerca de la comida"] or kf.get("analyticsCategory") in ("Food", "Near Food")):
        return None
    precio, antes, formato, base, plus = precio_de(p)
    if precio is None:
        return None
    media = p.get("media") or {}
    imgs = [(media.get("imageMap") or {}).get(str(i)) or {} for i in (media.get("gallery") or {}).get("images") or []]
    imagen = next((i.get("largeUrl") or i.get("mediumUrl") for i in imgs if i), None)
    marca = (((p.get("info") or {}).get("brand") or {}).get("name") or "").replace("®", "") or None
    return {
        "id": str(p["erpNumber"]),
        "nombre": kf.get("fullTitle") or kf.get("title"),
        "marca": marca,
        "categoria": won[2] if len(won) > 2 else None,
        "subcategoria": won[3] if len(won) > 3 else None,
        "precio": precio,
        "precio_sin_oferta": antes or precio,
        "en_oferta": bool(antes),
        "formato": formato,
        "precio_por_unidad_ref": base,
        "url": p.get("canonicalUrl") if str(p.get("canonicalUrl", "")).startswith("http") else "https://www.lidl.es" + (p.get("canonicalUrl") or p.get("canonicalPath") or ""),
        "imagen": imagen,
        "ean": (p.get("eans") or [None])[0],
        "precio_lidl_plus": plus,
    }


def buscar(q, offset=0):
    params = {"q": q, "locale": "es_ES", "assortment": "ES", "version": "2.1.0",
              "fetchsize": 1000, "offset": offset}
    for intento in range(4):
        try:
            r = s.get(URL, params=params, timeout=40)
            if r.status_code == 200:
                return r.json()
        except (requests.RequestException, ValueError):
            pass
        time.sleep(3 * (intento + 1))
    return None


def es_supermercado(d):
    cat = d.get("category") or ""
    won = ((d.get("keyfacts") or {}).get("wonCategoryPrimary") or "")
    return not cat.startswith("Categorías/") or won.startswith("Mundos de necesidad/Comida")


def main():
    productos = {}
    fallos = 0
    # 1. todas las fichas del mapa del sitio
    urls = urls_mapa()
    print(f"Mapa del sitio: {len(urls)} fichas de supermercado")
    with ThreadPoolExecutor(max_workers=6) as ex:
        for p in ex.map(ficha, urls):
            x = producto_de_ficha(p) if p else None
            if x:
                productos[x["id"]] = x
    print(f"Fichas con precio: {len(productos)}")
    # 2. el buscador, por si alguna no está en el mapa
    for q in terminos():
        data = buscar(q)
        if data is None:
            fallos += 1
            continue
        for it in data.get("items", []):
            d = (it.get("gridbox") or {}).get("data") or {}
            if not d or not es_supermercado(d):
                continue
            pr = d.get("price") or {}
            if pr.get("price") is None:
                continue
            disc = pr.get("discount") or {}
            base = pr.get("basePrice") or {}
            won = ((d.get("keyfacts") or {}).get("wonCategoryPrimary") or "").split("/")
            pid = str(d.get("erpNumber") or d.get("productId") or it.get("code"))
            if pid in productos:
                continue
            productos[pid] = {
                "id": pid,
                "nombre": d.get("fullTitle"),
                "marca": ((d.get("brand") or {}).get("name") or "").replace("®", "") or None,
                "categoria": won[2] if len(won) > 2 else d.get("category"),
                "subcategoria": won[3] if len(won) > 3 else None,
                "precio": pr.get("price"),
                "precio_sin_oferta": pr.get("oldPrice") or disc.get("deletedPrice") or pr.get("price"),
                "en_oferta": bool(pr.get("oldPrice") or disc.get("deletedPrice")),
                "formato": pr.get("packaging", {}).get("text") if isinstance(pr.get("packaging"), dict) else None,
                "precio_por_unidad_ref": base.get("text") if isinstance(base, dict) else base or None,
                "url": "https://www.lidl.es" + d["canonicalUrl"] if d.get("canonicalUrl") else None,
                "imagen": d.get("image"),
            }
        time.sleep(0.4)  # ser amable con el servidor

    no_super = {"Electrodomésticos de cocina", "Decoración", "Juguetes", "Sala para bebés y niños"}
    lista = [p for p in productos.values() if p["categoria"] not in no_super]
    if not lista:
        raise SystemExit("LIDL: 0 productos (¿web bloqueada o cambiada?)")
    campos = {}
    for p in lista:
        campos.update(dict.fromkeys(p))
    lista = [{k: p.get(k) for k in campos} for p in lista]
    with open("productos_lidl.json", "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
    with open("productos_lidl.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(lista[0].keys()), delimiter=";")
        w.writeheader()
        w.writerows(lista)
    print(f"{len(lista)} productos guardados ({fallos} búsquedas fallidas)")


if __name__ == "__main__":
    main()
