<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Photo;
use App\Models\User;

class ImportPhotosFromStorage extends Command
{
    protected $signature = 'photos:import-from-storage {--user=1} {--dir=photos}';
    protected $description = 'Import image files from storage/app/public/{dir} into photos table (data blob).';

    public function handle()
    {
        $userId = (int) $this->option('user');
        $dir = $this->option('dir');

        $user = User::find($userId);
        if (!$user) {
            $this->error("User id={$userId} not found. Create a user or pass --user=<id>.");
            return 1;
        }

        $files = Storage::disk('public')->files($dir);
        if (empty($files)) {
            $this->info("No files found in storage disk under: {$dir}");
            return 0;
        }

        $imported = 0;
        foreach ($files as $path) {
            try {
                $filename = basename($path);
                // Skip if already exists by filename
                $exists = Photo::where('filename', $filename)->exists();
                if ($exists) {
                    $this->line("Skipping existing: {$filename}");
                    continue;
                }

                if (!Storage::disk('public')->exists($path)) {
                    $this->warn("File not found: {$path}");
                    continue;
                }

                $contents = Storage::disk('public')->get($path);
                if ($contents === null) {
                    $this->warn("Could not read file: {$path}");
                    continue;
                }

                $size = strlen($contents);
                // Try to detect mime
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $localPath = storage_path('app/public/' . $path);
                $mime = $finfo->file($localPath) ?: 'application/octet-stream';

                $photo = Photo::create([
                    'user_id' => $userId,
                    'title' => $filename,
                    'filename' => $filename,
                    'path' => $path,
                    'size' => $size,
                    'mime_type' => $mime,
                    'data' => $contents,
                ]);

                // If saved successfully, try to remove the original file from the public disk
                try {
                    if (Storage::disk('public')->exists($path)) {
                        $deleted = Storage::disk('public')->delete($path);
                        if ($deleted) {
                            $this->info("Deleted source file from storage: {$path}");
                        } else {
                            $this->warn("Failed to delete source file (delete returned false): {$path}");
                        }
                    } else {
                        $this->line("Source file already missing: {$path}");
                    }
                } catch (\Throwable $e) {
                    $this->error("Error deleting source file {$path}: " . $e->getMessage());
                }

                $imported++;
                $this->info("Imported: {$filename} as id={$photo->id}");
            } catch (\Throwable $e) {
                $this->error("Error importing {$path}: " . $e->getMessage());
            }
        }

        $this->info("Done. Imported: {$imported}");
        return 0;
    }
}
