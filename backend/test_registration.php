<?php

// Simple test script to verify route definitions
echo "Testing Lumina Backend Registration Route\n";
echo "=========================================\n\n";

// Check if routes file exists
$routesFile = __DIR__ . '/routes/api.php';
if (file_exists($routesFile)) {
    echo "✓ API routes file exists\n";
    
    $content = file_get_contents($routesFile);
    if (strpos($content, '/register') !== false) {
        echo "✓ Register route is defined in api.php\n";
    } else {
        echo "✗ Register route NOT found in api.php\n";
    }
} else {
    echo "✗ API routes file does not exist\n";
}

// Check if AuthController exists
$controllerFile = __DIR__ . '/app/Http/Controllers/AuthController.php';
if (file_exists($controllerFile)) {
    echo "✓ AuthController exists\n";
    
    $content = file_get_contents($controllerFile);
    if (strpos($content, 'function register') !== false) {
        echo "✓ Register method exists in AuthController\n";
    } else {
        echo "✗ Register method NOT found in AuthController\n";
    }
} else {
    echo "✗ AuthController does not exist\n";
}

// Check if User model exists
$userModelFile = __DIR__ . '/app/Models/User.php';
if (file_exists($userModelFile)) {
    echo "✓ User model exists\n";
} else {
    echo "✗ User model does not exist\n";
}

// Check migrations
$migrationsDir = __DIR__ . '/database/migrations';
if (is_dir($migrationsDir)) {
    echo "✓ Migrations directory exists\n";
    
    $files = scandir($migrationsDir);
    $usersMigration = false;
    $tokensMigration = false;
    
    foreach ($files as $file) {
        if (strpos($file, 'users') !== false) {
            $usersMigration = true;
        }
        if (strpos($file, 'personal_access_tokens') !== false) {
            $tokensMigration = true;
        }
    }
    
    if ($usersMigration) {
        echo "✓ Users table migration exists\n";
    } else {
        echo "✗ Users table migration missing\n";
    }
    
    if ($tokensMigration) {
        echo "✓ Personal access tokens migration exists\n";
    } else {
        echo "✗ Personal access tokens migration missing\n";
    }
} else {
    echo "✗ Migrations directory does not exist\n";
}

// Check config files
$configDir = __DIR__ . '/config';
if (is_dir($configDir)) {
    echo "✓ Config directory exists\n";
    
    $requiredConfigs = ['app.php', 'auth.php', 'database.php', 'sanctum.php'];
    foreach ($requiredConfigs as $config) {
        if (file_exists($configDir . '/' . $config)) {
            echo "✓ $config exists\n";
        } else {
            echo "✗ $config missing\n";
        }
    }
} else {
    echo "✗ Config directory does not exist\n";
}

echo "\nSummary:\n";
echo "========\n";
echo "The registration functionality should be working once:\n";
echo "1. Composer dependencies are fully installed\n";
echo "2. Database migrations are run\n";
echo "3. Application key is generated\n";
echo "4. Laravel application is started\n\n";

echo "Route: POST /api/v1/register\n";
echo "Expected payload:\n";
echo "{\n";
echo "  \"name\": \"User Name\",\n";
echo "  \"email\": \"user@example.com\",\n";
echo "  \"password\": \"password123\",\n";
echo "  \"password_confirmation\": \"password123\"\n";
echo "}\n\n";

echo "Expected response:\n";
echo "{\n";
echo "  \"message\": \"User registered successfully\",\n";
echo "  \"user\": { ... user data ... },\n";
echo "  \"token\": \"authentication_token\"\n";
echo "}\n";