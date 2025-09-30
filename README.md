# Lumina Photo Editor

Lumina to nowoczesna aplikacja webowa do edycji zdjęć, zbudowana z użyciem frontendowego Reacta (TypeScript) oraz backendu w Laravelu. Umożliwia użytkownikom przesyłanie, edytowanie i zarządzanie zdjęciami online przy użyciu narzędzi takich jak regulacja jasności, kontrastu, nasycenia oraz zestawu filtrów.

## Funkcje

- **Uwierzytelnianie użytkowników**: rejestracja i logowanie
- **Przesyłanie zdjęć**: upload plików (wielu formatów)
- **Edytor zdjęć**: regulacja jasności, kontrastu, nasycenia itp.
- **Filtry**: zastosowanie predefiniowanych efektów
- **Zarządzanie zdjęciami**: wyświetlanie, organizowanie i usuwanie zdjęć
- **Responsywny interfejs**: działa na desktopie i urządzeniach mobilnych

## Stos technologiczny

### Frontend
- React 18 z TypeScript
- Tailwind CSS do stylowania
- React Router do nawigacji
- Axios do komunikacji z API
- Headless UI i Heroicons (opcjonalnie)

### Backend
- Laravel 11 (API)
- Laravel Sanctum do uwierzytelniania API
- SQLite domyślnie (łatwe przełączenie na inną bazę danych)
- Architektura RESTful API

## Struktura projektu

```
lumina/
├── backend/                 # Laravel Backend API
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/ # Kontrolery API
│   │   ├── Models/          # Modele Eloquent
│   │   └── Services/        # Logika biznesowa (jeśli istnieje)
│   ├── config/              # Pliki konfiguracyjne
│   ├── database/            # Migracje, seedy, sqlite
│   ├── routes/              # Trasy API i web
│   └── storage/             # Przechowywanie plików
├── frontend/                # Frontend React
│   ├── src/
│   │   ├── components/      # Komponenty React
│   │   ├── pages/           # Strony
│   │   ├── services/        # Warstwa komunikacji z API
│   │   └── types/           # Definicje TypeScript
│   └── public/              # Zasoby statyczne
├── docker/                  # Konfiguracje Docker / nginx
├── README.md                # Ten plik
└── docker-compose.yml      # Konfiguracja docker-compose
```

> Uwaga: pełna struktura znajduje się w repozytorium (foldery `backend`, `frontend` i inne).

## Szybki start

### Wymagania
- Node.js 18+ (frontend)
- PHP 8.2+ (backend)
- Composer
- Docker (opcjonalnie)

### Uruchomienie lokalne — backend

1. Przejdź do katalogu backend:

```bash
cd backend
```

2. Zainstaluj zależności PHP i przygotuj środowisko:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve
```

Domyślnie backend będzie dostępny na http://127.0.0.1:8000

### Uruchomienie lokalne — frontend

1. Przejdź do katalogu frontend:

```bash
cd frontend
```

2. Zainstaluj zależności i uruchom aplikację deweloperską:

```bash
npm install
cp .env.example .env   # jeśli istnieje plik .env.example
git status --porcelain || true
npm start
```

Frontend domyślnie działa na http://localhost:3000

### Uruchomienie przez Docker (alternatywnie)

Możesz uruchomić cały stos za pomocą docker-compose:

```bash
docker-compose up -d
```

Po uruchomieniu:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Skrypty ułatwiające start (Docker + przygotowanie)

W repo znajduje się zestaw skryptów w katalogu `scripts/`, które automatyzują przygotowanie środowiska i uruchomienie kontenerów:

- `scripts/setup_and_up.sh` — kompletny skrypt przygotowujący frontend i backend oraz uruchamiający Docker Compose.
  - Co robi:
    - Kopiuje `.env.example` -> `.env` (frontend i backend), jeśli brakuje pliku `.env`.
    - Tworzy katalog `backend/database` i plik SQLite `database.sqlite` jeśli brakuje.
    - Próbuje uruchomić `composer install` i `php artisan key:generate` lokalnie (jeśli dostępne). Jeśli `composer`/`npm` nie są zainstalowane lokalnie, po uruchomieniu Docker wykonuje instalację wewnątrz kontenerów.
    - Ustawia w `frontend/.env` wartość `REACT_APP_API_URL=http://backend:8000/api` (optymalne przy uruchomieniu w docker-compose).
    - Uruchamia `docker-compose` (wspiera zarówno `docker-compose`, jak i `docker compose`), buduje obrazy i czeka aż frontend i backend odpowiedzą.
    - Uruchamia migracje (lokalnie lub wewnątrz kontenera), chyba że pominiesz je zmienną środowiskową.
  - Przydatne zmienne środowiskowe:
    - `SKIP_MIGRATE=1` — pominie uruchamianie migracji
    - `SKIP_COMPOSER=1` — pominie lokalne `composer install`
    - `SKIP_NPM=1` — pominie lokalne `npm ci`
    - `SKIP_DOCKER=1` — przygotuje pliki, ale nie uruchomi Dockera (tryb suchy)
    - `TIMEOUT` — czas oczekiwania na zdrowie serwisów (domyślnie 120s)
  - Przykłady:

