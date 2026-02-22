// ============================================================================
// Firebase Storage URL Builder
// ============================================================================

/**
 * Get the Firebase Storage bucket name from environment variables.
 */
function getBucket(): string {
  return process.env.FIREBASE_STORAGE_BUCKET || '';
}

/**
 * Convert a local keyframe image path to a Firebase Storage CDN URL.
 *
 * Local path format: "analysis_output/video_NNNN/keyframes/frame_N.jpg"
 * Firebase path:     "keyframes/video_NNNN/frame_N_thumb.jpg" or "frame_N_medium.jpg"
 *
 * @param localPath - The local image path from the database
 * @param size - "thumb" (200x356) or "medium" (540x960)
 * @returns Firebase Storage download URL
 */
export function getImageUrl(localPath: string, size: 'thumb' | 'medium' = 'thumb'): string {
  const bucket = getBucket();
  if (!bucket || !localPath) return '';

  // Extract video number and frame number from the path
  // e.g., "analysis_output/video_0001/keyframes/frame_0.jpg"
  const videoMatch = localPath.match(/video_(\d+)/);
  const frameMatch = localPath.match(/frame_(\d+)/);

  if (!videoMatch || !frameMatch) return '';

  const videoNum = videoMatch[1];
  const frameNum = frameMatch[1];

  // Firebase Storage URL format
  const storagePath = `keyframes/video_${videoNum}/frame_${frameNum}_${size}.jpg`;
  const encodedPath = encodeURIComponent(storagePath);

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Convert a thumbnail path to a Firebase Storage URL.
 * Thumbnails are stored as the first keyframe.
 */
export function getThumbnailUrl(thumbnailPath: string | null): string {
  if (!thumbnailPath) return '';
  return getImageUrl(thumbnailPath, 'thumb');
}

/**
 * Convert all keyframe paths (JSON array) to Firebase URLs.
 */
export function getKeyframeUrls(
  keyframePathsJson: string | null,
  size: 'thumb' | 'medium' = 'thumb',
  maxCount: number = 3
): string[] {
  if (!keyframePathsJson) return [];

  try {
    const paths: string[] = JSON.parse(keyframePathsJson);
    return paths
      .slice(0, maxCount)
      .map(path => getImageUrl(path, size))
      .filter(url => url !== '');
  } catch {
    return [];
  }
}
