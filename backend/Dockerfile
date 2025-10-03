FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite3 \
    libsqlite3-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy only composer files first to leverage Docker layer cache
COPY composer.json composer.lock ./

# Install PHP dependencies without running scripts or autoloader (artisan not yet copied)
RUN composer install --no-dev --prefer-dist --no-autoloader --no-scripts --no-interaction

# Copy application code
COPY . .

# Now that the application files (including artisan) are present, finish autoload and run discovery
RUN composer dump-autoload --optimize && \
    php artisan package:discover --ansi || true

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# Create SQLite database (if not present)
RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite || true

# Ensure PHP upload limits are large enough for uploads
RUN printf "upload_max_filesize=50M\npost_max_size=60M\nmemory_limit=256M\nfile_uploads=1\n" > /usr/local/etc/php/conf.d/uploads.ini

# Expose port 8000
EXPOSE 8000

# Start PHP development server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