```bash
# Pełne uruchomienie (jeśli masz docker/docker-compose):
./scripts/setup_and_up.sh

# Suchy test (nie uruchamia docker, composer ani npm):
SKIP_DOCKER=1 SKIP_COMPOSER=1 SKIP_NPM=1 SKIP_MIGRATE=1 ./scripts/setup_and_up.sh

# Pominąć migracje przy uruchamianiu:
SKIP_MIGRATE=1 ./scripts/setup_and_up.sh
```

- `scripts/up.sh` — prostszy wrapper, który uruchamia `docker-compose up -d --build` i czeka aż serwisy odpowiadają. Użyj, jeśli chcesz tylko szybko wystartować stack:

```bash
./scripts/up.sh
```

- `scripts/down.sh` — zatrzymuje kontenery i usuwa wolumeny/orphany:

```bash
./scripts/down.sh
```

Dodatkowe informacje i wskazówki
- W `docker-compose.yml` wartość `REACT_APP_API_URL` jest ustawiona na `http://backend:8000/api` — to poprawna konfiguracja dla środowiska Docker Compose (frontend wewnątrz sieci compose odnosi się do backendu po nazwie usługi). Jeśli uruchamiasz frontend lokalnie (`npm start`), ustaw `REACT_APP_API_URL` na `http://localhost:8000/api` w lokalnym `frontend/.env`.
- Jeśli healthchecky w `docker-compose.yml` nie przechodzą (np. backend nie wystawia root HTTP), rozważ dodanie prostego endpointu health w backendzie (np. `GET /api/health` zwracającego 200) i zaktualizowanie healthchecków.
- Aby śledzić logi kontenerów:

```bash
# Śledź logi frontend i backend
# Jeśli używasz "docker compose" zamiast "docker-compose" zamień komendę odpowiednio
docker-compose -f docker-compose.yml logs -f frontend backend
```

## Punkt końcowy API (przykładowe)

### Uwierzytelnianie
- POST /api/v1/register — rejestracja nowego użytkownika
- POST /api/v1/login — logowanie
- POST /api/v1/logout — wylogowanie

### Zdjęcia
- GET /api/v1/photos — pobierz zdjęcia użytkownika
- POST /api/v1/photos — dodaj/załaduj nowe zdjęcie
- GET /api/v1/photos/{id} — pobierz konkretne zdjęcie
- PUT /api/v1/photos/{id} — aktualizuj metadane zdjęcia
- DELETE /api/v1/photos/{id} — usuń zdjęcie

### Operacje edycji zdjęć
- POST /api/v1/photos/{id}/resize — zmiana rozmiaru
- POST /api/v1/photos/{id}/crop — przycięcie
- POST /api/v1/photos/{id}/brightness — jasność
- POST /api/v1/photos/{id}/contrast — kontrast
- POST /api/v1/photos/{id}/filter — zastosuj filtr

(Uwaga: szczegóły i payloady tych endpointów są zdefiniowane w kontrolerach backendu.)

## Deweloperka

### Frontend

- `npm start` — uruchamia serwer deweloperski
- `npm run build` — buduje wersję produkcyjną
- `npm test` — uruchamia testy (jeśli skonfigurowane)

### Backend

- `php artisan serve` — uruchamia lokalny serwer Laravel
- `php artisan migrate` — uruchamia migracje bazy danych
- `php artisan test` — uruchamia testy PHPUnit

## Wdrażanie

### Build produkcyjny

Frontend:

```bash
cd frontend
npm run build
```

Backend (optymalizacja instalacji PHP):

```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Wdrażanie z Dockerem

```bash
docker-compose --profile production up -d
```

## Wkład i kontrybucja

1. Fork repozytorium
2. Stwórz branch funkcjonalności: `git checkout -b feature/nazwa-funkcji`
3. Wprowadź zmiany i zatwierdź: `git commit -m "Opis zmian"`
4. Wypchnij branch i otwórz Pull Request

## Licencja

Projekt na licencji MIT — zobacz plik LICENSE w repozytorium.

## Pomoc i kontakt

Jeśli masz pytania lub problemy, otwórz issue w repozytorium projektu.

---

Plik README jest przetłumaczony i dostosowany tak, by odzwierciedlać strukturę i instrukcje zawarte w oryginalnym README projektu Lumina.
