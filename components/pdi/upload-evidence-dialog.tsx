'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import { uploadEvidence } from '@/app/actions/pdi-evidence'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface UploadEvidenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdiItemId: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

export function UploadEvidenceDialog({ open, onOpenChange, pdiItemId }: UploadEvidenceDialogProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB')
        return
      }
      
      setFile(selectedFile)
      toast.success(`Arquivo "${selectedFile.name}" selecionado`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    multiple: false
  })

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress (em produção, você pode usar onUploadProgress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const result = await uploadEvidence(pdiItemId, file, description)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Evidência enviada com sucesso!')
        router.refresh()
        handleClose()
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Upload error:', error)
      toast.error('Erro ao enviar evidência')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setDescription('')
    setUploadProgress(0)
    onOpenChange(false)
  }

  const removeFile = () => {
    setFile(null)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    return <FileText className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Evidência</DialogTitle>
          <DialogDescription>
            Faça upload de documentos, imagens ou PDFs que comprovem o progresso desta ação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-sm text-blue-600">Solte o arquivo aqui...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    Arraste e solte um arquivo aqui, ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF, DOC (máx. 5MB)
                  </p>
                </>
              )}
            </div>
          )}

          {/* File Preview */}
          {file && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Enviando... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que esta evidência comprova..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={uploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? 'Enviando...' : 'Enviar Evidência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
