#!/usr/bin/env bash
# Skrypt: scripts/up.sh
# Uruchamia cały docker-compose, buduje obrazy i czeka aż frontend i backend będą dostępne.
set -euo pipefail

# Lokalizacja repozytorium (katalog nadrzędny względem scripts)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DIR/docker-compose.yml"

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000/api/health"
TIMEOUT=${TIMEOUT:-120}
INTERVAL=2

echo "Uruchamiam docker-compose (plik: $COMPOSE_FILE) i buduję obrazy..."
cd "$DIR"
# Uruchom w tle i buduj obrazy
docker-compose -f "$COMPOSE_FILE" up -d --build

wait_for_url() {
  local url="$1" name="$2" timeout="$3" start now code
  echo -n "Sprawdzam $name pod $url ... "
  start=$(date +%s)
  while true; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" || echo "000")
    if [[ "$code" =~ ^[23] ]]; then
      echo "OK (HTTP $code)"
      return 0
    fi
    now=$(date +%s)
    if (( now - start >= timeout )); then
      echo
      echo "Timeout: $name nie odpowiedział w ciągu ${timeout}s (ostatni kod: $code)."
      echo "Sprawdzam status kontenerów..."
      docker-compose -f "$COMPOSE_FILE" ps
      echo "Sprawdź logi: docker-compose -f $COMPOSE_FILE logs --tail=100 $name"
      return 1
    fi
    echo -n "."
    sleep $INTERVAL
  done
}

# Czekaj na backend
if ! wait_for_url "$BACKEND_URL" "backend" "$TIMEOUT"; then
  echo "Błąd: backend nie uruchomił się poprawnie. Zatrzymuję skrypt." >&2
  exit 1
fi

# Czekaj na frontend
if ! wait_for_url "$FRONTEND_URL" "frontend" "$TIMEOUT"; then
  echo "Błąd: frontend nie uruchomił się poprawnie. Zatrzymuję skrypt." >&2
  exit 1
fi

cat <<EOF
Gotowe — serwisy działają:
- Frontend: $FRONTEND_URL
- Backend API: ${BACKEND_URL%%/api/health}

Aby śledzić logi w czasie rzeczywistym:
  docker-compose -f "$COMPOSE_FILE" logs -f frontend backend
Aby zatrzymać stack:
  scripts/down.sh
EOF

# Opcjonalnie pokaż podstawowy status
docker-compose -f "$COMPOSE_FILE" ps

exit 0
