#!/usr/bin/env bash
# Skrypt convenience: scripts/start_full.sh
# Wywołuje scripts/setup_and_up.sh z sensownymi domyślnymi opcjami.
# Użycie:
#   ./scripts/start_full.sh        # pełne przygotowanie i uruchomienie (z Docker)
#   SKIP_COMPOSER=1 ./scripts/start_full.sh   # pominie composer install lokalnie
#   SKIP_NPM=1 ./scripts/start_full.sh        # pominie npm ci lokalnie
#   SKIP_DOCKER=1 ./scripts/start_full.sh     # przygotuj pliki, nie uruchamiaj dockera

set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$DIR/scripts/setup_and_up.sh"

if [ ! -f "$SCRIPT" ]; then
  echo "Nie znaleziono $SCRIPT. Upewnij się, że jesteś w katalogu projektu." >&2
  exit 1
fi

# Przekaż wszystkie argumenty i zmienne środowiskowe dalej
exec "$SCRIPT" "$@"

