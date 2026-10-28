"""Construye los datos de la app «Comparador de supermercados».

Uso: python3 construir_app.py CARPETA_FOTOS CARPETA_SALIDA

Lee productos_*.json (directorio actual) y las fotos descargadas con
descargar_fotos.py, y escribe en CARPETA_SALIDA:
  - catalogo.json       todos los productos en formato compacto
  - miniaturas/mNNN.webp hojas de miniaturas (10x10 fotos de 112 px)
  - ingredientes/iNN.json ingredientes de cada producto (la app los carga al abrir una ficha)
Si existe ingredientes_cache.json (de ingredientes.py) en el directorio actual, la
puntuación saludable se calcula con los ingredientes: lo más natural, no lo más ligero.
"""
import json
import math
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date

from PIL import Image
from rapidfuzz import fuzz

import categorias as CAT

TIENDAS = ["Mercadona", "Consum", "DIA", "LIDL"]
ARCHIVOS = ["productos_mercadona.json", "productos_consum.json", "productos_dia.json", "productos_lidl.json"]
PREFIJO = ["m", "c", "d", "l"]  # claves de ingredientes_cache.json
TROZOS_ING = 24
URL_BASE = ["https://tienda.mercadona.es", "https://tienda.consum.es", "https://www.dia.es", "https://www.lidl.es"]

# ---------------------------------------------------------------- secciones
SECCIONES = [
    ("fv", "Fruta y verdura"), ("carne", "Carne"), ("pescado", "Pescado y marisco"),
    ("charcu", "Charcutería y quesos"), ("lacteos", "Leche, huevos y yogures"), ("pan", "Pan y bollería"),
    ("despensa", "Despensa"), ("desayuno", "Desayuno y dulces"), ("aperitivos", "Aperitivos"),
    ("congelados", "Congelados"), ("preparados", "Platos preparados"), ("bebidas", "Agua, refrescos y zumos"),
    ("bodega", "Cerveza, vino y licores"), ("limpieza", "Limpieza y hogar"), ("higiene", "Higiene y belleza"),
    ("bebe", "Bebé"), ("mascotas", "Mascotas"), ("otros", "Otros"),
]
SEC_IDX = {k: i for i, (k, _) in enumerate(SECCIONES)}

MERCADONA = {
    "Aceite, especias y salsas": "despensa", "Agua y refrescos": "bebidas", "Aperitivos": "aperitivos",
    "Arroz, legumbres y pasta": "despensa", "Azúcar, caramelos y chocolate": "desayuno", "Bebé": "bebe",
    "Bodega": "bodega", "Cacao, café e infusiones": "desayuno", "Carne": "carne",
    "Cereales y galletas": "desayuno", "Charcutería y quesos": "charcu", "Congelados": "congelados",
    "Conservas, caldos y cremas": "despensa", "Cuidado del cabello": "higiene",
    "Cuidado facial y corporal": "higiene", "Fitoterapia y parafarmacia": "higiene", "Fruta y verdura": "fv",
    "Huevos, leche y mantequilla": "lacteos", "Limpieza y hogar": "limpieza", "Maquillaje": "higiene",
    "Marisco y pescado": "pescado", "Mascotas": "mascotas", "Panadería y pastelería": "pan",
    "Pizzas y platos preparados": "preparados", "Postres y yogures": "lacteos", "Zumos": "bebidas",
}
MERCADONA_SUB = {"Harina y preparado repostería": "despensa", "Azúcar y edulcorante": "despensa", "Embutido": "charcu"}
DIA = {
    "Aceites salsas y especias": "despensa", "Agua y refrescos": "bebidas", "Aperitivos y frutos secos": "aperitivos",
    "Arroz pastas y legumbres": "despensa", "Bolleria reposteria y azucar": "pan", "Cabello y belleza": "higiene",
    "Cabello y perfumeria": "higiene", "Cafe cacao e infusiones": "desayuno", "Carnes": "carne",
    "Cervezas vinos y licores": "bodega", "Charcuteria": "charcu", "Chocolates y golosinas": "desayuno",
    "Congelados": "congelados", "Congelados y helados": "congelados", "Conservas caldos y cremas": "despensa",
    "Frutas": "fv", "Galletas cereales y mermeladas": "desayuno", "Higiene y cuidado del cuerpo": "higiene",
    "Huevos leche y mantequilla": "lacteos", "Infantil": "bebe", "Limpieza y hogar": "limpieza",
    "Mascotas": "mascotas", "Navidad": "desayuno", "Panaderia": "pan", "Pescados y mariscos": "pescado",
    "Platos preparados y pizzas": "preparados", "Quesos": "charcu", "Salud y parafarmacia": "higiene",
    "Verduras": "fv", "Yogures y postres": "lacteos", "Zumos y smoothies": "bebidas",
}
DIA_SUB = {"Azucar miel y edulcorantes": "despensa", "Harinas y levaduras": "despensa",
           "Preparados para postres y decoracion": "despensa"}
