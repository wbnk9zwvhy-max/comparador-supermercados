#!/usr/bin/env bash
# Datos que cambian cada día (productos_*.json y la caché de ingredientes) en la rama «datos»,
# que se reescribe en cada ejecución (sin historial: no hace crecer el repositorio).
#   ci/datos.sh traer    trae los del último día (si existen)
#   ci/datos.sh guardar  guarda los de hoy
set -euo pipefail
cd "$(dirname "$0")/.."
ARCHIVOS="productos_mercadona.json productos_consum.json productos_dia.json productos_lidl.json"

case "$1" in
  traer)
    if git fetch -q origin datos 2>/dev/null; then
      for f in $ARCHIVOS; do git show "origin/datos:$f" > "scripts/$f" 2>/dev/null || rm -f "scripts/$f"; done
      git show origin/datos:ingredientes_cache.json > datos/ingredientes_cache.json
      echo "Datos de $(git log -1 --format=%cs origin/datos) recuperados"
    else
      echo "Aún no hay rama «datos»: se empieza con la caché de ingredientes del repositorio"
    fi
    ;;
  guardar)
    # commit sin padre hecho desde este mismo repositorio (así usa las credenciales de actions/checkout)
    tmp=$(mktemp -d)
    for f in $ARCHIVOS; do if [ -f "scripts/$f" ]; then cp "scripts/$f" "$tmp/"; fi; done
    cp datos/ingredientes_cache.json "$tmp/"
    export GIT_INDEX_FILE; GIT_INDEX_FILE=$(mktemp -u)
    git --work-tree="$tmp" add -A
    arbol=$(git write-tree)
    commit=$(git -c user.name="github-actions[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
      commit-tree "$arbol" -m "Datos del $(date +%F)")
    git push -q -f origin "$commit:refs/heads/datos"
    rm -rf "$tmp" "$GIT_INDEX_FILE"
    ;;
esac
