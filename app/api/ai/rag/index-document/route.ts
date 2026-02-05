/**
 * API Route: Index Document to Knowledge Base
 * 
 * POST /api/ai/rag/index-document
 * 
 * Indexes a document into the knowledge base by generating embeddings
 * and storing them in Supabase pgvector.
 */

import { createSupabaseRAG } from '@/lib/ai/rag/supabase-rag';
import { getUserWorkspaceId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface IndexDocumentRequest {
  title: string;
  content: string;
  type: 'transcript' | 'pdi' | 'assessment' | 'document' | 'image_extracted';
  sourceUrl?: string;
  metadata?: Record<string, any>;
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
    const body: IndexDocumentRequest = await request.json();

    if (!body.title || !body.content || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, type' },
        { status: 400 }
      );
    }

    // Validate content length
    if (body.content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (body.content.length > 100000) {
      return NextResponse.json(
        { error: 'Content exceeds maximum length of 100,000 characters' },
        { status: 400 }
      );
    }

    // Initialize RAG
    const rag = createSupabaseRAG();

    // Index document
    const document = await rag.indexDocument({
      workspaceId,
      title: body.title,
      content: body.content,
      type: body.type,
      sourceUrl: body.sourceUrl,
      metadata: body.metadata || {},
    });

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          type: document.type,
          created_at: document.created_at,
          content_length: document.metadata.content_length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error indexing document:', error);
    return NextResponse.json(
      { error: 'Failed to index document' },
      { status: 500 }
    );
  }
}