LIDL = {
    "Aceites, especias y salsas": "despensa", "Alimentos congelados": "congelados", "Artículos para mascotas": "mascotas",
    "Bebidas": "bebidas", "Bebés y niños": "bebe", "Café, té y cacao": "desayuno", "Carne y aves": "carne",
    "Cerveza y sidra": "bodega", "Champán, vino espumoso & Co.": "bodega", "Cocina y repostería": "despensa",
    "Cuarto de baño": "higiene", "Dulces y aperitivos": "desayuno", "Frutas y hortalizas": "fv", "Panadería": "pan",
    "Pescado y marisco": "pescado", "Platos precocinados": "preparados", "Presupuesto": "limpieza",
    "Productos de droguería y cuidado personal": "higiene", "Quesos, productos lácteos y huevos": "lacteos",
    "Reservas de alimentos": "despensa", "Vino": "bodega",
}
LIDL_SUB = {"Embutidos y fiambres": "charcu", "Aperitivos salados": "aperitivos", "Queso": "charcu"}
CONSUM_L2 = {
    "Turrones y Dulces": "desayuno", "Aperitivos y frutos secos": "aperitivos", "Desayuno, dulces y café": "desayuno",
    "Panes y tostadas": "pan", "Lácteos y huevos": "lacteos", "Cavas y sidras": "bodega", "Cervezas": "bodega",
    "Licores": "bodega", "Sangrías y combinados base vino": "bodega", "Vinos": "bodega", "Carnicería": "carne",
    "Carnicería corte": "carne", "Charcutería": "charcu", "Charcutería corte": "charcu", "Quesos": "charcu",
    "Quesos corte": "charcu", "Pescadería": "pescado", "Verduras": "fv", "Frutas": "fv",
}
# hojas de Consum que su menú mete en «Desayuno, dulces y café» pero en las demás tiendas son panadería o despensa
CONSUM_HOJA = {h: "pan" for h in ["Magdalenas", "Bollería", "Pastelitos", "Hojaldres", "Croissants", "Napolitanas y croissants",
                                   "Cocas y bizcochos", "Berlinas", "Bollería rellena y donuts", "Croissants y ensaimadas",
                                   "Napolitanas y hojaldres", "Bollería dulce"]}
CONSUM_HOJA.update({h: "despensa" for h in ["Harina", "Levadura", "Decoración postres", "Postres en polvo", "Gelatinas",
                                             "Gelatina", "Edulcorantes", "Azúcar", "Bicarbonato", "Repostería", "Chocolate para postres"]})
CONSUM_L1 = {
    "Despensa": "despensa", "Bebidas": "bebidas", "Horno": "pan", "Platos preparados": "preparados",
    "Congelados y helados": "congelados", "Infantil": "bebe", "Droguería y limpieza": "limpieza",
    "Cuidado personal": "higiene", "Mascotas": "mascotas", "Bazar": "limpieza", "Frescos": "fv",
}


RUTA = [("categoria", "subcategoria", "seccion"), ("seccion", "seccion2", "categoria"),
        ("categoria", "subcategoria"), ("categoria", "subcategoria")]


def seccion(tienda, x):
    if tienda == 0:
        k = MERCADONA_SUB.get(x.get("subcategoria")) or MERCADONA.get(x.get("categoria"))
    elif tienda == 1:
        k = (CONSUM_HOJA.get((x.get("categoria") or "").strip()) or CONSUM_L2.get(x.get("seccion2"))
             or CONSUM_L1.get(x.get("seccion")))
    elif tienda == 2:
        k = DIA_SUB.get(x.get("subcategoria")) or DIA.get(x.get("categoria"))
    else:
        k = LIDL_SUB.get(x.get("subcategoria")) or LIDL.get(x.get("categoria"))
    return SEC_IDX[k or "otros"]


