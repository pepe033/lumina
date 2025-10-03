# Lumina — Photo Editor (instrukcja po polsku)

Lumina to prosty edytor zdjęć: frontend w React (TypeScript) + backend API w Laravel. W tym repo znajdziesz skrypty ułatwiające przygotowanie i uruchomienie całego stosu (frontend + backend) za pomocą Dockera.

Krótko — najważniejsze zmiany i zachowanie projektu:
- Zdjęcia są przechowywane w bazie danych w kolumnie `data` jako BLOB (binary). Dzięki temu pliki mogą być usuwane z dysku po poprawnym zapisaniu w DB.
- Po zaimportowaniu lub zsynchronizowaniu zdjęcia oryginalne pliki na dysku (storage/public/photos/...) są usuwane — zarówno podczas masowego importu (`photos:import-from-storage`), synchronizacji (`photos:sync-to-db`) jak i uploadu przez API.
- Frontend został zmodyfikowany, aby wyświetlać obrazy bezpośrednio z pola `url` zwracanego przez API; jeśli `url` to data-URI (base64), nie trzeba pobierać dodatkowego bloba.

Spis treści
- Wymagania
- Szybkie uruchomienie (Docker)
- Uruchamianie lokalne
- Przydatne skrypty
- Czyszczenie bazy i import zdjęć
- Testy i debug

## Wymagania
- Docker (zalecane: Docker Desktop)
- docker-compose lub `docker compose`
- (opcjonalnie lokalnie) Node.js, npm, PHP, Composer — skrypty radzą sobie kiedy brak tych narzędzi lokalnie i wykonają instalacje wewnątrz kontenerów.

## Szybkie uruchomienie (Docker, rekomendowane)
1. Nadaj prawa uruchomienia skryptom i uruchom:

```bash
chmod +x scripts/*.sh
./scripts/start_full.sh
```

Skrypt `start_full.sh` jest prostym wrapperem wywołującym `scripts/setup_and_up.sh` (przygotowuje pliki, instaluje zależności lokalnie jeśli dostępne, ustawia `REACT_APP_API_URL` w `frontend/.env`, uruchamia `docker-compose` i czeka aż serwisy odpowiadają).

Kilka przydatnych zmiennych środowiskowych (opcjonalne):
- SKIP_COMPOSER=1 — pominie lokalne `composer install` (zrób to jeśli chcesz, żeby instalacja odbyła się w kontenerze)
- SKIP_NPM=1 — pominie lokalne `npm ci`
- SKIP_MIGRATE=1 — pominie uruchomienie migracji
- SKIP_DOCKER=1 — przygotuje pliki, ale nie uruchomi Dockera

Przykłady:

```bash
# pełne uruchomienie (domyślnie użyje lokalnego composer/npm jeśli dostępne)
./scripts/start_full.sh

# jeśli chcesz, żeby composer/npm były wykonane wewnątrz kontenera zamiast lokalnie:
SKIP_COMPOSER=1 SKIP_NPM=1 ./scripts/start_full.sh
```

Po udanym starcie:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Uruchamianie lokalne (bez Dockera)
Backend (Laravel):

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

Frontend (React):

```bash
cd frontend
npm ci
cp .env.example .env   # jeśli istnieje
# Ustaw w frontend/.env REACT_APP_API_URL na http://localhost:8000/api jeśli uruchamiasz backend lokalnie
npm start
```

## Przydatne skrypty (w katalogu `scripts/`)
- `scripts/start_full.sh` — convenience wrapper, wywołuje `setup_and_up.sh`
- `scripts/setup_and_up.sh` — główny skrypt przygotowujący środowisko (kopiuje .env, tworzy plik sqlite, instaluje zależności lokalnie lub w kontenerze, ustawia env frontend, uruchamia docker-compose i migracje)
- `scripts/up.sh` — prosty wrapper uruchamiający `docker-compose up -d --build` i czeka na dostępność serwisów
- `scripts/down.sh` — zatrzymuje stack (usuwa kontenery)
- `scripts/reset_db_and_migrate.sh` — tworzy kopię zapasową sqlite (jeśli istnieje), resetuje plik sqlite i uruchamia migracje (lokalnie lub w kontenerze)

## Czyszczenie bazy i import zdjęć
- Wyczyszczenie bazy (sqlite) i migracje:

```bash
# lokalnie
./scripts/reset_db_and_migrate.sh

# lub uruchomić wewnątrz kontenera po starcie
docker-compose exec backend php artisan migrate:fresh --seed
```

- Import zdjęć (jeśli masz zdjęcia w `backend/storage/app/public/photos`):

