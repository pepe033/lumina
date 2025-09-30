<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Models\Photo;
use Throwable;

class PhotoController extends Controller
{
    /**
     * Display a listing of user's photos
     */
    public function index(Request $request): JsonResponse
    {
        $photos = Photo::where('user_id', $request->user()->id)
            ->where('filename', 'not like', '%converted_%')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($photos);
    }

    /**
     * Store a newly uploaded photo
     */
    public function store(Request $request): JsonResponse
    {
        // If request is not authenticated, return JSON 401 instead of redirecting
        if (!$request->user()) {
            \Log::warning('Unauthenticated photo upload attempt', [
                'headers' => [
                    'authorization' => $request->header('Authorization'),
                    'origin' => $request->header('Origin'),
                ],
            ]);

            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Log incoming request for debugging (temporary)
        \Log::info('Photo upload request received', [
            'user_id' => $request->user()->id,
            'files' => array_keys($request->allFiles()),
            'headers' => [
                'content_type' => $request->header('Content-Type'),
                'accept' => $request->header('Accept'),
                'x_requested_with' => $request->header('X-Requested-With'),
            ],
        ]);

        try {
            try {
                $request->validate([
                    // Accept common image types including webp and avif
                    'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp,avif,bmp,svg|max:10240', // 10MB max
                    'title' => 'nullable|string|max:255',
                ]);
            } catch (ValidationException $e) {
                // Log validation errors for debugging
                \Log::warning('Photo upload validation failed', [
                    'errors' => $e->errors(),
                    'request_keys' => array_keys($request->all()),
                ]);

                // Return validation response (same format as Laravel) for easier debugging
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                ], 422);
            }

            $photoFile = $request->file('photo');

            // Additional debug logging about file
            if ($photoFile) {
                \Log::info('Photo file details', [
                    'original_name' => $photoFile->getClientOriginalName(),
                    'mime' => $photoFile->getClientMimeType(),
                    'php_mime' => $photoFile->getMimeType(),
                    'size' => $photoFile->getSize(),
                    'is_valid' => $photoFile->isValid(),
                ]);
            } else {
                \Log::warning('Photo file is missing after validation passed');
            }

            $filename = time() . '_' . $photoFile->getClientOriginalName();
            $path = $photoFile->storeAs('photos', $filename, 'public');

            $photo = Photo::create([
                'user_id' => $request->user()->id,
                'title' => $request->title ?? $photoFile->getClientOriginalName(),
                'filename' => $filename,
                'path' => $path,
                'size' => $photoFile->getSize(),
                'mime_type' => $photoFile->getMimeType(),
            ]);

            // Refresh the model to get the URL attribute
            $photo->refresh();

            return response()->json($photo, 201);
        } catch (Throwable $e) {
            // Log full exception for debugging
            \Log::error('Photo upload failed with exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Server error during file upload.',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified photo
     */
    public function show(Request $request, Photo $photo): JsonResponse
    {
        // Ensure user owns the photo
        if ($photo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($photo);
    }

    /**
     * Update the specified photo metadata
     */
    public function update(Request $request, Photo $photo): JsonResponse
    {
        // Ensure user owns the photo
        if ($photo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $photo->update($request->only('title'));

        return response()->json([
            'message' => 'Photo updated successfully',
            'photo' => $photo,
        ]);
    }

    /**
     * Remove the specified photo
     */
    public function destroy(Request $request, Photo $photo): JsonResponse
    {
        // Ensure user owns the photo
        if ($photo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete file from storage
        Storage::disk('public')->delete($photo->path);

        // Delete database record
        $photo->delete();

        return response()->json([
            'message' => 'Photo deleted successfully',
        ]);
    }
}
