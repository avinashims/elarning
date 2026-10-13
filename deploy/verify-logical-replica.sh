#!/bin/bash
set -e
C=hotelbooking-postgres-1
U=hotel
ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
docker exec "$C" psql -U "$U" -d elearning -c "INSERT INTO categories (id, name, slug) VALUES ('$ID', 'replica-auto-test', 'replica-auto-test');"
sleep 2
echo replica_has_row:
docker exec "$C" psql -U "$U" -d elearning_replica -tAc "SELECT count(*) FROM categories WHERE id='$ID';"
docker exec "$C" psql -U "$U" -d elearning -c "DELETE FROM categories WHERE id='$ID';"
sleep 2
echo replica_after_delete:
docker exec "$C" psql -U "$U" -d elearning_replica -tAc "SELECT count(*) FROM categories WHERE id='$ID';"
