/**
 * API Route: List Knowledge Base Documents
 * 
 * GET /api/ai/rag/list?type=transcript&limit=20&offset=0
 * 
 * Lists documents in the knowledge base with optional filtering.
 */

import { createSupabaseRAG } from '@/lib/ai/rag/supabase-rag';
import { getUserWorkspaceId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const workspaceId = await getUserWorkspaceId(request);
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as any;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Initialize RAG
    const rag = createSupabaseRAG();

    // Get statistics
    const stats = await rag.getStats(workspaceId);

    // List documents
    const documents = await rag.listDocuments(workspaceId, {
      type,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        type: d.type,
        content_length: d.metadata.content_length,
        created_at: d.created_at,
        source_url: d.source_url,
      })),
      stats: {
        total: stats.totalDocuments,
        byType: stats.documentsByType,
      },
      pagination: {
        limit,
        offset,
        total: stats.totalDocuments,
      },
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}
