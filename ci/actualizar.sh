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

web() {
  rm -rf web && mkdir -p web
  cp -R app/index.html app/catalogo.json app/miniaturas app/ingredientes app/logos web/
  du -sh web | sed 's/^/- web: /' >> "$RESUMEN"
}

"$1"
