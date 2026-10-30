#!/usr/bin/env bash
# Pasos de la actualización diaria. Se puede ejecutar igual en local (tras ci/datos.sh traer):
#   ci/actualizar.sh precios | app | web
set -uo pipefail
cd "$(dirname "$0")/.."
PY="${PY:-$PWD/.venv/bin/python}"
RESUMEN="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

precios() {
  cd scripts
  local fallos=0
  for t in mercadona consum dia lidl; do
    [ -f "productos_$t.json" ] && cp "productos_$t.json" "productos_$t.ayer.json"
    if "$PY" -W ignore "scraper_$t.py"; then
      echo "- $t: $("$PY" -c "import json;print(len(json.load(open('productos_$t.json'))))") productos" >> "$RESUMEN"
    else
      fallos=$((fallos + 1))
      if [ -f "productos_$t.ayer.json" ]; then
        mv "productos_$t.ayer.json" "productos_$t.json"
        echo "- ⚠️ $t ha fallado: se usan sus precios anteriores" >> "$RESUMEN"
      else
        echo "- ❌ $t ha fallado y no hay datos anteriores" >> "$RESUMEN"
      fi
    fi
    rm -f "productos_$t.ayer.json"
  done
  [ "$fallos" -lt 4 ]   # si fallan los cuatro, no seguimos
}

app() {
  cd scripts
  "$PY" -W ignore ingredientes.py ../datos/ingredientes_cache.json || echo "- ⚠️ ingredientes.py ha fallado" >> "$RESUMEN"
  "$PY" -W ignore descargar_fotos.py . ../fotos | tail -3
  cp ../datos/ingredientes_cache.json ingredientes_cache.json
  "$PY" -W ignore construir_app.py ../fotos ../app && cd .. && node build.js
}

traer_web() {
  # los datos que ya publica la web (para publicar solo un cambio de diseño, sin raspar los súper)
  local base="${WEB:-https://wbnk9zwvhy-max.github.io/comparador-supermercados}"
  mkdir -p app/miniaturas app/ingredientes
  curl -sfS "$base/catalogo.json" -o app/catalogo.json || return 1
  read -r hojas trozos < <(node -e 'const d=require("./app/catalogo.json");console.log(d.hojas, d.trozos_ingredientes)')
  for ((i = 0; i < hojas; i++)); do printf -v f "m%03d.webp" "$i"; curl -sfS "$base/miniaturas/$f" -o "app/miniaturas/$f" || return 1; done
  for ((i = 0; i < trozos; i++)); do printf -v f "i%02d.json" "$i"; curl -sfS "$base/ingredientes/$f" -o "app/ingredientes/$f" || return 1; done
  echo "- datos de la web: $hojas hojas de miniaturas, $trozos trozos de ingredientes" >> "$RESUMEN"
}

web() {
  rm -rf web && mkdir -p web
  cp -R app/index.html app/catalogo.json app/miniaturas app/ingredientes app/logos web/
  du -sh web | sed 's/^/- web: /' >> "$RESUMEN"
}

"$1"
