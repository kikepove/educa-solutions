'use client'

import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface FileUploadProps {
  accept?: string
  maxSize?: number
  onFileSelect?: (file: File) => void
  label?: string
  error?: string
}

export function FileUpload({ accept = '.csv', maxSize = 5 * 1024 * 1024, onFileSelect, label = 'Subir archivo' }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError('')

    if (selectedFile.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    if (accept && !selectedFile.name.endsWith(accept.replace('.', ''))) {
      setError(`Tipo de archivo no válido. Acepta: ${accept}`)
      return
    }

    setFile(selectedFile)
    setUploading(true)
    
    setTimeout(() => {
      setUploading(false)
      onFileSelect?.(selectedFile)
    }, 500)
  }

  const handleRemove = () => {
    setFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onFileSelect?.(null as any)
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200',
            error && 'border-red-300 bg-red-50'
          )}
        >
          <Upload className="h-8 w-8 text-slate-400" />
          <span>{label}</span>
          <span className="text-xs text-slate-400">Máx. {Math.round(maxSize / 1024 / 1024)}MB</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50">
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{Math.round(file.size / 1024)}KB</p>
          </div>
          {uploading ? (
            <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
