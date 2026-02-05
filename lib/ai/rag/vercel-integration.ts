/**
 * Vercel AI SDK Integration for RAG
 * 
 * Integrates Supabase pgvector RAG with Vercel AI SDK for seamless
 * context-aware LLM generations.
 * 
 * @module lib/ai/rag/vercel-integration
 */

import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { SupabaseRAG } from './supabase-rag';
import { z } from 'zod';

export interface GenerateWithRAGParams {
  userMessage: string;
  workspaceId: string;
  agentId?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  ragOptions?: {
    limit?: number;
    similarityThreshold?: number;
    documentType?: 'transcript' | 'pdi' | 'assessment' | 'document' | 'image_extracted';
  };
}

export interface RAGContext {
  documents: Array<{
    title: string;
    content: string;
    type: string;
    similarity: number;
  }>;
  contextMarkdown: string;
}

/**
 * Generate text with RAG context from knowledge base
 * 
 * Retrieves relevant documents from the knowledge base and uses them
 * as context for the LLM generation.
 */
export async function generateWithRAG(
  params: GenerateWithRAGParams,
  rag: SupabaseRAG
): Promise<{
  text: string;
  ragContext: RAGContext;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}> {
  const {
    userMessage,
    workspaceId,
    agentId,
    systemPrompt,
    model = 'gpt-4-turbo',
    temperature = 0.7,
    maxTokens = 2000,
    ragOptions = {},
  } = params;

  // Search for relevant documents
  const ragResults = await rag.search({
    query: userMessage,
    workspaceId,
    agentId,
    limit: ragOptions.limit || 5,
    similarityThreshold: ragOptions.similarityThreshold || 0.7,
    documentType: ragOptions.documentType,
  });

  // Format RAG context
  const contextMarkdown = ragResults
    .map(
      r =>
        `**[${r.type.toUpperCase()}] ${r.title}** (Relevância: ${(r.similarity * 100).toFixed(0)}%)\n${r.content}`
    )
    .join('\n\n---\n\n');

  const enhancedSystemPrompt = `${systemPrompt || ''}

${
  contextMarkdown
    ? `## CONTEXTO RELEVANTE DO SEU CONHECIMENTO

${contextMarkdown}

Use este contexto para responder de forma mais precisa e relevante. Se o contexto não for relevante para a pergunta, ignore-o.`
    : ''
}`;

  // Generate with Vercel AI SDK v6
  const result = await generateText({
    model: openai(model),
    system: enhancedSystemPrompt,
    prompt: userMessage,
    maxOutputTokens: maxTokens,
    temperature,
  });

  // Extract token usage - AI SDK v6 uses different property names
  const usage = result.usage as { promptTokens?: number; completionTokens?: number; inputTokens?: number; outputTokens?: number } | undefined;

  return {
    text: result.text,
    ragContext: {
      documents: ragResults.map(r => ({
        title: r.title,
        content: r.content,
        type: r.type,
        similarity: r.similarity,
      })),
      contextMarkdown,
    },
    usage: {
      promptTokens: usage?.promptTokens ?? usage?.inputTokens ?? 0,
      completionTokens: usage?.completionTokens ?? usage?.outputTokens ?? 0,
    },
  };
}

/**
 * Generate structured object with RAG context
 * 
 * Similar to generateWithRAG but returns structured data matching a schema.
 */
export async function generateObjectWithRAG<T extends z.ZodType>(
  params: GenerateWithRAGParams & {
    schema: T;
  },
  rag: SupabaseRAG
): Promise<{
  object: z.infer<T>;
  ragContext: RAGContext;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}> {
  const {
    userMessage,
    workspaceId,
    agentId,
    systemPrompt,
    model = 'gpt-4-turbo',
    temperature = 0.7,
    maxTokens = 2000,
    ragOptions = {},
    schema,
  } = params;

  // Search for relevant documents
  const ragResults = await rag.search({
    query: userMessage,
    workspaceId,
    agentId,
    limit: ragOptions.limit || 5,
    similarityThreshold: ragOptions.similarityThreshold || 0.7,
    documentType: ragOptions.documentType,
  });

  // Format RAG context
  const contextMarkdown = ragResults
    .map(
      r =>
        `**[${r.type.toUpperCase()}] ${r.title}** (Relevância: ${(r.similarity * 100).toFixed(0)}%)\n${r.content}`
    )
    .join('\n\n---\n\n');

  const enhancedSystemPrompt = `${systemPrompt || ''}

${
  contextMarkdown
    ? `## CONTEXTO RELEVANTE DO SEU CONHECIMENTO

${contextMarkdown}

Use este contexto para responder de forma mais precisa e relevante.`
    : ''
}`;

  // Generate with Vercel AI SDK v6
  const result = await generateObject({
    model: openai(model),
    system: enhancedSystemPrompt,
    prompt: userMessage,
    schema,
    maxOutputTokens: maxTokens,
    temperature,
  });

  // Extract token usage - AI SDK v6 uses different property names
  const usage = result.usage as { promptTokens?: number; completionTokens?: number; inputTokens?: number; outputTokens?: number } | undefined;

  return {
    object: result.object as z.infer<T>,
    ragContext: {
      documents: ragResults.map(r => ({
        title: r.title,
        content: r.content,
        type: r.type,
        similarity: r.similarity,
      })),
      contextMarkdown,
    },
    usage: {
      promptTokens: usage?.promptTokens ?? usage?.inputTokens ?? 0,
      completionTokens: usage?.completionTokens ?? usage?.outputTokens ?? 0,
    },
  };
}

/**
 * Create a RAG-enabled agent function for use in streaming
 */
export function createRAGAgentFunction(
  rag: SupabaseRAG,
  workspaceId: string,
  agentId?: string
) {
  return async (params: {
    query: string;
    systemPrompt?: string;
    model?: string;
    ragOptions?: GenerateWithRAGParams['ragOptions'];
  }) => {
    return generateWithRAG(
      {
        userMessage: params.query,
        workspaceId,
        agentId,
        systemPrompt: params.systemPrompt,
        model: params.model,
        ragOptions: params.ragOptions,
      },
      rag
    );
  };
}

/**
 * Format RAG results for display in UI
 */
export function formatRAGContextForUI(ragContext: RAGContext): string {
  if (ragContext.documents.length === 0) {
    return 'Nenhum contexto relevante encontrado.';
  }

  const html = `
<div class="rag-context">
  <details>
    <summary>${ragContext.documents.length} documento(s) relevante(s)</summary>
    <div class="rag-documents">
      ${ragContext.documents
        .map(
          doc => `
        <div class="rag-document">
          <h4>[${doc.type}] ${doc.title}</h4>
          <div class="relevance">Relevância: ${(doc.similarity * 100).toFixed(0)}%</div>
          <p>${doc.content.substring(0, 200)}...</p>
        </div>
      `
        )
        .join('')}
    </div>
  </details>
</div>
  `;

  return html;
}

/**
 * Get relevance score explanation
 */
export function getRelevanceExplanation(similarity: number): string {
  if (similarity >= 0.9) return 'Muito relevante';
  if (similarity >= 0.8) return 'Altamente relevante';
  if (similarity >= 0.7) return 'Relevante';
  if (similarity >= 0.6) return 'Moderadamente relevante';
  return 'Pouco relevante';
}
