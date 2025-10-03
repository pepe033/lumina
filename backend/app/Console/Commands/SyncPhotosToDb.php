<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Photo;
use Illuminate\Support\Facades\Storage;

class SyncPhotosToDb extends Command
{
    protected $signature = 'photos:sync-to-db {--chunk=100}';
    protected $description = 'Sync photo files from storage disk to database blob column `data` for photos with empty data.';

    public function handle()
    {
        $chunk = (int) $this->option('chunk');
        $this->info("Starting sync (chunk size: {$chunk})...");

        $processed = 0;
        Photo::whereNull('data')->orWhere('data', '')->chunk($chunk, function($photos) use (&$processed) {
            foreach ($photos as $photo) {
                try {
                    if (!$photo->path) {
                        $this->warn("Photo id={$photo->id} has no path, skipping.");
                        continue;
                    }
                    if (!Storage::disk('public')->exists($photo->path)) {
                        $this->warn("File for photo id={$photo->id} not found at path={$photo->path}, skipping.");
                        continue;
                    }
                    $contents = Storage::disk('public')->get($photo->path);
                    if ($contents === null) {
                        $this->warn("Could not read file for photo id={$photo->id}, skipping.");
                        continue;
                    }
                    $photo->data = $contents;
                    $photo->save();

                    // Try to delete original file from public disk after successful save
                    try {
                        if (Storage::disk('public')->exists($photo->path)) {
                            $deleted = Storage::disk('public')->delete($photo->path);
                            if ($deleted) {
                                $this->info("Deleted source file for photo id={$photo->id}: {$photo->path}");
                            } else {
                                $this->warn("Failed to delete source file for photo id={$photo->id} (delete returned false): {$photo->path}");
                            }
                        } else {
                            $this->line("Source file already missing for photo id={$photo->id}: {$photo->path}");
                        }
                    } catch (\Throwable $e) {
                        $this->error("Error deleting source file for photo id={$photo->id}: " . $e->getMessage());
                    }

                    $processed++;
                    $this->line("Synced photo id={$photo->id}");
                } catch (\Throwable $e) {
                    $this->error("Error syncing photo id={$photo->id}: " . $e->getMessage());
                }
            }
        });

        $this->info("Done. Processed: {$processed}");
        return 0;
    }
}
