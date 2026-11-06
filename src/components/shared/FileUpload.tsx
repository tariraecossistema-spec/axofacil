import React, { useState, useRef } from 'react';
import { uploadFileToStorage } from '../../services/supabase';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  acceptTypes?: string;
  folder?: string;
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  buttonText?: string;
}

export default function FileUpload({
  label = 'Anexar imagem ou documento PDF',
  acceptTypes = 'image/jpeg,image/png,image/webp,application/pdf',
  folder = 'uploads',
  onUploadSuccess,
  currentUrl,
  buttonText = 'Escolher ficheiro'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('O ficheiro não pode ultrapassar 10 MB.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const url = await uploadFileToStorage(file, folder);
      if (!url) {
        throw new Error('Não foi possível guardar o ficheiro.');
      }
      setPreviewUrl(url);
      setSuccessMsg('Ficheiro carregado.');
      onUploadSuccess(url);
    } catch {
      setError('Não foi possível carregar o ficheiro. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const isPdf = previewUrl.toLowerCase().includes('.pdf');

  return (
    <div className="space-y-2 text-xs">
      {label && <label className="block font-semibold text-ink/80">{label}</label>}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>A enviar...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{buttonText}</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl && (
          <div className="flex items-center gap-2 bg-sand-2/40 border border-ink/12 p-2 rounded-lg flex-grow overflow-hidden">
            {isPdf ? (
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <ImageIcon className="w-4 h-4 text-indigo-brand shrink-0" />
            )}
            <span className="text-xs font-mono text-ink/80 truncate flex-1">{previewUrl}</span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-paper rounded-md text-indigo-deep transition-colors"
              aria-label="Abrir ficheiro em novo separador"
              title="Abrir ficheiro"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                onUploadSuccess('');
              }}
              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-md transition-colors"
              aria-label="Remover ficheiro"
              title="Remover ficheiro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {successMsg && (
        <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </p>
      )}
    </div>
  );
}
