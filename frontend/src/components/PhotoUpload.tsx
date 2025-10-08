import React, { useState, useRef } from 'react';
import { photoAPI } from '../services/api';
import { PhotoUploadProps } from '../types';

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File | null): void => {
        if (file) {
            if (file.type.startsWith('image/')) {
                setSelectedFile(file);
                setError('');

                // Create preview URL
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setError('Proszę wybrać plik obrazu (JPG, PNG, GIF, itp.)');
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        handleFileChange(file || null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        handleFileChange(file || null);
    };

    const handleUpload = async (): Promise<void> => {
        if (!selectedFile) {
            setError('Proszę wybrać plik');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('photo', selectedFile);
            formData.append('title', selectedFile.name);

            const response = await photoAPI.uploadPhoto(formData);

            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }

            // Reset state
            setSelectedFile(null);
            setPreviewUrl('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err: any) {
            console.error('Upload error full object:', err);
            const resp = err?.response?.data;
            if (resp) {
                console.error('Upload error response.data:', resp);
                if (resp.errors) {
                    const messages: string[] = [];
                    Object.keys(resp.errors).forEach((key) => {
                        const val = resp.errors[key];
                        if (Array.isArray(val)) {
                            messages.push(...val);
                        } else if (typeof val === 'string') {
                            messages.push(val);
                        }
                    });
                    setError(messages.join(' | '));
                } else if (resp.message) {
                    setError(resp.message);
                } else {
                    setError('Błąd podczas przesyłania pliku');
                }
            } else {
                setError('Błąd podczas przesyłania pliku');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = (): void => {
        setSelectedFile(null);
        setPreviewUrl('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Prześlij zdjęcie
                    </h2>
                    <p className="text-blue-100 mt-2">Dodaj swoje ulubione zdjęcia do galerii</p>
                </div>

                <div className="p-8">
                    {!selectedFile ? (
                        /* Drop zone */
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                border-3 border-dashed rounded-xl p-12 text-center cursor-pointer
                                transition-all duration-300 ease-in-out
                                ${isDragging 
                                    ? 'border-blue-400 bg-blue-500/10 scale-105' 
                                    : 'border-slate-600/50 bg-slate-900/30 hover:border-blue-400/50 hover:bg-slate-900/50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                disabled={uploading}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center gap-4">
                                <div className={`
                                    w-20 h-20 rounded-full flex items-center justify-center
                                    ${isDragging ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'}
                                    transition-all duration-300
                                `}>
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>

                                <div>
                                    <p className="text-xl font-semibold text-slate-200 mb-2">
                                        {isDragging ? 'Upuść plik tutaj' : 'Przeciągnij i upuść zdjęcie'}
                                    </p>
                                    <p className="text-slate-400">
                                        lub <span className="text-blue-400 font-medium">kliknij, aby wybrać plik</span>
                                    </p>
                                    <p className="text-sm text-slate-500 mt-3">
                                        Obsługiwane formaty: JPG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview and upload section */
                        <div className="space-y-6">
                            <div className="relative rounded-xl overflow-hidden bg-slate-900/50 border-2 border-slate-700/50">
                                {previewUrl && (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-64 object-contain"
                                    />
                                )}
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <svg className="w-8 h-8 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className={`
                                        flex-1 py-4 px-6 rounded-xl font-semibold text-lg
                                        transition-all duration-300 transform
                                        flex items-center justify-center gap-3
                                        ${uploading
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50'
                                        }
                                        text-white shadow-md
                                    `}
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Przesyłanie...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Prześlij zdjęcie
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleCancel}
                                    disabled={uploading}
                                    className="px-6 py-4 rounded-xl font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-400 font-medium">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoUpload;
