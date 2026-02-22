#!/usr/bin/env node
/**
 * Import knowledge_base.db data to Turso using @libsql/client
 *
 * This script:
 * 1. Opens the local SQLite database
 * 2. Creates tables in Turso
 * 3. Imports all video and keyframe records in batches
 * 4. Creates FTS5 virtual tables and populates them
 */

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';

// ---- Configuration ----
const LOCAL_DB_PATH = process.argv[2];
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const BATCH_SIZE = 50;

if (!LOCAL_DB_PATH) {
  console.error('Usage: node scripts/import-to-turso.mjs /path/to/knowledge_base.db');
  process.exit(1);
}
if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars');
  process.exit(1);
}

// ---- Connect ----
console.log(`Local DB: ${LOCAL_DB_PATH}`);
console.log(`Turso:    ${TURSO_URL}`);

const local = new Database(LOCAL_DB_PATH, { readonly: true });
const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ---- Disable foreign keys for import ----
await turso.execute('PRAGMA foreign_keys = OFF');

// ---- Create Schema ----
console.log('\n1. Creating tables...');

await turso.execute(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_number TEXT UNIQUE NOT NULL,
    filename TEXT,
    caption TEXT,
    hashtags TEXT,
    tiktok_url TEXT,
    transcript TEXT,
    video_description TEXT,
    keyframe_count INTEGER DEFAULT 0,
    thumbnail_path TEXT,
    keyframe_paths TEXT,
    analysis_path TEXT,
    model TEXT,
    whisper_model TEXT,
    frames_extracted INTEGER DEFAULT 0,
    audio_language TEXT,
    transcription_successful INTEGER DEFAULT 0,
    file_size_mb REAL,
    processed_at TEXT,
    status TEXT DEFAULT 'completed'
  )
`);

await turso.execute(`
  CREATE TABLE IF NOT EXISTS keyframes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    frame_index INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    frame_description TEXT,
    UNIQUE(video_id, frame_index)
  )
`);

console.log('   Tables created.');

// ---- Import Videos ----
console.log('\n2. Importing videos...');
const videos = local.prepare('SELECT * FROM videos ORDER BY id').all();
console.log(`   Found ${videos.length} videos to import.`);

const videoCols = [
  'id', 'video_number', 'filename', 'caption', 'hashtags', 'tiktok_url',
  'transcript', 'video_description', 'keyframe_count', 'thumbnail_path',
  'keyframe_paths', 'analysis_path', 'model', 'whisper_model',
  'frames_extracted', 'audio_language', 'transcription_successful',
  'file_size_mb', 'processed_at', 'status'
];

for (let i = 0; i < videos.length; i += BATCH_SIZE) {
  const batch = videos.slice(i, i + BATCH_SIZE);
  const stmts = batch.map(row => ({
    sql: `INSERT OR REPLACE INTO videos (${videoCols.join(', ')}) VALUES (${videoCols.map(() => '?').join(', ')})`,
    args: videoCols.map(col => row[col] ?? null),
  }));
  await turso.batch(stmts, 'write');

  const done = Math.min(i + BATCH_SIZE, videos.length);
  if (done % 200 === 0 || done === videos.length) {
    console.log(`   ${done}/${videos.length} videos imported`);
  }
}

// ---- Import Keyframes ----
console.log('\n3. Importing keyframes...');
const keyframeCount = local.prepare('SELECT COUNT(*) as cnt FROM keyframes').get().cnt;
console.log(`   Found ${keyframeCount} keyframes to import.`);

const keyframeCols = ['id', 'video_id', 'frame_index', 'image_path', 'frame_description'];
const keyframeStmt = local.prepare('SELECT * FROM keyframes ORDER BY id');

let kfImported = 0;
let kfBatch = [];

for (const row of keyframeStmt.iterate()) {
  kfBatch.push({
    sql: `INSERT OR REPLACE INTO keyframes (${keyframeCols.join(', ')}) VALUES (${keyframeCols.map(() => '?').join(', ')})`,
    args: keyframeCols.map(col => row[col] ?? null),
  });

  if (kfBatch.length >= BATCH_SIZE) {
    await turso.batch(kfBatch, 'write');
    kfImported += kfBatch.length;
    kfBatch = [];
    if (kfImported % 500 === 0) {
      console.log(`   ${kfImported}/${keyframeCount} keyframes imported`);
    }
  }
}

if (kfBatch.length > 0) {
  await turso.batch(kfBatch, 'write');
  kfImported += kfBatch.length;
}
console.log(`   ${kfImported}/${keyframeCount} keyframes imported`);

// ---- Create FTS5 Indexes ----
console.log('\n4. Creating FTS5 indexes...');

await turso.execute(`
  CREATE VIRTUAL TABLE IF NOT EXISTS videos_fts USING fts5(
    video_number,
    caption,
    transcript,
    video_description,
    hashtags,
    content=videos,
    content_rowid=id,
    tokenize='porter unicode61'
  )
`);

await turso.execute(`
  CREATE VIRTUAL TABLE IF NOT EXISTS keyframes_fts USING fts5(
    frame_description,
    content=keyframes,
    content_rowid=id,
    tokenize='porter unicode61'
  )
`);

console.log('   FTS5 virtual tables created.');

// ---- Populate FTS5 ----
console.log('\n5. Populating FTS5 indexes...');

await turso.execute(`
  INSERT INTO videos_fts(rowid, video_number, caption, transcript, video_description, hashtags)
  SELECT id, video_number, caption, transcript, video_description, hashtags FROM videos
`);

await turso.execute(`
  INSERT INTO keyframes_fts(rowid, frame_description)
  SELECT id, frame_description FROM keyframes
`);

console.log('   FTS5 indexes populated.');

// ---- Verify ----
console.log('\n6. Verifying...');

const vCount = await turso.execute('SELECT COUNT(*) as cnt FROM videos');
const kCount = await turso.execute('SELECT COUNT(*) as cnt FROM keyframes');
const ftsTest = await turso.execute(`
  SELECT v.video_number, v.caption
  FROM videos_fts
  JOIN videos v ON v.id = videos_fts.rowid
  WHERE videos_fts MATCH 'truss'
  LIMIT 3
`);

console.log(`   Videos:    ${vCount.rows[0].cnt}`);
console.log(`   Keyframes: ${kCount.rows[0].cnt}`);
console.log(`   FTS5 test (truss): ${ftsTest.rows.length} results`);
for (const row of ftsTest.rows) {
  console.log(`     - Video #${row.video_number}: ${(row.caption || '').slice(0, 60)}`);
}

// ---- Done ----
console.log('\n✅ Import complete!');
local.close();
process.exit(0);
