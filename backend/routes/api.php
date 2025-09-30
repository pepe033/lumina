<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PhotoEditController;
use App\Http\Controllers\FilterController;
use App\Http\Controllers\DebugController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// API Routes for Photo Editor
Route::prefix('v1')->group(function () {
    // Diagnostic debug route (no auth) - temporary
    Route::post('/debug-upload', [DebugController::class, 'upload']);

    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Photo management routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/photos', [PhotoController::class, 'index']);
        Route::post('/photos', [PhotoController::class, 'store']);
        Route::get('/photos/{photo}', [PhotoController::class, 'show']);
        Route::put('/photos/{photo}', [PhotoController::class, 'update']);
        Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);

        // Photo editing operations
        Route::post('/photos/{photo}/resize', [PhotoEditController::class, 'resize']);
        Route::post('/photos/{photo}/crop', [PhotoEditController::class, 'crop']);
        Route::post('/photos/{photo}/filter', [PhotoEditController::class, 'applyFilter']);
        Route::post('/photos/{photo}/brightness', [PhotoEditController::class, 'adjustBrightness']);
        Route::post('/photos/{photo}/contrast', [PhotoEditController::class, 'adjustContrast']);
    });

    // Public routes
    Route::get('/filters', [FilterController::class, 'index']);
});
