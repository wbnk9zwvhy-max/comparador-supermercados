"""Descarga la lista de ingredientes de cada producto para saber lo natural que es.

Uso:  python3 ingredientes.py CACHE.json [--off-dump off.csv.gz]
  CACHE.json  caché de ingredientes (se lee si existe y se reescribe). Solo se piden
              a las webs los productos que no están en la caché, así que a diario son
              pocos. Las entradas de más de 120 días se refrescan poco a poco.
  --off-dump  (opcional) volcado CSV de Open Food Facts para rellenar de golpe la
              caché de Consum, que no publica ingredientes en su web.

Fuentes:
  Mercadona  ficha del producto de su web (tienda.mercadona.es/api/products/ID)
  DIA        ficha del producto de su web (www.dia.es/api/v1/pdp-back/ID)
  Consum     Open Food Facts por código de barras (EAN)
  LIDL       Open Food Facts por código de barras (EAN, de su ficha)
  y para lo que siga sin lista: lectura de las fotos del envase (OCR), hasta 300 productos al día
Lee productos_*.json del directorio actual.
"""
import csv
import gzip
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
HOY = date.today().isoformat()
CADUCA = (date.today() - timedelta(days=120)).isoformat()
REFRESCO_DIARIO = 400   # entradas viejas que se vuelven a pedir cada día
MAX_OFF_API = 300        # consultas a Open Food Facts por ejecución (~3 min)
REINTENTO_VACIOS = (date.today() - timedelta(days=30)).isoformat()


