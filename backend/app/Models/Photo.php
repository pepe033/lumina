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
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

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
        // Use the public disk to generate a URL. Falls back to asset helper.
        try {
            return Storage::disk('public')->url($this->path);
        } catch (\Throwable $e) {
            return asset('storage/' . $this->path);
        }
    }
}