#!/usr/bin/env bash
# Applies all migrations to a fresh Postgres database and runs the security tests.
# Usage: scripts/db-test.sh   (needs psql and a running Postgres; set PG* env vars to point at it)
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${TEST_DB:-civicpulse_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"

"${PSQL[@]}" -d "$DB" -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do
  echo "→ applying $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

for f in supabase/tests/[1-9]*.sql; do
  echo "→ running $(basename "$f")"
  "${PSQL[@]}" -d "$DB" -f "$f"
done

echo "✓ all database tests passed"
