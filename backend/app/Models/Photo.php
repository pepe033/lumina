<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'filename',
        'path',
        'size',
        'mime_type',
        'width',
        'height',
        'data',
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    // Hide the binary data from default JSON serialization
    protected $hidden = ['data'];

    // Ensure 'url' accessor is included when model is serialized to array/json
    protected $appends = ['url'];

    /**
     * Get the user that owns the photo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL for the photo
     */
    public function getUrlAttribute(): string
    {
        // If binary data is present, return a data URI so the frontend can display the image
        if (!empty($this->data)) {
            $mime = $this->mime_type ?: 'application/octet-stream';
            // Ensure we have binary string to base64-encode
            $binary = $this->data;
            if (is_resource($binary)) {
                // If stored as a stream resource, read it
                rewind($binary);
                $binary = stream_get_contents($binary);
            }
            $base64 = base64_encode($binary);
            return "data:{$mime};base64,{$base64}";
        }

        // Use the public disk to generate a URL. Falls back to asset helper.
        try {
            return Storage::disk('public')->url($this->path);
        } catch (\Throwable $e) {
            return asset('storage/' . $this->path);
        }
    }
}