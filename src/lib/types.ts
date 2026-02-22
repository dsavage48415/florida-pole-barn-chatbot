// ============================================================================
// Florida Pole Barn Chatbot — TypeScript Interfaces
// ============================================================================

/** A video record from the knowledge base */
export interface Video {
  id: number;
  video_number: string;
  filename: string | null;
  caption: string | null;
  hashtags: string | null;
  tiktok_url: string | null;
  transcript: string | null;
  video_description: string | null;
  keyframe_count: number;
  thumbnail_path: string | null;
  keyframe_paths: string | null; // JSON array of paths
  analysis_path: string | null;
  model: string | null;
  status: string;
}

/** A video search result with FTS5 snippet matches */
export interface VideoSearchResult {
  id: number;
  video_number: string;
  filename: string | null;
  caption: string | null;
  tiktok_url: string | null;
  thumbnail_path: string | null;
  keyframe_paths: string | null;
  keyframe_count: number;
  transcript: string | null;
  video_description: string | null;
  caption_match: string | null;
  transcript_match: string | null;
  description_match: string | null;
}

/** A keyframe search result */
export interface KeyframeSearchResult {
  video_number: string;
  caption: string | null;
  tiktok_url: string | null;
  frame_index: number;
  image_path: string;
  frame_description: string | null;
  frame_match: string | null;
}

/** Combined search results for the RAG pipeline */
export interface SearchResults {
  videos: VideoSearchResult[];
  keyframes: KeyframeSearchResult[];
}

/** A chat message in the conversation */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Request body for the /api/chat endpoint */
export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

/** SSE event types sent to the client */
export type SSEEventType = 'sources' | 'token' | 'done' | 'error';

/** SSE event payload */
export interface SSEEvent {
  type: SSEEventType;
  content?: string;
  sources?: SourceData;
  error?: string;
}

/** Source data sent with the 'sources' SSE event */
export interface SourceData {
  videos: VideoCardData[];
  keyframes: KeyframeData[];
}

/** Video card data sent to the frontend */
export interface VideoCardData {
  video_number: string;
  caption: string;
  tiktok_url: string;
  thumbnail_url: string;
  keyframe_urls: string[];
  keyframe_count: number;
}

/** Keyframe data sent to the frontend */
export interface KeyframeData {
  video_number: string;
  caption: string;
  tiktok_url: string;
  frame_index: number;
  image_url: string;
  description: string;
}
