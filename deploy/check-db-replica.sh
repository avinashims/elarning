#!/bin/bash
set -e
C=hotelbooking-postgres-1
echo "=== databases ==="
docker exec "$C" psql -U hotel -d postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) AS size FROM pg_database WHERE datname IN ('elearning','elearning_replica') ORDER BY 1;"
echo "=== replica tables ==="
docker exec "$C" psql -U hotel -d elearning_replica -c "SELECT relname AS table, n_live_tup AS approx_rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
echo "=== live counts ==="
docker exec "$C" psql -U hotel -d elearning -c "SELECT 'users' AS t, count(*) FROM users UNION ALL SELECT 'courses', count(*) FROM courses UNION ALL SELECT 'enrollments', count(*) FROM enrollments;"
echo "=== replica counts ==="
docker exec "$C" psql -U hotel -d elearning_replica -c "SELECT 'users' AS t, count(*) FROM users UNION ALL SELECT 'courses', count(*) FROM courses UNION ALL SELECT 'enrollments', count(*) FROM enrollments;"
