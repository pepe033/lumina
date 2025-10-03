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
                // Log validation errors for debugging (concise)
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

            // Additional debug logging about file (concise)
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

            // Read raw binary data to store in DB
            $data = null;
            if ($photoFile && $photoFile->isValid()) {
                $realPath = $photoFile->getRealPath();
                if ($realPath && file_exists($realPath)) {
                    $data = file_get_contents($realPath);
                }
            }

            // Store a copy on disk as backup/for compatibility
            $path = $photoFile->storeAs('photos', $filename, 'public');

            $photo = Photo::create([
                'user_id' => $request->user()->id,
                'title' => $request->title ?? $photoFile->getClientOriginalName(),
                'filename' => $filename,
                'path' => $path,
                'size' => $photoFile->getSize(),
                'mime_type' => $photoFile->getMimeType(),
                'data' => $data,
            ]);

            // Try to remove the stored file from disk after saving blob to DB
            try {
                if ($path && Storage::disk('public')->exists($path)) {
                    $deleted = Storage::disk('public')->delete($path);
                    if ($deleted) {
                        \Log::info("Removed stored file after DB save: {$path}", ['photo_id' => $photo->id]);
                    } else {
                        \Log::warning("Failed to remove stored file after DB save (delete returned false): {$path}", ['photo_id' => $photo->id]);
                    }
                } else {
                    \Log::info("Stored file not present when attempting cleanup: {$path}", ['photo_id' => $photo->id]);
                }
            } catch (\Throwable $e) {
                \Log::error('Error removing stored file after save', ['path' => $path, 'error' => $e->getMessage(), 'photo_id' => $photo->id]);
            }

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
     * Return raw binary image data
     */
    public function raw(Request $request, Photo $photo)
    {
        // Ensure user owns the photo
        if ($photo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Serve from DB blob if available
        if (!empty($photo->data)) {
            return response($photo->data, 200)
                ->header('Content-Type', $photo->mime_type)
                ->header('Content-Length', strlen($photo->data));
        }

        // Fallback to storage disk if blob missing
        if (Storage::disk('public')->exists($photo->path)) {
            $fileContents = Storage::disk('public')->get($photo->path);
            return response($fileContents, 200)
                ->header('Content-Type', $photo->mime_type)
                ->header('Content-Length', strlen($fileContents));
        }

        return response()->json(['message' => 'Not Found'], 404);
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
