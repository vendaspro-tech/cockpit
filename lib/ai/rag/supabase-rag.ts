/**
 * Supabase pgvector RAG Implementation
 * 
 * This module provides semantic search capabilities using Supabase pgvector
 * for the AI module's knowledge base.
 * 
 * @module lib/ai/rag/supabase-rag
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

export interface RagDocument {
  id: string;
  workspace_id: string;
  agent_id?: string;
  title: string;
  content: string;
  type: 'transcript' | 'pdi' | 'assessment' | 'document' | 'image_extracted';
  metadata: Record<string, any>;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RagSearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  similarity: number;
  metadata: Record<string, any>;
  source_url?: string;
}

export interface IndexDocumentParams {
  workspaceId: string;
  agentId?: string;
  title: string;
  content: string;
  type: RagDocument['type'];
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

export interface SearchParams {
  query: string;
  workspaceId: string;
  agentId?: string;
  limit?: number;
  similarityThreshold?: number;
  documentType?: RagDocument['type'];
}

/**
 * Supabase pgvector RAG class
 * 
 * Handles semantic search through document embeddings stored in Supabase
 * using the pgvector extension.
 */
export class SupabaseRAG {
  private supabase;
  private openai: OpenAI;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Index a document by generating embeddings and storing in Supabase
   * 
   * @param params - Document indexing parameters
   * @returns Created document record
   */
  async indexDocument(params: IndexDocumentParams): Promise<RagDocument> {
    const {
      workspaceId,
      agentId,
      title,
      content,
      type,
      sourceUrl,
      metadata = {},
    } = params;

    // Generate embedding using OpenAI
    const embeddingResponse = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Store in Supabase
    const { data, error } = await this.supabase
      .from('ai_knowledge_base')
      .insert({
        workspace_id: workspaceId,
        agent_id: agentId,
        title,
        content,
        type,
        embedding,
        source_url: sourceUrl,
        metadata: {
          ...metadata,
          indexed_at: new Date().toISOString(),
          content_length: content.length,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to index document: ${error.message}`);
    }

    return data as RagDocument;
  }

  /**
   * Batch index multiple documents
   * 
   * @param documents - Array of documents to index
   * @returns Array of indexed documents
   */
  async batchIndexDocuments(
    documents: IndexDocumentParams[]
  ): Promise<RagDocument[]> {
    const results: RagDocument[] = [];

    for (const doc of documents) {
      try {
        const result = await this.indexDocument(doc);
        results.push(result);
      } catch (error) {
        console.error(`Failed to index document "${doc.title}":`, error);
      }
    }

    return results;
  }

  /**
   * Search for relevant documents using semantic similarity
   * 
   * @param params - Search parameters
   * @returns Array of similar documents ranked by relevance
   */
  async search(params: SearchParams): Promise<RagSearchResult[]> {
    const {
      query,
      workspaceId,
      agentId,
      limit = 5,
      similarityThreshold = 0.7,
      documentType,
    } = params;

    // Generate embedding for the query
    const queryEmbeddingResponse = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    // Use RPC function for efficient vector search
    const { data, error } = await this.supabase.rpc(
      'search_ai_knowledge_base',
      {
        query_embedding: queryEmbedding,
        workspace_id: workspaceId,
        agent_id: agentId || null,
        similarity_threshold: similarityThreshold,
        match_count: limit,
        doc_type: documentType || null,
      }
    );

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return (data || []) as RagSearchResult[];
  }

  /**
   * Hybrid search combining semantic and keyword search
   * 
   * @param params - Search parameters
   * @returns Combined results from both searches
   */
  async hybridSearch(params: SearchParams): Promise<RagSearchResult[]> {
    const semanticResults = await this.search(params);

    // Keyword search
    const { data: keywordResults, error } = await this.supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .ilike('content', `%${params.query}%`)
      .limit(params.limit || 5);

    if (error) {
      console.error('Keyword search error:', error);
      return semanticResults;
    }

    // Merge results, prioritizing semantic matches
    const semanticIds = new Set(semanticResults.map(r => r.id));
    const mergedResults = [
      ...semanticResults,
      ...(keywordResults || [])
        .filter(r => !semanticIds.has(r.id))
        .map(r => ({
          ...r,
          similarity: 0.5, // Lower score for keyword-only matches
        })),
    ].slice(0, params.limit || 5);

    return mergedResults;
  }

  /**
   * Delete a document from the knowledge base
   * 
   * @param documentId - ID of document to delete
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_knowledge_base')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get document by ID
   * 
   * @param documentId - ID of document to retrieve
   */
  async getDocument(documentId: string): Promise<RagDocument | null> {
    const { data, error } = await this.supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Failed to get document:', error);
      return null;
    }

    return data as RagDocument;
  }

  /**
   * List all documents in a workspace
   * 
   * @param workspaceId - Workspace ID
   * @param options - Filter options
   */
  async listDocuments(
    workspaceId: string,
    options?: {
      agentId?: string;
      type?: RagDocument['type'];
      limit?: number;
      offset?: number;
    }
  ): Promise<RagDocument[]> {
    let query = this.supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (options?.agentId) {
      query = query.eq('agent_id', options.agentId);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      const offset = options.offset;
      const limit = options.limit || 10;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }

    return data as RagDocument[];
  }

  /**
   * Get knowledge base statistics
   * 
   * @param workspaceId - Workspace ID
   */
  async getStats(workspaceId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    totalContentLength: number;
  }> {
    const { data, error } = await this.supabase
      .from('ai_knowledge_base')
      .select('type, metadata')
      .eq('workspace_id', workspaceId);

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats = {
      totalDocuments: data?.length || 0,
      documentsByType: {} as Record<string, number>,
      totalContentLength: 0,
    };

    (data || []).forEach(doc => {
      stats.documentsByType[doc.type] = (stats.documentsByType[doc.type] || 0) + 1;
      stats.totalContentLength += doc.metadata?.content_length || 0;
    });

    return stats;
  }

  /**
   * Clear all documents from knowledge base
   * (Warning: irreversible operation)
   * 
   * @param workspaceId - Workspace ID
   */
  async clearWorkspaceKnowledgeBase(workspaceId: string): Promise<number> {
    const { data: deleted, error } = await this.supabase
      .from('ai_knowledge_base')
      .delete()
      .eq('workspace_id', workspaceId)
      .select();

    if (error) {
      throw new Error(`Failed to clear knowledge base: ${error.message}`);
    }

    return deleted?.length || 0;
  }

  /**
   * Export documents as JSON
   * 
   * @param workspaceId - Workspace ID
   */
  async exportDocuments(workspaceId: string): Promise<RagDocument[]> {
    const { data, error } = await this.supabase
      .from('ai_knowledge_base')
      .select('id, workspace_id, agent_id, title, content, type, metadata, source_url, created_at, updated_at')
      .eq('workspace_id', workspaceId);

    if (error) {
      throw new Error(`Failed to export documents: ${error.message}`);
    }

    return data as RagDocument[];
  }
}

// Factory function for easier initialization
export function createSupabaseRAG(): SupabaseRAG {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !openaiKey) {
    throw new Error('Missing required environment variables for RAG initialization');
  }

  return new SupabaseRAG(supabaseUrl, supabaseKey, openaiKey);
}
