// ============================================================================
// RAG Pipeline — Search → Context → Prompt → Stream
// ============================================================================

import { ragSearch } from './search';
import { formatContext, buildMessages } from './prompt';
import { streamCompletion, createChatStream } from './openrouter';
import { getThumbnailUrl, getKeyframeUrls } from './image-urls';
import type { ChatMessage, SourceData, VideoCardData, KeyframeData } from './types';

/**
 * Execute the full RAG pipeline:
 * 1. Search the knowledge base for relevant videos and keyframes
 * 2. Format results as context for the LLM
 * 3. Build the messages array with system prompt + history + context
 * 4. Stream the response from OpenRouter
 * 5. Return a ReadableStream with sources + tokens + done events
 */
export async function executeRAG(
  userMessage: string,
  history: ChatMessage[] = []
): Promise<ReadableStream<Uint8Array>> {
  // Step 1: Search the knowledge base
  const searchResults = await ragSearch(userMessage, 8, 5);

  // Step 2: Build source data for the frontend
  const sourceData = buildSourceData(searchResults.videos, searchResults.keyframes);

  // Step 3: Format context and build messages
  const context = formatContext(searchResults.videos, searchResults.keyframes);
  const messages = buildMessages(userMessage, context, history);

  // Step 4: Stream from OpenRouter
  const openRouterStream = await streamCompletion(messages);

  // Step 5: Transform into our SSE format with sources prepended
  return createChatStream(openRouterStream, JSON.stringify(sourceData));
}

/**
 * Build the source data payload for the frontend.
 * Transforms database records into frontend-friendly format with Firebase URLs.
 */
function buildSourceData(
  videos: { video_number: string; caption: string | null; tiktok_url: string | null; thumbnail_path: string | null; keyframe_paths: string | null; keyframe_count: number }[],
  keyframes: { video_number: string; caption: string | null; tiktok_url: string | null; frame_index: number; image_path: string; frame_description: string | null }[]
): SourceData {
  // Deduplicate videos (same video might appear in both video and keyframe results)
  const seenVideos = new Set<string>();

  const videoCards: VideoCardData[] = videos
    .filter(v => {
      if (seenVideos.has(v.video_number)) return false;
      seenVideos.add(v.video_number);
      return true;
    })
    .map(v => ({
      video_number: v.video_number,
      caption: v.caption || `Video #${v.video_number}`,
      tiktok_url: v.tiktok_url || '',
      thumbnail_url: getThumbnailUrl(v.thumbnail_path),
      keyframe_urls: getKeyframeUrls(v.keyframe_paths, 'thumb', 3),
      keyframe_count: v.keyframe_count,
    }));

  const keyframeCards: KeyframeData[] = keyframes.map(kf => ({
    video_number: kf.video_number,
    caption: kf.caption || '',
    tiktok_url: kf.tiktok_url || '',
    frame_index: kf.frame_index,
    image_url: getThumbnailUrl(kf.image_path),
    description: kf.frame_description || '',
  }));

  return {
    videos: videoCards,
    keyframes: keyframeCards,
  };
}
