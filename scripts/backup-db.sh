#!/usr/bin/env bash
set -euo pipefail

# Backup PostgreSQL database from Supabase
# Usage: ./scripts/backup-db.sh [output-dir]
# Requires: pg_dump, DATABASE_URL in .env or env

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${1:-$PROJECT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$OUTPUT_DIR/serene-lens-$TIMESTAMP.sql"
GZIP_FILE="$BACKUP_FILE.gz"

mkdir -p "$OUTPUT_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
  export "$(grep '^DATABASE_URL=' "$PROJECT_DIR/.env" | xargs)"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

echo "Backing up database to $GZIP_FILE ..."
pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$GZIP_FILE"
echo "Done: $(du -h "$GZIP_FILE" | cut -f1)"

# Keep last 7 backups, remove older ones
find "$OUTPUT_DIR" -name "serene-lens-*.sql.gz" -mtime +7 -delete
echo "Cleaned up backups older than 7 days"
