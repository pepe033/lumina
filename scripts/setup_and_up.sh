#!/usr/bin/env bash
# Skrypt: scripts/setup_and_up.sh
# Działa: przygotowuje frontend i backend do uruchomienia (kopiuje pliki .env, tworzy sqlite,
# instaluje zależności jeśli dostępne, ustawia REACT_APP_API_URL w frontend/.env),
# weryfikuje obecność docker/docker-compose, a następnie uruchamia docker-compose i czeka na gotowość serwisów.
#
# Zmienne środowiskowe opcjonalne:
#  SKIP_MIGRATE=1  - pominie uruchamianie migracji artisan
#  SKIP_COMPOSER=1 - pominie 'composer install'
#  SKIP_NPM=1      - pominie instalację npm
#  SKIP_DOCKER=1   - pominie uruchamianie docker-compose (tryb suchy)
#
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DIR/docker-compose.yml"
FRONTEND_DIR="$DIR/frontend"
BACKEND_DIR="$DIR/backend"
SQLITE_FILE="$BACKEND_DIR/database/database.sqlite"
TIMEOUT=${TIMEOUT:-120}
INTERVAL=2

# Zmienne sterujące (domyślnie uruchamiaj wszystko)
SKIP_COMPOSER=${SKIP_COMPOSER:-0}
SKIP_NPM=${SKIP_NPM:-0}
SKIP_DOCKER=${SKIP_DOCKER:-0}

need_composer_in_container=0
need_npm_in_container=0

check_cmd() {
  command -v "$1" >/dev/null 2>&1
}

# detect docker-compose command (docker-compose or docker compose)
get_docker_compose_cmd() {
  if check_cmd docker-compose; then
    echo "docker-compose"
  elif check_cmd docker && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  else
    return 1
  fi
}

DOCKER_COMPOSE_CMD=""
if [ "$SKIP_DOCKER" != "1" ]; then
  DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd) || true
  if [ -z "$DOCKER_COMPOSE_CMD" ]; then
    echo "Błąd: ani 'docker-compose' ani 'docker compose' nie są dostępne. Zainstaluj jedno z nich." >&2
    exit 1
  fi
fi

echo "Przygotowanie projektu Lumina: frontend + backend"

# Wymagane: docker i docker-compose (jeśli nie pomijamy uruchomienia dockera)
if [ "$SKIP_DOCKER" != "1" ]; then
  if ! check_cmd docker; then
    echo "Błąd: Docker nie jest zainstalowany lub nie jest w PATH. Zainstaluj Docker i spróbuj ponownie." >&2
    exit 1
  fi
  if [ -z "$DOCKER_COMPOSE_CMD" ]; then
    echo "Błąd: docker-compose nie jest dostępny i 'docker compose' również nie działa."
    exit 1
  fi
else
  echo "SKIP_DOCKER=1 — pomijam sprawdzenie narzędzi Docker/docker-compose i uruchomienie kontenerów."
fi

