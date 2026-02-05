/**
 * Knowledge Base Manager Component
 * 
 * Admin UI for managing the knowledge base including:
 * - Document upload
 * - Search and preview
 * - Statistics
 * - Batch operations
 * 
 * @module components/admin/ai/knowledge-base-manager
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Upload, Search, Trash2, Eye, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type DocumentType = 'transcript' | 'pdi' | 'assessment' | 'document' | 'image_extracted';

interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content_length: number;
  created_at: string;
  source_url?: string;
}

interface KnowledgeBaseStats {
  total: number;
  byType: Record<string, number>;
}

export function KnowledgeBaseManager() {
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'documents'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>('document');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['knowledge-base-documents'],
    queryFn: async () => {
      const res = await fetch('/api/ai/rag/list?limit=50');
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json();
    },
  });

  // Search mutation
  const { mutate: search, isPending: searchPending, data: searchResults } = useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch('/api/ai/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
  });

  // Index document mutation
  const { mutate: indexDocument, isPending: indexPending } = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      type: DocumentType;
    }) => {
      const res = await fetch('/api/ai/rag/index-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents'] });
      setUploadTitle('');
      setUploadContent('');
      setUploadType('document');
    },
  });

  // Delete mutation
  const { mutate: deleteDocument, isPending: deletePending } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/rag/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents'] });
      setSelectedDocument(null);
    },
  });

  const stats: KnowledgeBaseStats = documentsData?.stats || { total: 0, byType: {} };
  const documents: Document[] = documentsData?.documents || [];

  const getTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, string> = {
      transcript: 'bg-blue-100 text-blue-800',
      pdi: 'bg-green-100 text-green-800',
      assessment: 'bg-purple-100 text-purple-800',
      document: 'bg-gray-100 text-gray-800',
      image_extracted: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleUpload = () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) {
      return;
    }
    indexDocument({
      title: uploadTitle,
      content: uploadContent,
      type: uploadType,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
        <p className="text-muted-foreground">
          Manage documents and semantic search for your agents
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Documents</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        {Object.entries(stats.byType).map(([type, count]) => (
          <Card key={type} className="p-4">
            <div className="text-sm text-muted-foreground capitalize">{type}</div>
            <div className="text-2xl font-bold">{count}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {documentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No documents in knowledge base yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <Card
                  key={doc.id}
                  className="p-4 cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge className={getTypeColor(doc.type)} variant="outline">
                          {doc.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.content_length} characters • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocument(doc);
                          setActiveTab('search');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        disabled={deletePending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchPending}>
                {searchPending ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          {searchResults?.results && searchResults.results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.count} relevant documents
              </p>
              {searchResults.results.map((result: any, i: number) => (
                <Card key={i} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{result.title}</h3>
                      <Badge variant="secondary">{result.similarity}% match</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.content}</p>
                    <Badge className={getTypeColor(result.type)} variant="outline">
                      {result.type}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Document title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="document">Document</option>
                <option value="transcript">Transcript</option>
                <option value="pdi">PDI</option>
                <option value="assessment">Assessment</option>
                <option value="image_extracted">Image (Extracted)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Paste document content here..."
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {uploadContent.length} / 100,000 characters
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={indexPending || !uploadTitle.trim() || !uploadContent.trim()}
              className="w-full"
            >
              {indexPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Indexing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