# ---------------------------------------------------------------- texto
def norm(t):
    t = unicodedata.normalize("NFKD", (t or "").lower())
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]", " ", t)).strip()


def stem(w):
    """Raíz simple: sin plural y sin género (braseado/braseada, canario/canarias)."""
    if len(w) > 4 and w.endswith("ones"):
        w = w[:-2]
    elif len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        w = w[:-1]
    if len(w) > 4 and w[-1] in "ao":
        w = w[:-1]
    return w


RE_CANT = re.compile(r"^(\d+([.,]\d+)?)(kg|kgs|g|gr|grs|l|lt|ml|cl|cc|ud|uds|u|x|m|cm|mm|h|w)?$")
UNIDADES = {"kg", "kgs", "g", "gr", "grs", "gramos", "kilo", "kilos", "l", "lt", "litro", "litros", "ml", "cl",
            "cc", "ud", "uds", "u", "x", "aprox", "aproximadamente"}
ENVASE = {"pack", "paquete", "bote", "botella", "botellin", "lata", "brik", "brick", "bolsa", "tarro", "caja",
          "garrafa", "bandeja", "tarrina", "pieza", "piezas", "frasco", "envase", "tetra", "formato", "familiar",
          "ahorro", "granel", "malla", "pet", "vidrio", "cristal", "estuche", "barqueta", "carton", "docena",
          "media", "unidades", "unidad"}
CONECTORES = {"de", "del", "la", "el", "los", "las", "con", "en", "y", "al", "a", "para", "o", "e", "su"}
MARCAS_PROPIAS = ["hacendado", "deliplus", "bosque verde", "compy", "mercadona", "consum", "dia",
                  "milbona", "la cestera", "realvalle", "a minha padaria"]


def palabras(nombre):
    """Lista de (palabra original, token normalizado) del nombre."""
    out = []
    for w in re.findall(r"[\wÀ-ÿ%'’-]+", nombre or ""):
        for parte in re.split(r"[-'’]", w):
            n = norm(parte)
            if n:
                out.append((parte, n))
    return out


def tipo_de(nombre, marca, tienda):
    """(clave, etiqueta, tokens en orden) del tipo de producto: el nombre sin marca, tamaño ni envase."""
    ws = palabras(nombre)
    if tienda == 3:  # LIDL: la marca va delante en mayúsculas
        while len(ws) > 1 and ws[0][0].isupper():
            ws.pop(0)
    quitar = set()
    frases = ([norm(marca)] if marca else []) + MARCAS_PROPIAS
    toks = [n for _, n in ws]
    for f in frases:
        fs = f.split()
        if not fs:
            continue
        for i in range(len(toks) - len(fs) + 1):
            if toks[i:i + len(fs)] == fs:
                quitar.update(range(i, i + len(fs)))
    kept = []
    for i, (orig, n) in enumerate(ws):
        if i in quitar or RE_CANT.match(n) or n in UNIDADES or n in ENVASE or n.isdigit():
            continue
        kept.append((orig, n))
    # sin conectores sueltos al principio o al final
    while kept and kept[0][1] in CONECTORES:
        kept.pop(0)
    while kept and kept[-1][1] in CONECTORES:
        kept.pop()
    if not kept:
        kept = [(o, n) for o, n in ws if not n.isdigit()][:3] or ws[:1]
    orden = [stem(n) for _, n in kept if n not in CONECTORES]
    visibles = [o.lower() if not (len(o) <= 2 and o.isupper()) else o for o, n in kept if n not in CONECTORES]
    clave = " ".join(sorted(set(orden)))
    partes = []
    for j, (o, _) in enumerate(kept):
        if len(o) <= 2 and o.isupper():
            partes.append(o)  # tallas y calibres: M, L, XL
        else:
            partes.append(o.lower())
    etiqueta = " ".join(partes)
    etiqueta = etiqueta[:1].upper() + etiqueta[1:]
    return clave, etiqueta, (orden, visibles)


