# Lumina Photo Editor

Lumina is a modern web-based photo editing application built with ReactJS frontend and Laravel backend. It allows users to upload, edit, and manage their photos online with various editing tools and filters.

## Features

- **User Authentication**: Register and login functionality
- **Photo Upload**: Upload photos with support for multiple formats
- **Photo Editor**: Edit photos with brightness, contrast, saturation adjustments
- **Filters**: Apply various filters to enhance photos
- **Photo Management**: View, organize, and delete photos
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Headless UI & Heroicons** for UI components

### Backend
- **Laravel 11** PHP framework
- **Laravel Sanctum** for API authentication
- **SQLite** database (easily configurable for other databases)
- **RESTful API** architecture

## Project Structure

```
lumina/
├── backend/                 # Laravel Backend API
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/ # API Controllers
│   │   ├── Models/          # Eloquent Models
│   │   └── Services/        # Business Logic
│   ├── config/              # Configuration files
│   ├── database/            # Migrations, seeders, factories
│   ├── routes/              # API routes
│   └── storage/             # File storage
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Auth/        # Authentication components
│   │   │   ├── Photo/       # Photo-related components
│   │   │   ├── Editor/      # Photo editor components
│   │   │   └── Layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── docker/                  # Docker configuration
├── docs/                    # Documentation
└── docker-compose.yml      # Docker Compose setup
```

## Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.2+
- Composer
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pepe033/lumina.git
   cd lumina
   ```

2. **Backend Setup**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   touch database/database.sqlite
   php artisan migrate
   php artisan serve
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

### Docker Setup (Alternative)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

## API Endpoints

### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login user
- `POST /api/v1/logout` - Logout user

### Photos
- `GET /api/v1/photos` - Get user's photos
- `POST /api/v1/photos` - Upload new photo
- `GET /api/v1/photos/{id}` - Get specific photo
- `PUT /api/v1/photos/{id}` - Update photo metadata
- `DELETE /api/v1/photos/{id}` - Delete photo

### Photo Editing
- `POST /api/v1/photos/{id}/resize` - Resize photo
- `POST /api/v1/photos/{id}/crop` - Crop photo
- `POST /api/v1/photos/{id}/brightness` - Adjust brightness
- `POST /api/v1/photos/{id}/contrast` - Adjust contrast
- `POST /api/v1/photos/{id}/filter` - Apply filter

## Development

### Frontend Development
```bash
cd frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Backend Development
```bash
cd backend
php artisan serve  # Start development server
php artisan migrate # Run migrations
php artisan test   # Run tests
```

## Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Docker Production
```bash
docker-compose --profile production up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