```bash
# Importuje pliki z storage/app/public/{dir} do tabeli photos (kolumna data jako BLOB)
# Po udanym imporcie pliki zostaną usunięte z dysku
cd backend
php artisan photos:import-from-storage --user=1 --dir=photos

# Alternatywnie, jeśli chcesz jedynie zsynchronizować brakujące bloby:
php artisan photos:sync-to-db
```

## Testowanie wyświetlania zdjęć
- Frontend używa teraz pola `url` zwracanego przez API. Jeśli `url` to data-URI (zawartość BLOB base64), obraz zostanie wyświetlony bez odwołań do plików na dysku.
- Możesz też pobrać surowy obraz przez endpoint (jeśli zapisano blob lub plik istnieje):

  GET /api/v1/photos/{id}/raw  -> zwraca treść obrazu (Content-Type ustawiony)

## Debug i najczęstsze błędy
- Błąd: "Cannot connect to the Docker daemon at unix:///... Is the docker daemon running?"
  - Upewnij się, że Docker Desktop jest uruchomiony i że Twój użytkownik ma dostęp do socketu docker (na macOS zwykle Docker Desktop naprawia uprawnienia automatycznie).
  - Uruchom `docker ps` aby sprawdzić, czy demon działa.

- Podczas budowy obrazu backend w Dockerfile może pojawić się błąd: `Could not open input file: artisan` — oznacza to, że w trakcie budowy obrazu ścieżka robocza nie zawiera pliku `artisan` (często spowodowane złym kontekstem build lub wolumenem nadpisującym pliki). Rozwiązania:
  - Upewnij się, że `docker-compose.yml` używa poprawnego `context: ./backend` i Dockerfile w `backend/Dockerfile` jest poprawnie skonfigurowany.
  - Jeżeli budujesz obraz, a potem montujesz wolumen `./backend:/var/www/html`, lokalna zawartość może nadpisać to, co skopiowałeś do obrazu; w takim wypadku instalacja zależności powinna być wykonywana po montowaniu lub korzystaj z `docker-compose run --rm backend composer install`.

## Co zrobiłem w kodzie (zmiany ważne dla projektu)
- Backend (Laravel):
  - Komenda `photos:import-from-storage` teraz po pomyślnym zapisaniu obrazu jako BLOB usuwa źródłowy plik z dysku.
  - Komenda `photos:sync-to-db` podczas synchronizacji również usuwa plik z dysku po zapisaniu BLOB.
  - `PhotoController::store` (upload) zapisuje BLOB do kolumny `data` i po udanym zapisie próbuje usunąć kopię pliku na dysku.
  - Model `Photo` dodał accessor `url` który zwraca `data:<mime>;base64,<base64>` kiedy `data` istnieje — frontend może korzystać z tego pola bez dodatkowych zapytań.

- Frontend (React):
  - `DashboardPage` został zmieniony tak, aby używać `photo.url` jeżeli jest to data-URI; wtedy nie tworzy obiektów URL i nie potrzebuje pobierać bloba.
  - Poprawiłem drobne ostrzeżenia ESLint wynikające z wcześniej dodanego kodu.

## Mapa wymagań -> status
- README w języku polskim: Done (zaktualizowany)
- Skrypt uruchamiający oba serwery w Docker i przygotowujący frontend/backend: Done (`scripts/start_full.sh` + `scripts/setup_and_up.sh`)
- Weryfikacja i instalacja zależności, migracje: Done (skrypt `setup_and_up.sh` zarządza tymi krokami i potrafi uruchamiać komendy w kontenerach jeśli lokalne narzędzia nie są dostępne)
- Zapisywanie zdjęć do DB jako BLOB + usuwanie plików po imporcie: Done (komendy `photos:import-from-storage`, `photos:sync-to-db`, oraz `PhotoController::store`)
- Frontend wyświetlający obrazy z BLOB: Done (korekta `DashboardPage` oraz accessor `Photo::getUrlAttribute`)

## Uwagi końcowe i dalsze kroki
- Jeżeli chcesz, mogę:
  - dodać endpoint health (`GET /api/v1/health`) jeśli healthchecky Docker wymagają go,
  - dodać mały skrypt migracji w kontenerze który automatycznie uruchamia `composer install` i `php artisan migrate` podczas pierwszego startu, lub
  - przenieść przechowywanie BLOB do dedykowanej tabeli (jeśli planujesz dużo dużych plików — SQLite może nie być najlepszym wyborem na produkcji).

Jeśli chcesz, uruchomię teraz ponowną kompilację frontendu, a także sprawdzę pliki PHP pod kątem błędów. Napisz "tak" jeśli mam kontynuować testy (build + sprawdzenie błędów).
