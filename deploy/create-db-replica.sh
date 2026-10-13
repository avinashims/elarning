#!/bin/bash
# Clone live database "elearning" -> "elearning_replica" on the same Postgres.
# Run on the droplet:
#   bash deploy/create-db-replica.sh
#
# This is a snapshot replica (pg_dump), not streaming replication.
# Re-run anytime to refresh the copy from production.

set -euo pipefail

PG_CONTAINER="${PG_CONTAINER:-hotelbooking-postgres-1}"
SRC_DB="${SRC_DB:-elearning}"
REPLICA_DB="${REPLICA_DB:-elearning_replica}"
DUMP_FILE="/tmp/${SRC_DB}_replica.dump"

if ! docker inspect "$PG_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: $PG_CONTAINER"
  echo "Running postgres containers:"
  docker ps --format '{{.Names}}' | grep -i postgres || true
  exit 1
fi

# Superuser inside hotelbooking postgres is typically "hotel" or "postgres"
PG_SUPERUSER="${PG_SUPERUSER:-}"
if [ -z "$PG_SUPERUSER" ]; then
  for u in hotel postgres elearning; do
    if docker exec "$PG_CONTAINER" psql -U "$u" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
      PG_SUPERUSER="$u"
      break
    fi
  done
fi

if [ -z "$PG_SUPERUSER" ]; then
  echo "Could not find a working Postgres superuser. Set PG_SUPERUSER=hotel (or postgres)."
  exit 1
fi

echo "Using container=$PG_CONTAINER user=$PG_SUPERUSER"
echo "Cloning $SRC_DB -> $REPLICA_DB"

docker exec "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$SRC_DB'" | grep -q 1 || {
  echo "Source database '$SRC_DB' does not exist."
  exit 1
}

echo "Dumping $SRC_DB ..."
docker exec "$PG_CONTAINER" pg_dump -U "$PG_SUPERUSER" -Fc --no-owner --no-acl -d "$SRC_DB" > "$DUMP_FILE"

echo "Recreating $REPLICA_DB ..."
docker exec "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$REPLICA_DB' AND pid <> pg_backend_pid();" >/dev/null
docker exec "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d postgres -c "DROP DATABASE IF EXISTS $REPLICA_DB;"
docker exec "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d postgres -c "CREATE DATABASE $REPLICA_DB OWNER elearning;"

echo "Restoring into $REPLICA_DB ..."
docker exec -i "$PG_CONTAINER" pg_restore -U "$PG_SUPERUSER" --no-owner --no-acl --role=elearning -d "$REPLICA_DB" < "$DUMP_FILE" || true

rm -f "$DUMP_FILE"

TABLES=$(docker exec "$PG_CONTAINER" psql -U "$PG_SUPERUSER" -d "$REPLICA_DB" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
echo ""
echo "Replica ready: $REPLICA_DB  (public tables: $TABLES)"
echo "Connect: postgresql://elearning:YOUR_PASSWORD@$PG_CONTAINER:5432/$REPLICA_DB"
echo "Do not point the live API DATABASE_URL at $REPLICA_DB unless you intend to run against the copy."