def limpia(t):
    if not t:
        return None
    t = re.sub(r"<[^>]+>", "", t).replace("\ufffd", "")
    t = re.sub(r"&nbsp;|\xa0", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    # DIA añade un aviso de alérgenos de su panadería tras los ingredientes
    t = re.split(r"En nuestra panader[ií]a se hornean", t)[0].strip()
    t = re.sub(r"^ingredientes\s*:?\s*", "", t, flags=re.I)
    return t or None


def get_json(s, url, **kw):
    for intento in range(3):
        try:
            r = s.get(url, timeout=25, **kw)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 404:
                return {}
        except (requests.RequestException, ValueError):
            pass
        time.sleep(2 * (intento + 1))
    return None


def mercadona(ids):
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept": "application/json"})

    def uno(pid):
        d = get_json(s, f"https://tienda.mercadona.es/api/products/{pid}/", params={"lang": "es", "wh": "vlc1"})
        if d is None:
            return pid, None
        ni = d.get("nutrition_information") or {}
        return pid, {"t": limpia(ni.get("ingredients")), "e": d.get("ean"), "f": "web", "d": HOY}
    with ThreadPoolExecutor(max_workers=6) as ex:
        return dict(ex.map(uno, ids))


def dia(ids):
    s = requests.Session()  # DIA rechaza (403) las peticiones con cabeceras de navegador

    def uno(pid):
        d = get_json(s, f"https://www.dia.es/api/v1/pdp-back/{pid}")
        if d is None:
            return pid, None
        ing = ((d.get("product") or {}).get("ingredients") or {}).get("text")
        return pid, {"t": limpia(ing), "f": "web", "d": HOY}
    with ThreadPoolExecutor(max_workers=6) as ex:
        return dict(ex.map(uno, ids))


def off_api(eans):
    """Open Food Facts de uno en uno (límite: 100 consultas por minuto)."""
    s = requests.Session()
    s.headers.update({"User-Agent": "ComparadorSupermercados/1.0"})
    out = {}
    for ean in eans:
        d = get_json(s, f"https://world.openfoodfacts.org/api/v2/product/{ean}.json",
                     params={"fields": "ingredients_text_es,ingredients_text,nova_group"})
        if d is None:
            continue
        p = d.get("product") or {}
        out[ean] = {"t": limpia(p.get("ingredients_text_es") or p.get("ingredients_text")),
                    "nova": p.get("nova_group"), "f": "off", "d": HOY}
        time.sleep(0.65)
    return out


def off_dump(ruta, eans):
    csv.field_size_limit(10 ** 8)
    out = {}
    with gzip.open(ruta, "rt", encoding="utf-8", errors="replace", newline="") as f:
        r = csv.reader(f, delimiter="\t")
        cab = next(r)
        i_code, i_es = cab.index("code"), cab.index("ingredients_text_es") if "ingredients_text_es" in cab else None
        i_txt, i_nova = cab.index("ingredients_text"), cab.index("nova_group")
        for fila in r:
            if len(fila) <= i_nova:
                continue
            code = fila[i_code].lstrip("0")
            if code not in eans:
                continue
            t = (fila[i_es] if i_es is not None else "") or fila[i_txt]
            nova = fila[i_nova]
            out[code] = {"t": limpia(t), "nova": int(float(nova)) if nova else None, "f": "off", "d": HOY}
    return out


def main():
    ruta_cache = sys.argv[1]
    dump = sys.argv[sys.argv.index("--off-dump") + 1] if "--off-dump" in sys.argv else None
    cache = json.load(open(ruta_cache, encoding="utf-8")) if os.path.exists(ruta_cache) else {}

    def pendientes(tienda, prods, clave=lambda p: str(p["id"])):
        nuevos, viejos = [], []
        for p in prods:
            k = f"{tienda}:{clave(p)}"
            e = cache.get(k)
            if e is None or (not e.get("t") and e.get("d", "") < REINTENTO_VACIOS):
                nuevos.append(p)
            elif e.get("d", "") < CADUCA:
                viejos.append(p)
        viejos.sort(key=lambda p: cache[f"{tienda}:{clave(p)}"].get("d", ""))
        return nuevos + viejos[:REFRESCO_DIARIO]

    def carga(arch):
        try:
            return json.load(open(arch, encoding="utf-8"))
        except (FileNotFoundError, ValueError):
            print(f"Aviso: falta {arch}")
            return []

    resumen = {}
    m = carga("productos_mercadona.json")
    pend = pendientes("m", m)
    for pid, e in mercadona([str(p["id"]) for p in pend]).items():
        if e is not None:
            cache[f"m:{pid}"] = e
    resumen["Mercadona"] = (len(pend), m, "m")

    d = carga("productos_dia.json")
    pend = pendientes("d", d)
    for pid, e in dia([str(p["id"]) for p in pend]).items():
        if e is not None:
            cache[f"d:{pid}"] = e
    resumen["DIA"] = (len(pend), d, "d")

    def por_ean(pref, prods, nombre):
        pend = [p for p in pendientes(pref, prods) if p.get("ean")]
        eans = {str(p["ean"]).lstrip("0"): str(p["id"]) for p in pend}
        hallados = off_dump(dump, set(eans)) if dump else {}
        faltan = [e for e in eans if e not in hallados]
        if not dump:  # de uno en uno: a diario solo los nuevos y unos pocos más
            hallados.update(off_api(faltan[:MAX_OFF_API]))
        faltan = faltan[:MAX_OFF_API] if not dump else faltan
        for ean, e in hallados.items():
            e["e"] = ean
            cache[f"{pref}:{eans[ean]}"] = e
        consultados = set(faltan) | (set(eans) if dump else set())
        for ean, pid in eans.items():  # no están en Open Food Facts: se apunta para no repetir la consulta a diario
            if ean in consultados and ean not in hallados:
                cache[f"{pref}:{pid}"] = {**(cache.get(f"{pref}:{pid}") or {}), "t": None, "e": ean, "f": "off", "d": HOY}
        resumen[nombre] = (len(pend), prods, pref)

    por_ean("c", carga("productos_consum.json"), "Consum")
    por_ean("l", carga("productos_lidl.json"), "LIDL")  # LIDL publica el código de barras en su ficha

    with open(ruta_cache + ".tmp", "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(ruta_cache + ".tmp", ruta_cache)
    for nombre, (n, prods, t) in resumen.items():
        con = sum(1 for p in prods if (cache.get(f"{t}:{p['id']}") or {}).get("t"))
        print(f"{nombre}: {n} consultados, {con} de {len(prods)} productos con ingredientes")
    # lo que sigue sin lista de ingredientes: se lee de las fotos del envase (OCR)
    try:
        sys.argv = [sys.argv[0], ruta_cache, "--max", "300"]
        ocr_main()
    except Exception as e:  # noqa: BLE001
        print(f"Aviso: el OCR de fotos ha fallado: {e}")
    print("Ingredientes: listo")


# ---------------------------------------------------------------- lectura de las fotos del envase (OCR)
import io
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import requests
from PIL import Image, ImageFilter, ImageOps

import categorias as CAT
import construir_app as APP

HOY = date.today().isoformat()
REINTENTO = (date.today() - timedelta(days=60)).isoformat()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TESSDATA = os.path.expanduser("~/.cache/tessdata")
# 2: imagen con contraste automático y enfoque antes de leerla (en una muestra de 80 productos de Consum,
# 8 lecturas aceptadas frente a 2). Lo que se leyó con una versión anterior y no salió se reintenta una vez.
OCR_VERSION = 2
# tope de tiempo del OCR: lo que no dé tiempo a leer se queda pendiente para el día siguiente
OCR_MINUTOS = float(os.environ.get("OCR_MINUTOS", "30"))
SIN_INGREDIENTES = {"limpieza", "higiene", "otros", "mascotas"}

RX_INICIO = re.compile(r"\bingred[il1]ent[eo]s?\b\s*[:;.,]?", re.I)
RX_FIN = re.compile(r"informaci[oó]n nutricional|valor(es)? (energ|nutric|medio)|valores medios|conserva(r|ción)\b|consumir pref|"
                    r"modo de (empleo|uso|preparaci)|\blote\b|fabricado (por|en)|elaborado (por|en)|envasado (por|en)|peso neto|"
                    r"\bpuede contener\b|\bal[eé]rgenos\b|una vez abierto|distribuido por|preparaci[oó]n:|ingredients\b|ingrédients", re.I)


RX_PORTUGUES = re.compile(r"\s\(?[OQ0]\)?\s+(?=[A-ZÁÉÍÓÚ])|\b(água|açúcar|açucar|acúcar|xarope|sementes|especiarias|farinha|óleo|leite)\b|\bingredientes\b", re.I)
RX_TABLA = re.compile(r"\b(saturadas|hidratos|prote[ií]nas|kcal|kj)\b|de las cuales|\d+[.,]\d+ ?g\b", re.I)


def preparar_tesseract():
    if subprocess.run(["which", "tesseract"], capture_output=True).returncode:
        print("Aviso: no hay tesseract; no se leen fotos")
        return False
    os.makedirs(TESSDATA, exist_ok=True)
    spa = os.path.join(TESSDATA, "spa.traineddata")
    if not os.path.exists(spa) or os.path.getsize(spa) < 1_000_000:
        r = requests.get("https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast@main/spa.traineddata", timeout=120)
        if r.status_code != 200 or len(r.content) < 1_000_000:
            print("Aviso: no se pudo descargar el idioma español de tesseract")
            return False
        open(spa, "wb").write(r.content)
    return True


def ocr(img_bytes):
    im = Image.open(io.BytesIO(img_bytes)).convert("L")
    if max(im.size) > 2000:
        im.thumbnail((2000, 2000))
    if max(im.size) < 1200:  # letra pequeña: mejor ampliada
        f = 1200 / max(im.size)
        im = im.resize((int(im.width * f), int(im.height * f)), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=1).filter(ImageFilter.SHARPEN)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    r = subprocess.run(["tesseract", "stdin", "stdout", "-l", "spa", "--psm", "3"], input=buf.getvalue(),
                       capture_output=True, timeout=120,
                       # un hilo por tesseract: ya van varios en paralelo y, si no, en Linux se pisan (OpenMP) y cada foto tarda minutos
                       env={**os.environ, "TESSDATA_PREFIX": TESSDATA, "OMP_THREAD_LIMIT": "1"})
    return r.stdout.decode("utf-8", "replace")


def sin_tildes(t):
    t = unicodedata.normalize("NFKD", t.lower())
    return "".join(c for c in t if not unicodedata.combining(c))


def vocabulario(cache):
    c = Counter()
    for e in cache.values():
        if e.get("t") and e.get("f") != "ocr":
            c.update(w for w in re.findall(r"[a-z]{3,}", sin_tildes(e["t"])))
    return {w for w, n in c.items() if n >= 3}


def extraer(texto, vocab):
    """(lista de ingredientes, puntuación 0-1) a partir del texto leído en una foto."""
    texto = unicodedata.normalize("NFC", texto)  # tesseract a veces da «ó» como «o» + tilde suelta
    m = RX_INICIO.search(texto)
    if not m:
        return None, 0
    resto = texto[m.end():m.end() + 1500]
    resto = re.sub(r"-\n(\w)", r"\1", resto)           # palabras partidas al final de línea
    resto = re.sub(r"\s+", " ", resto)                  # antes de buscar el final: «Información\nnutricional»
    f = RX_FIN.search(resto)
    if f:
        resto = resto[:f.start()]
    resto = resto.strip(" .:;,-—")
    # etiquetas bilingües (Mercadona): se corta donde empieza la versión en portugués
    pt = RX_PORTUGUES.search(resto)
    if pt and pt.start() > 10:
        resto = resto[:pt.start()]
    resto = re.sub(r"^\W*(\(?[OQ0]M?\)?\s+)", "", resto).strip(" .:;,-(")
    if RX_TABLA.search(resto):
        return None, 0  # se ha colado la tabla nutricional: lectura poco fiable
    palabras = re.findall(r"[a-záéíóúñü]{2,}", resto.lower())
    # una sola palabra («Alcachofas») solo si es un ingrediente conocido
    if len(palabras) < 2 and not (palabras and sin_tildes(palabras[0]) in vocab):
        return None, 0
    conocidas = sum(1 for w in palabras if sin_tildes(w) in vocab or len(w) == 2 and w in ("de", "en", "al", "la", "el", "y"))
    return resto[:900], conocidas / len(palabras)


def fotos_consum(s, p):
    code = p.get("codigo")
    if not code:
        return []
    return [f"https://cdn-consum.aktiosdigitalservices.com/tol/consum/media/product/img/1600x1600/{code}_00{i}.jpg" for i in range(2, 7)] + \
           [f"https://cdn-consum.aktiosdigitalservices.com/tol/consum/media/product/img/1600x1600/{code}_001.jpg"]


def fotos_dia(s, p):
    try:
        d = s.get(f"https://www.dia.es/api/v1/pdp-back/{p['id']}", timeout=25).json()
        imgs = (d.get("product") or {}).get("images") or []
    except (requests.RequestException, ValueError):
        return []
    imgs = sorted(imgs, key=lambda u: 0 if "_TRA_" in u else 1)  # la foto trasera primero
    return ["https://www.dia.es" + u for u in imgs]


def fotos_mercadona(s, p):
    try:
        d = s.get(f"https://tienda.mercadona.es/api/products/{p['id']}/", params={"lang": "es", "wh": "vlc1"},
                  headers={"User-Agent": UA}, timeout=25).json()
    except (requests.RequestException, ValueError):
        return []
    fotos = [f.get("zoom") or f.get("regular") for f in d.get("photos") or []]
    return [f for f in fotos[1:] + fotos[:1] if f]


def candidatos(cache, maximo):
    tiendas = [("m", "productos_mercadona.json", 0, fotos_mercadona), ("c", "productos_consum.json", 1, fotos_consum),
               ("d", "productos_dia.json", 2, fotos_dia)]
    out = []
    for pref, arch, s, fn in tiendas:
        try:
            prods = json.load(open(arch, encoding="utf-8"))
        except (FileNotFoundError, ValueError):
            continue
        for x in prods:
            k = f"{pref}:{x['id']}"
            e = cache.get(k) or {}
            if e.get("t") or (e.get("ocr") and e["ocr"] >= REINTENTO and e.get("ov", 1) >= OCR_VERSION):
                continue
            sec_k = APP.SECCIONES[APP.seccion(s, x)][0]
            if sec_k in SIN_INGREDIENTES:
                continue
            ruta = " > ".join(str(x.get(c) or "") for c in APP.RUTA[s][1:])
            cat = CAT.LISTA[CAT.clasificar(sec_k, " > ".join(APP.norm(t) for t in ruta.split(" > ")), APP.norm(x.get("nombre")))][0]
            if CAT.naturalidad(cat, x.get("nombre") or "", None, None, sec_k)[1].startswith("Natural: alimento sin procesar"):
                continue  # fruta, verdura, carne o pescado frescos: no llevan lista de ingredientes
            out.append((k, x, fn))
    # primero los nunca leídos, luego los dudosos (los más cerca de salir) y luego el resto
    out.sort(key=lambda t: 0 if not (cache.get(t[0]) or {}).get("ocr") else 1 if (cache.get(t[0]) or {}).get("dudoso") else 2)
    return out[:maximo]


def ocr_main():
    ruta = sys.argv[1]
    maximo = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 400
    cache = json.load(open(ruta, encoding="utf-8")) if os.path.exists(ruta) else {}
    if not preparar_tesseract():
        return
    vocab = vocabulario(cache)
    tareas = candidatos(cache, maximo)
    print(f"OCR: {len(tareas)} productos sin ingredientes por leer (vocabulario: {len(vocab)} palabras)")
    s = requests.Session()
    s.headers.update({"Accept": "image/*,application/json"})

    def uno(t):
        k, x, fn = t
        if time.time() > limite:
            return k, None
        mejor = (None, 0)
        for url in fn(s, x)[:6]:
            try:
                r = s.get(url, timeout=30, headers={} if "dia.es" in url else {"User-Agent": UA})
            except requests.RequestException:
                continue
            if r.status_code != 200 or not r.headers.get("Content-Type", "").startswith("image"):
                if "consum" in url and r.status_code == 404:
                    continue
                continue
            try:
                txt, q = extraer(ocr(r.content), vocab)
            except Exception:  # noqa: BLE001
                continue
            if txt and q > mejor[1]:
                mejor = (txt, q)
            if mejor[1] >= 0.75:
                break
        return k, mejor

    aceptados = dudosos = sin_tiempo = 0
    t0 = time.time()
    limite = t0 + OCR_MINUTOS * 60
    with ThreadPoolExecutor(max_workers=min(6, max(2, os.cpu_count() or 2))) as ex:  # cada hilo descarga fotos: máximo 6
        for i, (k, lectura) in enumerate(ex.map(uno, tareas), 1):
            if lectura is None:
                sin_tiempo += 1
                continue
            txt, q = lectura
            e = cache.get(k) or {"t": None}
            e["ocr"] = HOY
            e["ov"] = OCR_VERSION
            if txt and q >= 0.8:
                e.update({"t": txt, "f": "ocr", "q": round(q, 2), "d": HOY})
                aceptados += 1
            elif txt and q >= 0.45:
                e["dudoso"] = txt  # lectura dudosa: no se usa, se guarda para revisarla
                dudosos += 1
            cache[k] = e
            if i % 100 == 0:
                print(f"  {i}/{len(tareas)} · {aceptados} leídos · {round(time.time() - t0)} s", flush=True)
                with open(ruta + ".tmp", "w", encoding="utf-8") as f:
                    json.dump(cache, f, ensure_ascii=False, separators=(",", ":"))
                os.replace(ruta + ".tmp", ruta)
    with open(ruta + ".tmp", "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(ruta + ".tmp", ruta)
    print(f"OCR: {aceptados} con ingredientes leídos de la foto, {dudosos} dudosos descartados, "
          f"{len(tareas) - aceptados - dudosos - sin_tiempo} sin lista legible"
          + (f", {sin_tiempo} para mañana (tope de {OCR_MINUTOS:g} min)" if sin_tiempo else ""))




if __name__ == "__main__":
    main()