# ---------------------------------------------------------------- precios
UREF = {"kg": ("kg", 1), "1 kg": ("kg", 1), "kilo": ("kg", 1), "l": ("l", 1), "1 l": ("l", 1), "litro": ("l", 1),
        "100 ml": ("l", 10), "100 ml.": ("l", 10), "100 g": ("kg", 10), "100 gr": ("kg", 10), "100 gr.": ("kg", 10),
        "ud": ("ud", 1), "1 u": ("ud", 1), "unidad": ("ud", 1), "dc": ("doc", 1), "1 dc": ("doc", 1),
        "docena": ("doc", 1), "lv": ("lav", 1), "1 lv": ("lav", 1), "lavado": ("lav", 1)}
UCOD = {"kg": 0, "l": 1, "ud": 2, "doc": 3, "lav": 4}
RE_FORMATO = re.compile(r"(?:(\d+)\s*x\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|gr|l|ml|cl)\b")


def unidad_lidl(formato, nombre, precio):
    for txt in (formato, nombre):
        m = None
        for m in RE_FORMATO.finditer(norm(txt or "").replace(" x ", "x")):
            pass
        if m:
            mult = int(m.group(1)) if m.group(1) else 1
            v = float(m.group(2).replace(",", ".")) * mult
            u = m.group(3)
            kg = {"kg": v, "g": v / 1000, "gr": v / 1000, "l": v, "ml": v / 1000, "cl": v / 100}[u]
            if kg > 0:
                return round(precio / kg, 2), ("l" if u in ("l", "ml", "cl") else "kg")
    return None, None


# ---------------------------------------------------------------- productos idénticos (mismo producto de marca)
def grupos_identicos(prods):
    bloques = defaultdict(list)
    for i, p in enumerate(prods):
        if p["propia"] or not p["marca_n"] or not p["qty"] or p["u"] not in ("kg", "l"):
            continue
        bloques[(p["marca_n"], round(p["qty"] * 1000))].append(i)
    grupo = {}
    n = 0
    for _, idxs in bloques.items():
        if len({prods[i]["s"] for i in idxs}) < 2:
            continue
        usados = set()
        idxs.sort(key=lambda i: prods[i]["s"])
        for a in idxs:
            if a in usados:
                continue
            miembros = [a]
            usados.add(a)
            for t in range(4):
                if t == prods[a]["s"]:
                    continue
                cands = []
                for b in idxs:
                    if prods[b]["s"] != t or b in usados:
                        continue
                    sc = fuzz.token_set_ratio(prods[a]["tok_full"], prods[b]["tok_full"])
                    pa, pb = prods[a]["p"], prods[b]["p"]
                    if sc >= 85 and max(pa, pb) / min(pa, pb) <= 2:
                        cands.append((sc, b))
                if cands:
                    b = max(cands)[1]
                    miembros.append(b)
                    usados.add(b)
            if len(miembros) > 1:
                for m in miembros:
                    grupo[m] = n
                n += 1
    return grupo


# ---------------------------------------------------------------- equivalencias entre tiendas
EQ_FRASES = [(re.compile(rx), "#" + concepto.replace(" ", "_")) for rx, concepto in CAT.FRASES]
EQ_PALABRAS = {stem(norm(k)): stem(norm(v)) for k, v in CAT.PALABRAS.items()}
EQ_IGNORAR = {stem(norm(w)) for w in CAT.IGNORAR}


def conceptos(nombre_n):
    return {c for rx, c in EQ_FRASES if rx.search(nombre_n)}


def canonicas(orden):
    """Raíces del tipo con los sinónimos unificados y sin calificativos de origen o calidad."""
    return {EQ_PALABRAS.get(w, w) for w in orden if w not in EQ_IGNORAR}


def firma_ingredientes(texto):
    """Primeros ingredientes (su primera palabra con significado), para comparar productos parecidos."""
    if not texto:
        return ""
    out = []
    for parte in CAT._ingredientes_principales(CAT._sin_tildes(texto))[:5]:
        for w in norm(parte).split():
            if w not in CONECTORES and len(w) > 2 and not w.isdigit():
                out.append(stem(w))
                break
    return " ".join(dict.fromkeys(out))


def trozo(clave):
    """Trozo de ingredientes de un producto: depende solo de su clave, así no cambia de un día a otro (la app calcula lo mismo)."""
    h = 0
    for ch in clave:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h % TROZOS_ING


