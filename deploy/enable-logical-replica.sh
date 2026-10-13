#!/bin/bash
# Enable logical replication: elearning (primary) -> elearning_replica (subscriber)
# Same Postgres container. Requires a brief restart for wal_level=logical.
# Run on droplet: bash /tmp/enable-logical-replica.sh

set -euo pipefail

C="${PG_CONTAINER:-hotelbooking-postgres-1}"
U="${PG_SUPERUSER:-hotel}"
SRC="${SRC_DB:-elearning}"
DST="${REPLICA_DB:-elearning_replica}"
PUB="${PUB_NAME:-elearning_pub}"
SUB="${SUB_NAME:-elearning_sub}"

echo "=== Postgres settings ==="
docker exec "$C" psql -U "$U" -d "$SRC" -c "SHOW server_version; SHOW wal_level;"

WAL=$(docker exec "$C" psql -U "$U" -d "$SRC" -tAc "SHOW wal_level")
if [ "$WAL" != "logical" ]; then
  echo "Setting wal_level=logical (Postgres restart required, ~10s downtime)..."
  docker exec "$C" psql -U "$U" -d postgres -c "ALTER SYSTEM SET wal_level = 'logical';"
  docker exec "$C" psql -U "$U" -d postgres -c "ALTER SYSTEM SET max_replication_slots = 10;"
  docker exec "$C" psql -U "$U" -d postgres -c "ALTER SYSTEM SET max_wal_senders = 10;"
  docker restart "$C"
  echo "Waiting for Postgres..."
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    if docker exec "$C" pg_isready -U "$U" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

docker exec "$C" psql -U "$U" -d "$SRC" -c "SHOW wal_level;"
docker exec "$C" psql -U "$U" -d postgres -c "ALTER USER $U WITH REPLICATION;"

echo "=== Recreate empty replica with schema only ==="
docker exec "$C" psql -U "$U" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DST' AND pid <> pg_backend_pid();" >/dev/null || true
# Drop existing subscription in DST if we drop the database (subscription lives in DST)

docker exec "$C" psql -U "$U" -d postgres -c "DROP DATABASE IF EXISTS $DST;"
docker exec "$C" psql -U "$U" -d postgres -c "CREATE DATABASE $DST OWNER elearning;"
docker exec "$C" pg_dump -U "$U" -s --no-owner --no-acl -d "$SRC" -f /tmp/elearning_schema.sql
docker exec "$C" psql -U "$U" -d "$DST" -v ON_ERROR_STOP=1 -f /tmp/elearning_schema.sql
docker exec "$C" rm -f /tmp/elearning_schema.sql

echo "=== Publication on primary ==="
docker exec "$C" psql -U "$U" -d "$SRC" -c "DROP PUBLICATION IF EXISTS $PUB;"
docker exec "$C" psql -U "$U" -d "$SRC" -c "CREATE PUBLICATION $PUB FOR ALL TABLES;"

echo "=== Subscription on replica ==="
# Same instance: create the slot first. CREATE SUBSCRIPTION with create_slot=true deadlocks on one Postgres.
docker exec "$C" psql -U "$U" -d "$DST" -c "DROP SUBSCRIPTION IF EXISTS $SUB;" || true
docker exec "$C" psql -U "$U" -d "$SRC" -c "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name='$SUB';" || true
docker exec "$C" psql -U "$U" -d "$SRC" -c "SELECT pg_create_logical_replication_slot('$SUB', 'pgoutput');"
docker exec "$C" psql -U "$U" -d "$DST" -c "CREATE SUBSCRIPTION $SUB CONNECTION 'host=/var/run/postgresql port=5432 user=$U dbname=$SRC' PUBLICATION $PUB WITH (copy_data = true, create_slot = false);"

echo "=== Wait for initial copy ==="
sleep 5
docker exec "$C" psql -U "$U" -d "$DST" -c "SELECT subname, pid, received_lsn, latest_end_lsn, last_msg_send_time FROM pg_stat_subscription;"
echo "=== Counts ==="
echo "primary users:"; docker exec "$C" psql -U "$U" -d "$SRC" -tAc "SELECT count(*) FROM users;"
echo "replica users:"; docker exec "$C" psql -U "$U" -d "$DST" -tAc "SELECT count(*) FROM users;"
echo "primary courses:"; docker exec "$C" psql -U "$U" -d "$SRC" -tAc "SELECT count(*) FROM courses;"
echo "replica courses:"; docker exec "$C" psql -U "$U" -d "$DST" -tAc "SELECT count(*) FROM courses;"

echo ""
echo "Logical replica enabled: $SRC -> $DST"
echo "New INSERT/UPDATE/DELETE on primary will apply to replica automatically."
echo "DDL (CREATE TABLE) is NOT replicated — republish after schema changes."
