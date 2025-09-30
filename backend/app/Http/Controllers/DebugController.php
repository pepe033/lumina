<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DebugController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $files = [];
        foreach ($request->allFiles() as $key => $file) {
            if (is_array($file)) {
                $files[$key] = array_map(function ($f) {
                    return [
                        'originalName' => $f->getClientOriginalName(),
                        'mime' => $f->getClientMimeType(),
                        'php_mime' => $f->getMimeType(),
                        'size' => $f->getSize(),
                        'is_valid' => $f->isValid(),
                    ];
                }, $file);
            } else {
                $files[$key] = [
                    'originalName' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'php_mime' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'is_valid' => $file->isValid(),
                ];
            }
        }

        $data = [
            'headers' => [
                'content_type' => $request->header('Content-Type'),
                'accept' => $request->header('Accept'),
                'origin' => $request->header('Origin'),
                'authorization' => $request->header('Authorization'),
                'x_requested_with' => $request->header('X-Requested-With'),
            ],
            'input' => $request->all(),
            'files_keys' => array_keys($request->allFiles()),
            'files' => $files,
            'raw' => bin2hex(substr((string) $request->getContent(), 0, 512)),
        ];

        return response()->json($data);
    }
}

