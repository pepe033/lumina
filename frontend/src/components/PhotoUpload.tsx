import React, { useState } from 'react';
import { photoAPI } from '../services/api';
import { PhotoUploadProps } from '../types';

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                setSelectedFile(file);
                setError('');
            } else {
                setError('Proszę wybrać plik obrazu');
            }
        }
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

            setSelectedFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            console.error('Upload error full object:', err);
            // If server returned validation errors, show them
            const resp = err?.response?.data;
            if (resp) {
                console.error('Upload error response.data:', resp);
                // Laravel validation errors are usually in resp.errors
                if (resp.errors) {
                    // Flatten messages
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

    return (
        <div className="photo-upload">
            <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
            />

            {selectedFile && (
                <div className="selected-file">
                    <p>Wybrany plik: {selectedFile.name}</p>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="upload-btn"
                    >
                        {uploading ? 'Przesyłanie...' : 'Prześlij zdjęcie'}
                    </button>
                </div>
            )}

            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default PhotoUpload;
