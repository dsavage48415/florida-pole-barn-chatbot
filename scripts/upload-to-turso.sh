#!/bin/bash
# ============================================================================
# Upload knowledge_base.db to Turso
# ============================================================================
#
# Prerequisites:
#   1. Install Turso CLI:
#      curl -sSfL https://get.tur.so/install.sh | bash
#
#   2. Sign up / login:
#      turso auth signup    (or turso auth login)
#
# Usage:
#   ./scripts/upload-to-turso.sh /path/to/knowledge_base.db
#
# ============================================================================

set -euo pipefail

DB_NAME="florida-pole-barn"
DB_FILE="${1:-}"

if [ -z "$DB_FILE" ]; then
  echo "Usage: $0 /path/to/knowledge_base.db"
  echo ""
  echo "Example:"
  echo "  $0 ~/Library/CloudStorage/GoogleDrive-*/My\\ Drive/Florida\\ Pole\\ Barn\\ /Floyd\\ TikToc/analysis_output/knowledge_base.db"
  exit 1
fi

if [ ! -f "$DB_FILE" ]; then
  echo "Error: File not found: $DB_FILE"
  exit 1
fi

echo "============================================"
echo "  Uploading to Turso: $DB_NAME"
echo "============================================"
echo ""
echo "Database file: $DB_FILE"
echo "File size: $(du -h "$DB_FILE" | cut -f1)"
echo ""

# Check if Turso CLI is installed
if ! command -v turso &> /dev/null; then
  echo "Error: Turso CLI not installed."
  echo "Install with: curl -sSfL https://get.tur.so/install.sh | bash"
  exit 1
fi

# Check if logged in
if ! turso auth whoami &> /dev/null 2>&1; then
  echo "Not logged in to Turso. Running 'turso auth login'..."
  turso auth login
fi

# Import the database
echo "Importing database to Turso..."
echo "(This may take a few minutes for a 60MB file)"
echo ""

turso db create "$DB_NAME" --from-file "$DB_FILE"

echo ""
echo "Database created! Getting connection info..."
echo ""

# Get the database URL
DB_URL=$(turso db show "$DB_NAME" --url)
echo "TURSO_DATABASE_URL=$DB_URL"

# Create an auth token
echo ""
echo "Creating auth token..."
AUTH_TOKEN=$(turso db tokens create "$DB_NAME")
echo "TURSO_AUTH_TOKEN=$AUTH_TOKEN"

echo ""
echo "============================================"
echo "  Verifying FTS5 search works..."
echo "============================================"
echo ""

turso db shell "$DB_NAME" "SELECT v.video_number, v.caption FROM videos_fts JOIN videos v ON v.id = videos_fts.rowid WHERE videos_fts MATCH 'truss' LIMIT 5"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Add these to your .env.local file:"
echo ""
echo "TURSO_DATABASE_URL=$DB_URL"
echo "TURSO_AUTH_TOKEN=$AUTH_TOKEN"
echo ""
echo "Or set them in Vercel:"
echo "  vercel env add TURSO_DATABASE_URL"
echo "  vercel env add TURSO_AUTH_TOKEN"
echo ""
