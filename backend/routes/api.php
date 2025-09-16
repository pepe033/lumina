<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// API Routes for Photo Editor
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', 'App\Http\Controllers\AuthController@register');
    Route::post('/login', 'App\Http\Controllers\AuthController@login');
    Route::post('/logout', 'App\Http\Controllers\AuthController@logout')->middleware('auth:sanctum');
    
    // Photo management routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/photos', 'App\Http\Controllers\PhotoController@index');
        Route::post('/photos', 'App\Http\Controllers\PhotoController@store');
        Route::get('/photos/{photo}', 'App\Http\Controllers\PhotoController@show');
        Route::put('/photos/{photo}', 'App\Http\Controllers\PhotoController@update');
        Route::delete('/photos/{photo}', 'App\Http\Controllers\PhotoController@destroy');
        
        // Photo editing operations
        Route::post('/photos/{photo}/resize', 'App\Http\Controllers\PhotoEditController@resize');
        Route::post('/photos/{photo}/crop', 'App\Http\Controllers\PhotoEditController@crop');
        Route::post('/photos/{photo}/filter', 'App\Http\Controllers\PhotoEditController@applyFilter');
        Route::post('/photos/{photo}/brightness', 'App\Http\Controllers\PhotoEditController@adjustBrightness');
        Route::post('/photos/{photo}/contrast', 'App\Http\Controllers\PhotoEditController@adjustContrast');
    });
    
    // Public routes
    Route::get('/filters', 'App\Http\Controllers\FilterController@index');
});