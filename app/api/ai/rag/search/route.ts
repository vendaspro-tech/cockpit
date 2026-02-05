/**
 * API Route: Search Knowledge Base
 * 
 * POST /api/ai/rag/search
 * 
 * Searches the knowledge base for documents semantically similar to the query.
 */

import { createSupabaseRAG } from '@/lib/ai/rag/supabase-rag';
import { getUserWorkspaceId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

interface SearchRequest {
  query: string;
  limit?: number;
  similarityThreshold?: number;
  documentType?: 'transcript' | 'pdi' | 'assessment' | 'document' | 'image_extracted';
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const workspaceId = await getUserWorkspaceId(request);
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SearchRequest = await request.json();

    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (body.query.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Initialize RAG
    const rag = createSupabaseRAG();

    // Search
    const results = await rag.search({
      query: body.query,
      workspaceId,
      limit: body.limit || 5,
      similarityThreshold: body.similarityThreshold || 0.7,
      documentType: body.documentType,
    });

    return NextResponse.json({
      success: true,
      query: body.query,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content.substring(0, 500), // Preview only
        type: r.type,
        similarity: parseFloat((r.similarity * 100).toFixed(1)),
        source_url: r.source_url,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}
