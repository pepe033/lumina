<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Models\Photo;

class PhotoController extends Controller
{
    /**
     * Display a listing of user's photos
     */
    public function index(Request $request): JsonResponse
    {
        $photos = Photo::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($photos);
    }

    /**
     * Store a newly uploaded photo
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
            'title' => 'nullable|string|max:255',
        ]);

        $photoFile = $request->file('photo');
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

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'photo' => $photo,
        ], 201);
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