def main():
    fotos_dir, salida = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(salida, "miniaturas"), exist_ok=True)

    # marcas conocidas (para detectar la marca en los nombres de Mercadona, que no la da)
    crudos = []
    for s, arch in enumerate(ARCHIVOS):
        try:
            crudos.append(json.load(open(arch, encoding="utf-8")))
        except (FileNotFoundError, ValueError):
            print(f"Aviso: falta {arch}")
            crudos.append([])
    marcas = {norm(x.get("marca")) for lista in crudos[1:] for x in lista if x.get("marca")}
    marcas |= set(MARCAS_PROPIAS)
    marcas = sorted((m for m in marcas if len(m) > 2), key=len, reverse=True)
    propias = {"hacendado", "deliplus", "bosque verde", "compy", "consum", "consum basic", "dia", "milbona",
               "la cestera", "realvalle", "oli sone", "sondey", "a minha padaria", "cien", "w5", "solevita",
               "freeway", "baresa", "chef select", "argino", "ocean sea", "deluxe", "alesto", "bellarom",
               "favorina", "pikok", "max mila s world"}

    try:
        ingr = json.load(open("ingredientes_cache.json", encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        print("Aviso: no hay ingredientes_cache.json; la puntuación saludable no tendrá ingredientes")
        ingr = {}

    prods = []
    for s, lista in enumerate(crudos):
        for x in lista:
            precio = x.get("precio")
            if not precio:
                continue
            nombre = x.get("nombre") or ""
            marca = x.get("marca")
            if s == 0:
                n = " " + norm(nombre) + " "
                marca = next((m for m in marcas if f" {m} " in n), None)
            mn = norm(marca) if marca else None
            # precio por unidad de referencia
            if s == 3:
                up, u = unidad_lidl(x.get("formato"), nombre, precio)
            else:
                ref = UREF.get(str(x.get("unidad_ref") or "").strip().lower())
                pr = x.get("precio_por_unidad_ref")
                up, u = (round(float(pr) * ref[1], 2), ref[0]) if ref and pr else (None, None)
            qty = round(precio / up, 4) if up else None
            antes = x.get("precio_anterior") if s == 0 else x.get("precio_sin_oferta")
            oferta = bool(antes) and antes > precio + 0.004
            clave, etiqueta, toks = tipo_de(nombre, marca, s)
            ruta = " > ".join(str(x.get(k) or "") for k in RUTA[s][1:])  # el primer nivel ya decide la sección
            sec_i = seccion(s, x)
            sec_k = SECCIONES[sec_i][0]
            cat_i = CAT.clasificar(sec_k, " > ".join(norm(t) for t in ruta.split(" > ")), norm(nombre))
            kg = qty if u in ("kg", "l") else None
            grande = CAT.es_formato_grande(sec_k, CAT.LISTA[cat_i][0], norm(nombre), kg)
            ing = ingr.get(f"{PREFIJO[s]}:{x['id']}") or {}
            nat = CAT.naturalidad(CAT.LISTA[cat_i][0], nombre, ing.get("t"), ing.get("nova"), sec_k)
            url = x.get("url") or ""
            for base in URL_BASE:
                url = url.replace(base, "")
            prods.append({
                "s": s, "id": str(x["id"]), "n": nombre, "b": (marca or "").strip(), "p": round(precio, 2),
                "a": round(antes, 2) if oferta else 0, "up": up, "u": u, "qty": qty,
                "cheque": round(float(x.get("cheque_crece") or 0), 2),
                "pack": [int(x["pack_unidades"]), round(float(x["pack_precio_ud"]), 2)] if x.get("pack_unidades") and x.get("pack_precio_ud") else 0,
                "salud": nat, "ingr": ing.get("t"), "fuente": ing.get("f") if ing.get("t") else None,
                "sec": sec_i, "cat": cat_i, "grande": 1 if grande else 0, "ruta": ruta, "clave": clave, "etiqueta": etiqueta, "url": url, "orden": " ".join(toks[0]), "vis": " ".join(toks[1]),
                "marca_n": mn, "propia": (mn in propias) if mn else True,
                "tok_full": " ".join(toks[0]),
                "busca": " ".join(sorted({stem(n) for _, n in palabras(nombre + " " + (marca or ""))})),
            })
    print("Productos:", Counter(TIENDAS[p["s"]] for p in prods))
    if os.environ.get("VOLCAR_CATEGORIAS"):
        with open(os.environ["VOLCAR_CATEGORIAS"], "w", encoding="utf-8") as f:
            json.dump([{"t": TIENDAS[p["s"]], "n": p["n"], "ruta": p["ruta"], "sec": SECCIONES[p["sec"]][1],
                        "cat": CAT.LISTA[p["cat"]][2], "g": p["grande"], "kg": p["qty"] if p["u"] in ("kg", "l") else None}
                       for p in prods], f, ensure_ascii=False)

    # tipos
    por_clave = defaultdict(list)
    for i, p in enumerate(prods):
        p["clave"] = f'{p["sec"]}|{p["clave"]}'  # «Limón» fruta y «Limón» refresco son tipos distintos
        por_clave[p["clave"]].append(i)
    # conceptos (gulas, carne para guisar…) solo en las secciones donde de verdad están: así un pienso
    # «estofado de ternera» o una pizza «de jamón york» no pasan por carne o fiambre
    sin_conceptos = {SEC_IDX["mascotas"], SEC_IDX["bebe"]}  # comida de mascota o de bebé nunca sustituye a la de casa
    conc_prod = [conceptos(norm(p["n"])) if p["sec"] not in sin_conceptos else set() for p in prods]
    cuenta = defaultdict(Counter)
    for i, cs in enumerate(conc_prod):
        for x in cs:
            cuenta[x][prods[i]["sec"]] += 1
    conc_secs = {x: {s for s, n in cnt.items() if n >= 0.2 * sum(cnt.values())} for x, cnt in cuenta.items()}
    claves = sorted(por_clave, key=lambda k: (-len({prods[i]["s"] for i in por_clave[k]}), -len(por_clave[k]), k))
    tipo_idx = {k: n for n, k in enumerate(claves)}
    tipos = []
    for k in claves:
        idxs = por_clave[k]
        # etiqueta: la más repetida, prefiriendo Mercadona y DIA (escriben en minúscula)
        cnt = Counter(prods[i]["etiqueta"] for i in idxs)
        mejor = max(cnt, key=lambda e: (cnt[e], -min(prods[i]["s"] for i in idxs if prods[i]["etiqueta"] == e) in (0, 2)))
        sec = Counter(prods[i]["sec"] for i in idxs).most_common(1)[0][0]
        rep = next(i for i in idxs if prods[i]["etiqueta"] == mejor)
        conc = set()
        for i in idxs:
            conc |= {x for x in conc_prod[i] if prods[i]["sec"] in conc_secs[x]}
        canon = sorted(canonicas(prods[rep]["orden"].split()) | conc)
        tipos.append([mejor, sec, prods[rep]["orden"], prods[rep]["vis"], " ".join(canon)])

    grupo = grupos_identicos(prods)
    print("Tipos:", len(tipos), "| en 2+ tiendas:", sum(1 for k in claves if len({prods[i]["s"] for i in por_clave[k]}) > 1),
          "| grupos idénticos:", len(set(grupo.values())))

    # miniaturas: ordenadas por sección y tipo para que una búsqueda toque pocas hojas
    CEL, COLS = 112, 10
    POR_HOJA = COLS * COLS
    orden = sorted(range(len(prods)), key=lambda i: (prods[i]["sec"], prods[i]["cat"], tipo_idx[prods[i]["clave"]], prods[i]["s"]))
    img_pos = {}
    hoja, celda, lienzo = 0, 0, None

    def guarda(h, lz):
        lz.save(os.path.join(salida, "miniaturas", f"m{h:03d}.webp"), "WEBP", quality=62, method=6)

    sin_foto = 0
    for i in (orden if fotos_dir != "-" else []):
        p = prods[i]
        base = os.path.join(fotos_dir, TIENDAS[p["s"]], p["id"])
        ruta = next((base + e for e in (".jpg", ".png") if os.path.exists(base + e)), None)
        if not ruta:
            sin_foto += 1
            continue
        try:
            im = Image.open(ruta)
            im.load()
        except Exception:  # noqa: BLE001
            sin_foto += 1
            continue
        if lienzo is None:
            lienzo = Image.new("RGB", (CEL * COLS, CEL * COLS), (255, 255, 255))
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            fondo = Image.new("RGBA", im.size, (255, 255, 255, 255))
            fondo.alpha_composite(im)
            im = fondo
        im = im.convert("RGB")
        im.thumbnail((CEL - 6, CEL - 6), Image.LANCZOS)
        x = (celda % COLS) * CEL + (CEL - im.width) // 2
        y = (celda // COLS) * CEL + (CEL - im.height) // 2
        lienzo.paste(im, (x, y))
        img_pos[i] = hoja * POR_HOJA + celda
        celda += 1
        if celda == POR_HOJA:
            guarda(hoja, lienzo)
            hoja, celda, lienzo = hoja + 1, 0, None
    if lienzo is not None and celda:
        guarda(hoja, lienzo)
        hoja += 1
    print("Hojas de miniaturas:", hoja, "| productos sin foto:", sin_foto)

    motivos = [""]
    motivos_idx = {"": 0}

    def motivo_idx(m):
        if m not in motivos_idx:
            motivos_idx[m] = len(motivos)
            motivos.append(m)
        return motivos_idx[m]

    filas = []
    for i, p in enumerate(prods):
        filas.append([
            p["s"], p["id"], p["n"], p["b"], p["p"], p["a"], p["up"], UCOD.get(p["u"]) if p["u"] else None,
            p["qty"], p["sec"], tipo_idx[p["clave"]], grupo.get(i, -1), img_pos.get(i, -1), p["url"], p["busca"],
            p["cat"], p["grande"], p["cheque"], p["pack"], p["salud"][0], motivo_idx(p["salud"][1]),
            firma_ingredientes(p["ingr"]),
        ])
    # ingredientes en trozos: la ficha de un producto solo descarga el suyo
    os.makedirs(os.path.join(salida, "ingredientes"), exist_ok=True)
    trozos = [{} for _ in range(TROZOS_ING)]
    for i, p in enumerate(prods):
        det = p["salud"][2]
        if p["ingr"] or det:
            trozos[trozo(f'{p["s"]}:{p["id"]}')][f'{p["s"]}:{p["id"]}'] = [(p["ingr"] or "")[:900], det["u"] if det else [], det["c"] if det else [],
                                                            det["n"] if det else 0, 1 if det and det["az"] else 0, p["fuente"] or ""]
    for j, t in enumerate(trozos):
        with open(os.path.join(salida, "ingredientes", f"i{j:02d}.json"), "w", encoding="utf-8") as f:
            json.dump(t, f, ensure_ascii=False, separators=(",", ":"))
    con_ing = sum(1 for p in prods if p["ingr"])
    print("Con ingredientes:", con_ing, "de", len(prods), "|", Counter(TIENDAS[p["s"]] for p in prods if p["ingr"]))
    print("Niveles:", sorted(Counter(p["salud"][0] // 10 for p in prods).items()))

    datos = {
        "version": 1, "trozos_ingredientes": TROZOS_ING, "fecha": date.today().isoformat(), "tiendas": TIENDAS, "urls": URL_BASE,
        "secciones": [n for _, n in SECCIONES], "unidades": ["kg", "L", "ud", "docena", "lavado"],
        "hojas": hoja, "celda": CEL, "columnas": COLS,
        "campos": ["tienda", "id", "nombre", "marca", "precio", "precio_antes", "precio_unidad", "unidad",
                   "cantidad", "seccion", "tipo", "grupo", "foto", "url", "busca", "categoria", "formato_grande",
                   "cheque_crece", "pack", "salud", "motivo_salud", "ingredientes_principales"],
        "motivos": motivos,
        "categorias": [[nombre, SEC_IDX[sec], clave] for clave, sec, nombre in CAT.LISTA],
        "tipos": tipos, "productos": filas,
        "equivalencias": {"frases": [[rx, "#" + c.replace(" ", "_")] for rx, c in CAT.FRASES],
                          "palabras": EQ_PALABRAS, "ignorar": sorted(EQ_IGNORAR)},
    }
    with open(os.path.join(salida, "catalogo.json"), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    print("catalogo.json:", round(os.path.getsize(os.path.join(salida, "catalogo.json")) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()
