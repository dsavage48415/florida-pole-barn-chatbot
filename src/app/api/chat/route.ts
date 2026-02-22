// ============================================================================
// POST /api/chat — RAG Pipeline with SSE Streaming
// ============================================================================

import { NextRequest } from 'next/server';
import { executeRAG } from '@/lib/rag';
import { checkRateLimit } from '@/lib/rate-limit';
import type { ChatRequest } from '@/lib/types';

export const runtime = 'nodejs'; // Use Node.js runtime for @libsql/client compatibility

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateCheck = checkRateLimit(ip, 20, 60_000);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          retryAfterMs: rateCheck.resetMs,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(rateCheck.resetMs / 1000).toString(),
          },
        }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Limit message length
    const message = body.message.slice(0, 500);
    const history = (body.history || []).slice(-6);

    // Execute RAG pipeline and get streaming response
    const stream = await executeRAG(message, history);

    // Return SSE stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Rate-Limit-Remaining': rateCheck.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
