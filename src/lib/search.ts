// ============================================================================
// FTS5 Search — Ported from search_kb.py
// ============================================================================

import { getDB } from './db';
import type { VideoSearchResult, KeyframeSearchResult, SearchResults } from './types';

/**
 * Sanitize an FTS5 query string.
 * Strips special characters and OR-joins terms for fuzzy matching.
 */
function sanitizeFTS5Query(query: string): string {
  // Remove FTS5 special characters
  const cleaned = query
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);

  if (cleaned.length === 0) return '';

  // OR-join terms for broader matching, but also try the phrase
  // Use: "term1 term2" OR term1 OR term2
  if (cleaned.length > 1) {
    const phrase = `"${cleaned.join(' ')}"`;
    const orTerms = cleaned.join(' OR ');
    return `${phrase} OR ${orTerms}`;
  }

  return cleaned[0];
}

/**
 * Search video transcripts, descriptions, and captions via FTS5.
 * Matches the query from search_kb.py lines 52-71.
 */
export async function searchVideos(
  query: string,
  limit: number = 10
): Promise<VideoSearchResult[]> {
  const db = getDB();
  const ftsQuery = sanitizeFTS5Query(query);
  if (!ftsQuery) return [];

  const result = await db.execute({
    sql: `
      SELECT
        v.id,
        v.video_number,
        v.filename,
        v.caption,
        v.tiktok_url,
        v.thumbnail_path,
        v.keyframe_paths,
        v.keyframe_count,
        v.transcript,
        v.video_description,
        snippet(videos_fts, 1, '<mark>', '</mark>', '...', 64) AS caption_match,
        snippet(videos_fts, 2, '<mark>', '</mark>', '...', 64) AS transcript_match,
        snippet(videos_fts, 3, '<mark>', '</mark>', '...', 64) AS description_match
      FROM videos_fts
      JOIN videos v ON v.id = videos_fts.rowid
      WHERE videos_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `,
    args: [ftsQuery, limit],
  });

  return result.rows.map(row => ({
    id: row.id as number,
    video_number: row.video_number as string,
    filename: row.filename as string | null,
    caption: row.caption as string | null,
    tiktok_url: row.tiktok_url as string | null,
    thumbnail_path: row.thumbnail_path as string | null,
    keyframe_paths: row.keyframe_paths as string | null,
    keyframe_count: (row.keyframe_count as number) || 0,
    transcript: row.transcript as string | null,
    video_description: row.video_description as string | null,
    caption_match: row.caption_match as string | null,
    transcript_match: row.transcript_match as string | null,
    description_match: row.description_match as string | null,
  }));
}

/**
 * Search keyframe image descriptions via FTS5.
 * Matches the query from search_kb.py lines 87-103.
 */
export async function searchKeyframes(
  query: string,
  limit: number = 10
): Promise<KeyframeSearchResult[]> {
  const db = getDB();
  const ftsQuery = sanitizeFTS5Query(query);
  if (!ftsQuery) return [];

  const result = await db.execute({
    sql: `
      SELECT
        v.video_number,
        v.caption,
        v.tiktok_url,
        k.frame_index,
        k.image_path,
        k.frame_description,
        snippet(keyframes_fts, 0, '<mark>', '</mark>', '...', 64) AS frame_match
      FROM keyframes_fts
      JOIN keyframes k ON k.id = keyframes_fts.rowid
      JOIN videos v ON v.id = k.video_id
      WHERE keyframes_fts MATCH ?
      ORDER BY keyframes_fts.rank
      LIMIT ?
    `,
    args: [ftsQuery, limit],
  });

  return result.rows.map(row => ({
    video_number: row.video_number as string,
    caption: row.caption as string | null,
    tiktok_url: row.tiktok_url as string | null,
    frame_index: row.frame_index as number,
    image_path: row.image_path as string,
    frame_description: row.frame_description as string | null,
    frame_match: row.frame_match as string | null,
  }));
}

/**
 * Combined RAG search — fetches videos and keyframes, returns both.
 * Used by the chat endpoint to build context for the LLM.
 */
export async function ragSearch(
  query: string,
  videoLimit: number = 8,
  keyframeLimit: number = 5
): Promise<SearchResults> {
  const [videos, keyframes] = await Promise.all([
    searchVideos(query, videoLimit),
    searchKeyframes(query, keyframeLimit),
  ]);

  return { videos, keyframes };
}
