// ============================================================================
// GET /api/search — Direct FTS5 Search Endpoint
// ============================================================================

import { NextRequest } from 'next/server';
import { searchVideos, searchKeyframes, ragSearch } from '@/lib/search';
import { getThumbnailUrl, getKeyframeUrls } from '@/lib/image-urls';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateCheck = checkRateLimit(ip, 30, 60_000);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all | videos | keyframes
    const limitStr = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10) || 10, 1), 50);

    if (!query || query.trim().length === 0) {
      return Response.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'videos': {
        const videos = await searchVideos(query, limit);
        result = {
          type: 'videos',
          count: videos.length,
          videos: videos.map(v => ({
            video_number: v.video_number,
            caption: v.caption,
            tiktok_url: v.tiktok_url,
            thumbnail_url: getThumbnailUrl(v.thumbnail_path),
            keyframe_urls: getKeyframeUrls(v.keyframe_paths, 'thumb', 3),
            keyframe_count: v.keyframe_count,
            caption_match: v.caption_match,
            transcript_match: v.transcript_match,
            description_match: v.description_match,
          })),
        };
        break;
      }

      case 'keyframes': {
        const keyframes = await searchKeyframes(query, limit);
        result = {
          type: 'keyframes',
          count: keyframes.length,
          keyframes: keyframes.map(kf => ({
            video_number: kf.video_number,
            caption: kf.caption,
            tiktok_url: kf.tiktok_url,
            frame_index: kf.frame_index,
            image_url: getThumbnailUrl(kf.image_path),
            frame_match: kf.frame_match,
          })),
        };
        break;
      }

      default: {
        // Combined search
        const combined = await ragSearch(query, limit, Math.min(limit, 10));
        result = {
          type: 'all',
          video_count: combined.videos.length,
          keyframe_count: combined.keyframes.length,
          videos: combined.videos.map(v => ({
            video_number: v.video_number,
            caption: v.caption,
            tiktok_url: v.tiktok_url,
            thumbnail_url: getThumbnailUrl(v.thumbnail_path),
            keyframe_urls: getKeyframeUrls(v.keyframe_paths, 'thumb', 3),
            keyframe_count: v.keyframe_count,
          })),
          keyframes: combined.keyframes.map(kf => ({
            video_number: kf.video_number,
            caption: kf.caption,
            tiktok_url: kf.tiktok_url,
            frame_index: kf.frame_index,
            image_url: getThumbnailUrl(kf.image_path),
            frame_match: kf.frame_match,
          })),
        };
        break;
      }
    }

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
