#!/usr/bin/env node
/**
 * Upload keyframe images to Firebase Storage
 *
 * Usage:
 *   node scripts/upload-to-firebase.mjs [--start N] [--limit N] [--dry-run] [--concurrency N]
 *
 * Options:
 *   --start N       Start from video number N (default: 1)
 *   --limit N       Process only N videos (default: all)
 *   --dry-run       Don't actually upload, just list what would be uploaded
 *   --concurrency N Number of concurrent uploads (default: 10)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configuration
const SERVICE_ACCOUNT_PATH = '/Users/businessaccelerant/Downloads/florida-pole-barn-diy-chatbot-67e6a6b51c16.json';
const BUCKET_NAME = 'florida-pole-barn-diy-chatbot.firebasestorage.app';
const ANALYSIS_DIR = '/Users/businessaccelerant/Library/CloudStorage/GoogleDrive-dsavage@business-accelerant.com/My Drive/Florida Pole Barn /Floyd TikToc/analysis_output';

// Image sizes
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 356;
const MEDIUM_WIDTH = 540;
const MEDIUM_HEIGHT = 960;

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultVal;
  return parseInt(args[idx + 1]) || defaultVal;
};
const DRY_RUN = args.includes('--dry-run');
const START = getArg('start', 1);
const LIMIT = getArg('limit', 0);
const CONCURRENCY = getArg('concurrency', 10);

// Initialize Firebase
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: BUCKET_NAME,
});
const bucket = getStorage().bucket();

// Progress tracking
let uploaded = 0;
let skipped = 0;
let errors = 0;
let total = 0;

async function resizeAndUpload(localPath, storagePath, width, height) {
  try {
    // Check if already uploaded
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (exists) {
      skipped++;
      return;
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload: ${storagePath}`);
      uploaded++;
      return;
    }

    // Read and resize image
    const buffer = await sharp(localPath)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    uploaded++;
  } catch (err) {
    errors++;
    console.error(`  ERROR uploading ${storagePath}: ${err.message}`);
  }
}

async function processVideo(videoDir) {
  const videoName = path.basename(videoDir);
  const keyframesDir = path.join(videoDir, 'keyframes');

  if (!fs.existsSync(keyframesDir)) {
    return [];
  }

  const frames = fs.readdirSync(keyframesDir)
    .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
    .sort();

  const tasks = [];
  for (const frame of frames) {
    const localPath = path.join(keyframesDir, frame);
    const baseName = frame.replace('.jpg', '');

    // Upload thumbnail
    const thumbPath = `keyframes/${videoName}/${baseName}_thumb.jpg`;
    tasks.push(() => resizeAndUpload(localPath, thumbPath, THUMB_WIDTH, THUMB_HEIGHT));

    // Upload medium
    const mediumPath = `keyframes/${videoName}/${baseName}_medium.jpg`;
    tasks.push(() => resizeAndUpload(localPath, mediumPath, MEDIUM_WIDTH, MEDIUM_HEIGHT));

    total += 2;
  }

  return tasks;
}

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🔥 Firebase Storage Image Upload');
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Source: ${ANALYSIS_DIR}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  if (DRY_RUN) console.log('   MODE: DRY RUN (no actual uploads)');
  console.log('');

  // Get all video directories
  const entries = fs.readdirSync(ANALYSIS_DIR)
    .filter(d => d.startsWith('video_'))
    .sort();

  let videoDirs = entries.map(d => path.join(ANALYSIS_DIR, d));

  // Apply start/limit filters
  if (START > 1) {
    const startIdx = entries.findIndex(d => {
      const num = parseInt(d.replace('video_', ''));
      return num >= START;
    });
    if (startIdx >= 0) {
      videoDirs = videoDirs.slice(startIdx);
    }
  }
  if (LIMIT > 0) {
    videoDirs = videoDirs.slice(0, LIMIT);
  }

  console.log(`📂 Processing ${videoDirs.length} video directories...`);
  console.log('');

  // Collect all upload tasks
  const allTasks = [];
  for (const dir of videoDirs) {
    const tasks = await processVideo(dir);
    allTasks.push(...tasks);
  }

  console.log(`📤 ${allTasks.length} files to process (${allTasks.length / 2} images × 2 sizes)`);
  console.log('');

  // Start a progress timer
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = total > 0 ? ((uploaded + skipped + errors) / total * 100).toFixed(1) : 0;
    process.stdout.write(`\r   Progress: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors — ${pct}% (${elapsed}s)`);
  }, 2000);

  // Run uploads with concurrency
  await runWithConcurrency(allTasks, CONCURRENCY);

  clearInterval(progressInterval);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n');
  console.log('✅ Upload complete!');
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Time: ${elapsed}s`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