# 1) Backend: skopiuj .env, utwórz sqlite, composer install, php artisan key:generate
if [ -f "$BACKEND_DIR/.env.example" ] && [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "Tworzę backend/.env z backend/.env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

# Upewnij się, że katalog database istnieje i plik sqlite istnieje
if [ ! -d "$BACKEND_DIR/database" ]; then
  echo "Tworzę katalog $BACKEND_DIR/database"
  mkdir -p "$BACKEND_DIR/database"
fi
if [ ! -f "$SQLITE_FILE" ]; then
  echo "Tworzę plik SQLite: $SQLITE_FILE"
  touch "$SQLITE_FILE"
  chmod 664 "$SQLITE_FILE" || true
fi

# Composer install (jeśli composer jest dostępny i nie pomijamy)
if [ "$SKIP_COMPOSER" != "1" ]; then
  if check_cmd composer; then
    echo "Uruchamiam: composer install (backend)"
    (cd "$BACKEND_DIR" && composer install --no-interaction)
  else
    echo "composer nie znaleziony lokalnie — po uruchomieniu dockera spróbuję zainstalować zależności wewnątrz kontenera backend."
    need_composer_in_container=1
  fi
else
  echo "SKIP_COMPOSER=1 — pomijam 'composer install'."
fi

# Generuj klucz aplikacji jeśli php dostępny i artisan istnieje
local_php_available=0
if check_cmd php && [ -f "$BACKEND_DIR/artisan" ]; then
  echo "Generuję klucz aplikacji (php artisan key:generate) lokalnie"
  (cd "$BACKEND_DIR" && php artisan key:generate) || true
  local_php_available=1
else
  echo "php lub artisan nie są dostępne lokalnie — jeśli to konieczne, spróbuję uruchomić komendy Artisan wewnątrz kontenera po uruchomieniu Docker."
fi

# 2) Frontend: skopiuj .env.example -> .env i ustaw REACT_APP_API_URL
if [ -f "$FRONTEND_DIR/.env.example" ] && [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "Tworzę frontend/.env z frontend/.env.example"
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
fi

# Ustaw REACT_APP_API_URL na adres kontenera backend (backend:8000) — ważne przy uruchomieniu w docker-compose
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env"
API_LINE="REACT_APP_API_URL=http://backend:8000/api"
if [ -f "$FRONTEND_ENV_FILE" ]; then
  if grep -q '^REACT_APP_API_URL=' "$FRONTEND_ENV_FILE"; then
    echo "Aktualizuję REACT_APP_API_URL w frontend/.env -> http://backend:8000/api"
    awk -v val="$API_LINE" 'BEGIN{changed=0} /^REACT_APP_API_URL=/{print val; changed=1; next} {print} END{if(!changed) print val}' "$FRONTEND_ENV_FILE" > "$FRONTEND_ENV_FILE.tmp" && mv "$FRONTEND_ENV_FILE.tmp" "$FRONTEND_ENV_FILE"
  else
    echo "$API_LINE" >> "$FRONTEND_ENV_FILE"
  fi
else
  echo "$API_LINE" > "$FRONTEND_ENV_FILE"
fi

# Instalacja zależności frontendu, jeśli npm jest dostępny i nie pomijamy
if [ "$SKIP_NPM" != "1" ]; then
  if check_cmd npm; then
    echo "Instaluję zależności frontendu (npm ci)..."
    (cd "$FRONTEND_DIR" && npm ci)
  else
    echo "npm nie znaleziony lokalnie — po uruchomieniu dockera spróbuję uruchomić 'npm ci' wewnątrz kontenera frontend."
    need_npm_in_container=1
  fi
else
  echo "SKIP_NPM=1 — pomijam instalację zależności frontendu."
fi

# Opcjonalnie uruchom migracje — można pominąć przez ustawienie SKIP_MIGRATE=1
migrate_locally=0
if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  if [ $local_php_available -eq 1 ]; then
    echo "Uruchamiam migracje lokalnie: php artisan migrate --force"
    (cd "$BACKEND_DIR" && php artisan migrate --force) || echo "Migracje nie powiodły się lub już zostały zastosowane."
    migrate_locally=1
  else
    echo "Nie mogę uruchomić migracji lokalnie — jeśli backend będzie działać w kontenerze, spróbuję uruchomić migracje wewnątrz kontenera po starcie."
    migrate_locally=0
  fi
else
  echo "Pominięto migracje (SKIP_MIGRATE=1)."
fi

# 3) Uruchom docker-compose i czekaj na serwisy (chyba że SKIP_DOCKER=1)
cd "$DIR"

if [ "$SKIP_DOCKER" = "1" ]; then
  echo "SKIP_DOCKER=1 — pomijam uruchomienie docker-compose. Kończę skrypt po przygotowaniu plików."
  exit 0
fi

echo "Uruchamiam $DOCKER_COMPOSE_CMD i buduję obrazy..."
# Use eval to support multi-word command like 'docker compose'
eval "$DOCKER_COMPOSE_CMD -f \"$COMPOSE_FILE\" up -d --build"

# Jeśli composer/npm nie było dostępne lokalnie, próbuj zainstalować wewnątrz kontenerów
if [ $need_composer_in_container -eq 1 ]; then
  echo "Uruchamiam 'composer install' wewnątrz kontenera backend..."
  eval "$DOCKER_COMPOSE_CMD run --rm backend composer install --no-interaction" || echo "composer w kontenerze nie powiódł się. Sprawdź logi obrazu backend."
fi

if [ $need_npm_in_container -eq 1 ]; then
  echo "Uruchamiam 'npm ci' wewnątrz kontenera frontend..."
  eval "$DOCKER_COMPOSE_CMD run --rm frontend npm ci" || echo "npm w kontenerze nie powiódł się. Sprawdź logi obrazu frontend."
fi

# Jeśli migracje nie wykonano lokalnie i nie pominięto, uruchom migracje w kontenerze
if [ "${SKIP_MIGRATE:-0}" != "1" ] && [ $migrate_locally -eq 0 ]; then
  echo "Uruchamiam migracje wewnątrz kontenera backend..."
  # używamy exec, zakładając że serwis backend działa
  eval "$DOCKER_COMPOSE_CMD exec backend php artisan migrate --force" || echo "Migracje w kontenerze nie powiodły się. Sprawdź logi kontenera backend."
fi

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

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

if ! wait_for_url "$BACKEND_URL" "backend" "$TIMEOUT"; then
  echo "Błąd: backend nie uruchomił się poprawnie. Sprawdź logi." >&2
  exit 1
fi

if ! wait_for_url "$FRONTEND_URL" "frontend" "$TIMEOUT"; then
  echo "Błąd: frontend nie uruchomił się poprawnie. Sprawdź logi." >&2
  exit 1
fi

cat <<EOF
Gotowe — serwisy działają:
- Frontend: $FRONTEND_URL
- Backend API: $BACKEND_URL

Aby śledzić logi w czasie rzeczywistym:
  $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs -f frontend backend
Aby zatrzymać stack:
  ./scripts/down.sh
EOF

exit 0

