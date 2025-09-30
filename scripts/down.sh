#!/usr/bin/env bash
# Skrypt: scripts/down.sh
# Zatrzymuje i usuwa kontenery uruchomione przez docker-compose
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DIR/docker-compose.yml"

cd "$DIR"

echo "Zatrzymywanie i usuwanie kontenerów (plik: $COMPOSE_FILE)..."
docker-compose -f "$COMPOSE_FILE" down --volumes --remove-orphans

echo "Gotowe."
exit 0

