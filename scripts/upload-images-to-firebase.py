#!/usr/bin/env python3
"""
Upload Keyframe Images to Firebase Storage
===========================================
Resizes and uploads all keyframe images from the analysis output
to Firebase Storage for CDN delivery.

Generates two sizes per image:
  - Thumbnail: 200x356 (~25KB) — for video cards in chat
  - Medium:    540x960 (~120KB) — for keyframe gallery display

Prerequisites:
  pip install firebase-admin Pillow

Usage:
  python scripts/upload-images-to-firebase.py \
    --source /path/to/analysis_output \
    --bucket your-project.appspot.com \
    --credentials /path/to/serviceAccountKey.json

  # Dry run (no uploads):
  python scripts/upload-images-to-firebase.py --source /path/to/analysis_output --dry-run
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)

try:
    import firebase_admin
    from firebase_admin import credentials, storage
except ImportError:
    print("Error: firebase-admin is required. Install with: pip install firebase-admin")
    sys.exit(1)

# ============================================================================
# Configuration
# ============================================================================

THUMB_SIZE = (200, 356)   # Width x Height for thumbnails
MEDIUM_SIZE = (540, 960)  # Width x Height for medium images
JPEG_QUALITY_THUMB = 75
JPEG_QUALITY_MEDIUM = 82
MAX_WORKERS = 10

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Image Processing
# ============================================================================

def resize_image(image_path: Path, target_size: tuple, quality: int) -> bytes:
    """Resize an image and return JPEG bytes."""
    with Image.open(image_path) as img:
        # Convert to RGB if necessary (handles RGBA, P mode, etc.)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize maintaining aspect ratio, then crop to exact size
        img.thumbnail(target_size, Image.LANCZOS)

        # Save to bytes
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        return buffer.getvalue()


def process_and_upload(
    image_path: Path,
    video_num: str,
    frame_num: str,
    bucket,
    dry_run: bool = False
) -> dict:
    """Process a single image: resize to thumb + medium, upload both."""
    results = {'path': str(image_path), 'success': True, 'sizes': []}

    for size_name, target_size, quality in [
        ('thumb', THUMB_SIZE, JPEG_QUALITY_THUMB),
        ('medium', MEDIUM_SIZE, JPEG_QUALITY_MEDIUM),
    ]:
        try:
            # Resize
            image_bytes = resize_image(image_path, target_size, quality)

            # Firebase Storage path
            storage_path = f"keyframes/video_{video_num}/frame_{frame_num}_{size_name}.jpg"

            if dry_run:
                logger.debug(f"  [DRY RUN] Would upload: {storage_path} ({len(image_bytes)} bytes)")
                results['sizes'].append({
                    'size': size_name,
                    'bytes': len(image_bytes),
                    'path': storage_path,
                })
            else:
                # Upload to Firebase
                blob = bucket.blob(storage_path)
                blob.upload_from_string(
                    image_bytes,
                    content_type='image/jpeg'
                )
                # Make publicly readable
                blob.make_public()
                results['sizes'].append({
                    'size': size_name,
                    'bytes': len(image_bytes),
                    'path': storage_path,
                    'url': blob.public_url,
                })

        except Exception as e:
            logger.error(f"  Error processing {size_name} for {image_path}: {e}")
            results['success'] = False

    return results


# ============================================================================
# Main
# ============================================================================

def find_all_keyframes(source_dir: Path) -> list:
    """Find all keyframe images in the analysis output directory."""
    keyframes = []

    for video_dir in sorted(source_dir.glob("video_*")):
        if not video_dir.is_dir():
            continue

        video_num = video_dir.name.replace("video_", "")
        keyframe_dir = video_dir / "keyframes"

        if not keyframe_dir.exists():
            continue

        for img_file in sorted(keyframe_dir.glob("frame_*.jpg")):
            frame_match = img_file.stem.replace("frame_", "")
            keyframes.append({
                'path': img_file,
                'video_num': video_num,
                'frame_num': frame_match,
            })

    return keyframes


def main():
    parser = argparse.ArgumentParser(
        description="Upload keyframe images to Firebase Storage"
    )
    parser.add_argument(
        "--source", required=True,
        help="Path to analysis_output directory"
    )
    parser.add_argument(
        "--bucket", default=None,
        help="Firebase Storage bucket name (e.g., your-project.appspot.com)"
    )
    parser.add_argument(
        "--credentials", default=None,
        help="Path to Firebase service account key JSON file"
    )
    parser.add_argument(
        "--workers", type=int, default=MAX_WORKERS,
        help=f"Number of concurrent upload workers (default: {MAX_WORKERS})"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Process images but don't upload to Firebase"
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Limit number of images to process (0 = all)"
    )

    args = parser.parse_args()
    source_dir = Path(args.source)

    if not source_dir.exists():
        logger.error(f"Source directory not found: {source_dir}")
        sys.exit(1)

    # Find all keyframes
    logger.info(f"Scanning for keyframe images in: {source_dir}")
    keyframes = find_all_keyframes(source_dir)
    logger.info(f"Found {len(keyframes)} keyframe images")

    if args.limit > 0:
        keyframes = keyframes[:args.limit]
        logger.info(f"Limited to {len(keyframes)} images")

    if len(keyframes) == 0:
        logger.warning("No keyframe images found!")
        return

    # Initialize Firebase (unless dry run)
    bucket = None
    if not args.dry_run:
        if not args.bucket:
            logger.error("--bucket is required (unless --dry-run)")
            sys.exit(1)

        cred = None
        if args.credentials:
            cred = credentials.Certificate(args.credentials)
        else:
            # Try default credentials
            cred = credentials.ApplicationDefault()

        firebase_admin.initialize_app(cred, {
            'storageBucket': args.bucket
        })
        bucket = storage.bucket()
        logger.info(f"Connected to Firebase Storage: {args.bucket}")

    # Process and upload
    logger.info(f"Processing with {args.workers} workers...")
    completed = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {}
        for kf in keyframes:
            future = executor.submit(
                process_and_upload,
                kf['path'],
                kf['video_num'],
                kf['frame_num'],
                bucket,
                args.dry_run
            )
            futures[future] = kf

        for future in as_completed(futures):
            kf = futures[future]
            try:
                result = future.result()
                if result['success']:
                    completed += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed: {kf['path']}: {e}")
                failed += 1

            total = completed + failed
            if total % 100 == 0 or total == len(keyframes):
                logger.info(f"Progress: {total}/{len(keyframes)} ({completed} ok, {failed} failed)")

    # Summary
    logger.info("")
    logger.info("=" * 50)
    logger.info(f"Upload Complete!")
    logger.info(f"  Total images: {len(keyframes)}")
    logger.info(f"  Successful:   {completed}")
    logger.info(f"  Failed:       {failed}")
    logger.info(f"  Mode:         {'DRY RUN' if args.dry_run else 'LIVE'}")
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
