// ============================================================================
// OpenRouter Streaming Client
// ============================================================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-3-27b-it';

interface OpenRouterMessage {
  role: string;
  content: string;
}

/**
 * Stream a chat completion from OpenRouter.
 * Returns a ReadableStream of SSE-formatted text chunks.
 */
export async function streamCompletion(
  messages: OpenRouterMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://floridapolebarn.com',
      'X-Title': 'Florida Pole Barn Chatbot',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body from OpenRouter');
  }

  return response.body;
}

/**
 * Parse an SSE line from OpenRouter into a content delta string.
 * Returns null if the line is not a content delta (e.g., role delta, [DONE]).
 */
export function parseSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') return null;

  try {
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta?.content;
    return typeof delta === 'string' ? delta : null;
  } catch {
    return null;
  }
}

/**
 * Transform the raw OpenRouter SSE stream into our own SSE format.
 * Prepends source data and transforms content deltas.
 */
export function createChatStream(
  openRouterStream: ReadableStream<Uint8Array>,
  sourcesJson: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      // Send sources event first
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: JSON.parse(sourcesJson) })}\n\n`)
      );

      const reader = openRouterStream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const content = parseSSELine(trimmed);
            if (content !== null) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
              );
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const content = parseSSELine(buffer.trim());
          if (content !== null) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
            );
          }
        }

        // Send done event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });
}
