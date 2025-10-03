#!/usr/bin/env bash
# Skrypt: scripts/reset_db_and_migrate.sh
# Co robi:
#  - tworzy kopię zapasową pliku backend/database/database.sqlite (jeśli istnieje)
#  - tworzy nowy pusty plik sqlite
#  - próbuje uruchomić migracje lokalnie (php artisan migrate) lub wewnątrz kontenera Docker jeśli demon jest aktywny
#  - opcjonalnie synchronizuje pliki z storage do DB (photos:sync-to-db) jeśli SYNC=1

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DB="$DIR/backend/database/database.sqlite"
COMPOSE_FILE="$DIR/docker-compose.yml"
SYNC=${SYNC:-0}

timestamp() { date +%s; }

# Backup existing DB
if [ -f "$BACKEND_DB" ]; then
  bak="$BACKEND_DB.bak.$(timestamp)"
  echo "Tworzę kopię zapasową bazy: $bak"
  mv "$BACKEND_DB" "$bak"
fi

# Recreate empty DB file
mkdir -p "$(dirname "$BACKEND_DB")"
touch "$BACKEND_DB"
chmod 664 "$BACKEND_DB" || true

echo "Utworzono nową pustą bazę: $BACKEND_DB"

# Helper: detect docker compose command
get_docker_compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  else
    return 1
  fi
}

DOCKER_COMPOSE_CMD=""
if get_docker_compose_cmd >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
fi

# If Docker daemon is running, prefer running migrations inside container
if [ -n "$DOCKER_COMPOSE_CMD" ] && docker info >/dev/null 2>&1; then
  echo "Wykryto Docker. Uruchamiam migracje wewnątrz kontenera backend..."
  # build and start backend if not running
  eval "$DOCKER_COMPOSE_CMD -f \"$COMPOSE_FILE\" up -d --build backend"
  eval "$DOCKER_COMPOSE_CMD -f \"$COMPOSE_FILE\" exec backend php artisan migrate --force"
  if [ "$SYNC" = "1" ]; then
    echo "SYNC=1 — uruchamiam photos:sync-to-db wewnątrz kontenera"
    eval "$DOCKER_COMPOSE_CMD -f \"$COMPOSE_FILE\" exec backend php artisan photos:sync-to-db"
  fi
  echo "Migracje wykonane w kontenerze."
  exit 0
fi

# Fallback: spróbuj uruchomić migracje lokalnie (jeśli PHP/artisan dostępne)
if command -v php >/dev/null 2>&1 && [ -f "$DIR/backend/artisan" ]; then
  echo "Uruchamiam migracje lokalnie (php artisan migrate)"
  (cd "$DIR/backend" && php artisan migrate --force)
  if [ "$SYNC" = "1" ]; then
    echo "SYNC=1 — uruchamiam photos:sync-to-db lokalnie"
    (cd "$DIR/backend" && php artisan photos:sync-to-db)
  fi
  echo "Migracje lokalne zakończone."
  exit 0
fi

echo "Nie mogę uruchomić migracji automatycznie: nie wykryto działającego Dockera ani lokalnego PHP/artisan."
echo "Uruchom migracje ręcznie, np. z kontenera:
  docker-compose -f $COMPOSE_FILE exec backend php artisan migrate --force
lub lokalnie:
  cd backend && php artisan migrate"

exit 0

