"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveSalesScript, getSalesScripts } from '@/app/actions/products'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Save, Bold, Italic, Underline, List, Quote, ListOrdered, Link as LinkIcon, Heading1, Heading2 } from 'lucide-react'

interface SalesScript {
  id: string
  version: number
  content: string
  created_at: string
  icp_id?: string | null
  created_by?: string | null
  name?: string
  editor?: {
    full_name: string
    email: string
  }
}

interface ProductSalesScriptProps {
  productId: string
  workspaceId: string
  currentUserId: string
  icps?: { id: string; name: string }[]
}

export function ProductSalesScript({ productId, workspaceId, currentUserId, icps = [] }: ProductSalesScriptProps) {
  const [content, setContent] = useState('')
  const [icpId, setIcpId] = useState<string>('none')
  const [scriptName, setScriptName] = useState<string>('Script Principal')
  const [versions, setVersions] = useState<SalesScript[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('current')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)

  const loadScripts = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getSalesScripts(productId)
      const normalized =
        data?.map((item: any) => ({
          ...item,
          editor: Array.isArray(item?.editor) ? item.editor[0] : item.editor,
        })) || []

      setVersions(normalized)
      if (normalized.length > 0) {
        setContent(normalized[0].content)
        setIcpId(normalized[0].icp_id || 'none')
        setScriptName(normalized[0].name || 'Script Principal')
      }
    } catch (error) {
      console.error('Error loading scripts:', error)
      toast.error('Erro ao carregar scripts')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadScripts()
  }, [loadScripts])

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('O conteúdo do script não pode estar vazio')
      return
    }
    if (!scriptName.trim()) {
      toast.error('Informe um nome para o script')
      return
    }
    if (icpId === 'none') {
      toast.error('Selecione um ICP para vincular o script')
      return
    }

    try {
      setIsSaving(true)
      await saveSalesScript(
        workspaceId,
        productId,
        content,
        currentUserId,
        icpId === 'none' ? null : icpId,
        scriptName.trim()
      )
      toast.success('Script salvo com sucesso!')
      await loadScripts()
      setSelectedVersion('current')
    } catch (error) {
      console.error('Error saving script:', error)
      toast.error('Erro ao salvar script')
    } finally {
      setIsSaving(false)
    }
  }

  const wrapSelection = (before: string, after: string = '') => {
    const el = editorRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const selected = value.slice(selectionStart, selectionEnd)
    const newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
    setContent(newValue)
    const cursor = selectionStart + before.length + selected.length + after.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const applyHeading = (prefix: string) => {
    const el = editorRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const start = value.lastIndexOf('\n', selectionStart - 1) + 1
    const end = value.indexOf('\n', selectionEnd)
    const lineEnd = end === -1 ? value.length : end
    const line = value.slice(start, lineEnd)
    const newLine = line.startsWith(prefix) ? line : `${prefix}${line}`
    const newValue = value.slice(0, start) + newLine + value.slice(lineEnd)
    setContent(newValue)
    const cursor = selectionEnd + prefix.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const applyList = (ordered: boolean) => {
    const el = editorRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const start = value.lastIndexOf('\n', selectionStart - 1) + 1
    const end = value.indexOf('\n', selectionEnd)
    const blockEnd = end === -1 ? value.length : end
    const block = value.slice(start, blockEnd)
    const lines = block.split('\n')
    const prefixed = lines.map((line, idx) =>
      ordered ? `${idx + 1}. ${line.replace(/^\d+\.\s*/, '')}` : `- ${line.replace(/^-+\s*/, '')}`
    )
    const newBlock = prefixed.join('\n')
    const newValue = value.slice(0, start) + newBlock + value.slice(blockEnd)
    setContent(newValue)
    const cursor = start + newBlock.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const applyLink = () => {
    const el = editorRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const selected = value.slice(selectionStart, selectionEnd) || 'texto'
    const linkMarkdown = `[${selected}](https://)`
    const newValue = value.slice(0, selectionStart) + linkMarkdown + value.slice(selectionEnd)
    setContent(newValue)
    const cursor = selectionStart + linkMarkdown.length - 1 // coloca o cursor antes de ')'
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const applyQuote = () => {
    const el = editorRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const start = value.lastIndexOf('\n', selectionStart - 1) + 1
    const end = value.indexOf('\n', selectionEnd)
    const blockEnd = end === -1 ? value.length : end
    const block = value.slice(start, blockEnd)
    const lines = block.split('\n').map((line) => (line.startsWith('> ') ? line : `> ${line}`))
    const newBlock = lines.join('\n')
    const newValue = value.slice(0, start) + newBlock + value.slice(blockEnd)
    setContent(newValue)
    const cursor = start + newBlock.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId)
    if (versionId === 'current') {
      if (versions.length > 0) {
        setContent(versions[0].content)
        setIcpId(versions[0].icp_id || 'none')
        setScriptName(versions[0].name || 'Script Principal')
      } else {
        setContent('')
      }
    } else {
      const version = versions.find(v => v.id === versionId)
      if (version) {
        setContent(version.content)
        setIcpId(version.icp_id || 'none')
        setScriptName(version.name || 'Script Principal')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1">
            <Label>Nome do Script</Label>
            <input
              type="text"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              disabled={selectedVersion !== 'current'}
              className="w-[260px] rounded border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex.: Script Discovery"
            />
          </div>
          <div className="space-y-1">
            <Label>ICP</Label>
            <Select value={icpId} onValueChange={setIcpId} disabled={selectedVersion !== 'current'}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Selecione o ICP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem ICP vinculado</SelectItem>
                {icps.map((icp) => (
                  <SelectItem key={icp.id} value={icp.id}>
                    {icp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Versão</Label>
            <Select value={selectedVersion} onValueChange={handleVersionChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione a versão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Versão Atual {versions.length > 0 ? `(v${versions[0].version})` : ''}</SelectItem>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version} - {format(new Date(v.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedVersion !== 'current' && (
            <div className="text-sm text-muted-foreground mt-6">
              Visualizando histórico
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving || selectedVersion !== 'current'}
          className=""
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Nova Versão
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="script-content">Conteúdo do Script</Label>
          {versions.length > 0 && selectedVersion !== 'current' && (
             <span className="text-xs text-muted-foreground">
               Editado por {versions.find(v => v.id === selectedVersion)?.editor?.full_name || 'Desconhecido'}
             </span>
          )}
           {versions.length > 0 && selectedVersion === 'current' && (
             <span className="text-xs text-muted-foreground">
               Última edição por {versions[0].editor?.full_name || 'Desconhecido'} em {format(new Date(versions[0].created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
             </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => applyHeading('# ')} disabled={selectedVersion !== 'current'} title="Título 1">
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => applyHeading('## ')} disabled={selectedVersion !== 'current'} title="Título 2">
              <Heading2 className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => wrapSelection('**', '**')} disabled={selectedVersion !== 'current'} title="Negrito">
              <Bold className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => wrapSelection('_', '_')} disabled={selectedVersion !== 'current'} title="Itálico">
              <Italic className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => wrapSelection('<u>', '</u>')} disabled={selectedVersion !== 'current'} title="Sublinhado">
              <Underline className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => applyList(false)} disabled={selectedVersion !== 'current'} title="Lista não ordenada">
              <List className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => applyList(true)} disabled={selectedVersion !== 'current'} title="Lista ordenada">
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={applyQuote} disabled={selectedVersion !== 'current'} title="Citação">
              <Quote className="w-4 h-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={applyLink} disabled={selectedVersion !== 'current'} title="Inserir link">
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>

          <Textarea
            ref={editorRef}
            className="min-h-[400px] font-sans text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={selectedVersion !== 'current'}
            placeholder="Escreva seu script de vendas aqui..."
          />
        </div>
      </div>
    </div>
  )
}
