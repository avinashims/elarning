#!/bin/bash
set -e
C=hotelbooking-postgres-1
U=hotel
docker exec "$C" psql -U "$U" -d elearning_replica -c "DROP SUBSCRIPTION IF EXISTS elearning_sub;"
docker exec "$C" psql -U "$U" -d elearning -c "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name='elearning_sub';" || true
docker exec "$C" psql -U "$U" -d elearning -c "SELECT pg_create_logical_replication_slot('elearning_sub', 'pgoutput');"
docker exec "$C" psql -U "$U" -d elearning_replica -c "CREATE SUBSCRIPTION elearning_sub CONNECTION 'host=/var/run/postgresql port=5432 user=hotel dbname=elearning' PUBLICATION elearning_pub WITH (copy_data = true, create_slot = false);"
sleep 4
docker exec "$C" psql -U "$U" -d elearning_replica -c "SELECT subname, pid IS NOT NULL AS running, received_lsn, latest_end_lsn FROM pg_stat_subscription;"
echo primary_users=$(docker exec "$C" psql -U "$U" -d elearning -tAc "SELECT count(*) FROM users;")
echo replica_users=$(docker exec "$C" psql -U "$U" -d elearning_replica -tAc "SELECT count(*) FROM users;")
echo primary_courses=$(docker exec "$C" psql -U "$U" -d elearning -tAc "SELECT count(*) FROM courses;")
echo replica_courses=$(docker exec "$C" psql -U "$U" -d elearning_replica -tAc "SELECT count(*) FROM courses;")
