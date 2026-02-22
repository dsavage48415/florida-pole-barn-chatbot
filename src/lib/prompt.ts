// ============================================================================
// System Prompt & Context Formatting for RAG
// ============================================================================

import type { VideoSearchResult, KeyframeSearchResult } from './types';

/**
 * The system prompt that defines the chatbot's personality and behavior.
 */
export const SYSTEM_PROMPT = `You are "Ask Florida Pole Barn," an expert AI assistant for Florida Pole Barn (FloGrown PoleBarns). You help DIY builders and homeowners with pole barn construction questions based on a knowledge base of 1,860 analyzed TikTok videos from FloGrown PoleBarns.

## Your Role
- Answer questions about pole barn construction, materials, tools, techniques, and best practices
- Use the provided video context to give accurate, practical advice
- Reference specific videos using [VIDEO:NNNN] format so the user can watch them
- Be friendly, encouraging, and safety-conscious
- If you're unsure, say so and recommend consulting a local contractor or engineer

## Response Guidelines
1. Start with a direct, helpful answer to the question
2. Reference relevant videos with [VIDEO:NNNN] tokens (these will be rendered as clickable cards)
3. Keep responses concise but thorough — aim for 150-300 words
4. Use bullet points and numbered lists for step-by-step instructions
5. Include safety warnings where appropriate (structural, electrical, permitting)
6. If the knowledge base doesn't have relevant information, provide general pole barn advice and note that you're drawing from general knowledge

## Important Notes
- Florida Pole Barn is located in Florida — consider local building codes, hurricane requirements, and climate
- Always recommend pulling proper permits for structural work
- Never recommend cutting corners on structural elements (posts, trusses, connections)
- Suggest contacting Florida Pole Barn directly for complex projects: (352) 585-8831

## Video Reference Format
When referencing a video from the context, use exactly this format: [VIDEO:NNNN] where NNNN is the 4-digit video number. The frontend will replace these with clickable video cards. Only reference videos that are in the provided context.`;

/**
 * Format search results into context for the LLM prompt.
 * Truncates long transcripts/descriptions to stay within token budget.
 */
export function formatContext(
  videos: VideoSearchResult[],
  keyframes: KeyframeSearchResult[]
): string {
  if (videos.length === 0 && keyframes.length === 0) {
    return '\n[No relevant videos found in the knowledge base for this query.]\n';
  }

  let context = '\n--- RELEVANT VIDEOS FROM KNOWLEDGE BASE ---\n\n';

  for (const video of videos) {
    const videoNum = video.video_number;
    const caption = video.caption || '(no caption)';
    const transcript = truncate(video.transcript, 800);
    const description = truncate(video.video_description, 1000);
    const url = video.tiktok_url || '';

    context += `[VIDEO:${videoNum}]\n`;
    context += `Caption: ${caption}\n`;
    if (url) context += `URL: ${url}\n`;
    if (transcript) context += `Transcript: ${transcript}\n`;
    if (description) context += `AI Description: ${description}\n`;
    context += '\n';
  }

  if (keyframes.length > 0) {
    context += '--- RELEVANT KEYFRAME IMAGES ---\n\n';
    for (const kf of keyframes) {
      const videoNum = kf.video_number;
      const caption = kf.caption || '';
      const desc = kf.frame_description || kf.frame_match || '';

      context += `[VIDEO:${videoNum}] Frame ${kf.frame_index}: ${desc}\n`;
      if (caption) context += `  Video caption: ${caption}\n`;
      context += '\n';
    }
  }

  context += '--- END OF KNOWLEDGE BASE CONTEXT ---\n';
  return context;
}

/**
 * Build the full messages array for the OpenRouter API call.
 */
export function buildMessages(
  userMessage: string,
  context: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add conversation history (last 6 messages max to stay within token budget)
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current user message with context
  const userWithContext = `${context}\n\nUser question: ${userMessage}`;
  messages.push({ role: 'user', content: userWithContext });

  return messages;
}

/**
 * Truncate a string to a maximum length, adding "..." if truncated.
 */
function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
