# Database replica (Avi SkillStream / e-learning)

This document is the full process for your **live DigitalOcean** Postgres:

| Item | Value |
|------|--------|
| Server | `165.22.209.200` |
| Postgres container | `hotelbooking-postgres-1` |
| Superuser | `hotel` |
| **Primary (live app)** | `elearning` |
| **Replica** | `elearning_replica` |
| Web / API | still use `elearning` only |

**Do not** set API `DATABASE_URL` to `elearning_replica`. The site must write to **primary**. Replica is for reports, pgAdmin, and a near-live copy.

There are two replica types. You need **logical replication** if you want the replica to **update automatically**.

```
App (port 9001) ──writes──►  elearning          (PRIMARY)
                                  │
                                  │  logical replication (automatic INSERT/UPDATE/DELETE)
                                  ▼
                             elearning_replica   (REPLICA, read copy)
```

---

## 1. Snapshot replica (manual copy)

A **one-time dump**. Replica does **not** change when primary changes until you run the script again.

Use this only for a backup-style copy, or as a first step before enabling logical replication.

### 1.1 SSH

```bash
ssh root@165.22.209.200
```

### 1.2 Confirm Postgres and primary DB

```bash
docker ps | grep postgres
# expect: hotelbooking-postgres-1

docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "\l"
```

You should see `elearning`.

### 1.3 Create / refresh snapshot

Scripts live in the repo: `deploy/create-db-replica.sh`. On the server you can copy them to `/tmp` (fix Windows line endings if needed):

```bash
sed -i 's/\r$//' /tmp/create-db-replica.sh
bash /tmp/create-db-replica.sh
```

What the script does:

1. `pg_dump -Fc` of `elearning`
2. `DROP DATABASE elearning_replica` if it exists
3. `CREATE DATABASE elearning_replica OWNER elearning`
4. `pg_restore` into `elearning_replica`

### 1.4 Check snapshot

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c \
  "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datname IN ('elearning','elearning_replica');"

docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c "SELECT count(*) FROM users;"
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c "SELECT count(*) FROM users;"
```

**Limitation:** new registrations and purchases appear **only** in `elearning` until you re-run the dump script.

---

## 2. Automatic replica (logical replication) — recommended

PostgreSQL **logical replication** copies **row changes** from primary to replica **continuously**.

This is **not** a second Postgres server. Both databases sit in **`hotelbooking-postgres-1`**.

### 2.1 Concepts

| Object | Where | Role |
|--------|--------|------|
| **Publication** `elearning_pub` | database `elearning` | Publishes all tables |
| **Replication slot** `elearning_sub` | primary | Stores WAL until replica has applied it |
| **Subscription** `elearning_sub` | database `elearning_replica` | Pulls changes and applies them |

What **is** replicated automatically:

- `INSERT`, `UPDATE`, `DELETE` on existing tables (`users`, `courses`, `enrollments`, …)

What is **not** replicated:

- `CREATE TABLE` / `ALTER TABLE` / Prisma `db push` (schema)
- Sequence next-values (`SERIAL` / some `DEFAULT` identity)

### 2.2 Requirements

- PostgreSQL **10+** (live is **16.x**)
- `wal_level = logical` (needs **one Postgres restart**, ~10 seconds — hotelbooking + e-learning DB pause together)
- Superuser with `REPLICATION` (`hotel`)
- Replica database with the **same table structure** as primary (empty tables are OK; data is copied on subscribe)

### 2.3 One-command setup (scripts)

From your PC, copy scripts then run on the server:

```bash
scp deploy/enable-logical-replica.sh root@165.22.209.200:/tmp/
ssh root@165.22.209.200
sed -i 's/\r$//' /tmp/enable-logical-replica.sh
bash /tmp/enable-logical-replica.sh
```

**Important:** On the **same** Postgres instance, `CREATE SUBSCRIPTION ... WITH (create_slot = true)` **deadlocks**. The script creates the slot **first**, then:

```sql
CREATE SUBSCRIPTION ... WITH (copy_data = true, create_slot = false);
```

If subscribe hangs, cancel it and run `deploy/fix-logical-subscription.sh` (same idea).

### 2.4 Manual steps (same process, no script)

SSH in, then:

**A. Enable logical WAL (once)**

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "ALTER SYSTEM SET wal_level = 'logical';"
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "ALTER SYSTEM SET max_replication_slots = 10;"
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "ALTER SYSTEM SET max_wal_senders = 10;"
docker restart hotelbooking-postgres-1
# wait until ready
docker exec hotelbooking-postgres-1 pg_isready -U hotel
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c "SHOW wal_level;"
# must print: logical

docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "ALTER USER hotel WITH REPLICATION;"
```

**B. Recreate replica with schema only (no data)**

If a snapshot `elearning_replica` already exists, drop it. Subscription objects live **inside** the replica DB.

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='elearning_replica' AND pid <> pg_backend_pid();"

docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "DROP DATABASE IF EXISTS elearning_replica;"
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c "CREATE DATABASE elearning_replica OWNER elearning;"

docker exec hotelbooking-postgres-1 pg_dump -U hotel -s --no-owner --no-acl -d elearning -f /tmp/elearning_schema.sql
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -v ON_ERROR_STOP=1 -f /tmp/elearning_schema.sql
```

**C. Publication on primary**

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c "DROP PUBLICATION IF EXISTS elearning_pub;"
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c "CREATE PUBLICATION elearning_pub FOR ALL TABLES;"
```

**D. Slot on primary, then subscription on replica**

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c "DROP SUBSCRIPTION IF EXISTS elearning_sub;"

docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name='elearning_sub';"

docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "SELECT pg_create_logical_replication_slot('elearning_sub', 'pgoutput');"

docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c \
  "CREATE SUBSCRIPTION elearning_sub CONNECTION 'host=/var/run/postgresql port=5432 user=hotel dbname=elearning' PUBLICATION elearning_pub WITH (copy_data = true, create_slot = false);"
```

`copy_data = true` copies existing rows once, then streams new changes.

---

## 3. How automatic update works

1. App writes to **`elearning`** (register, buy course, schedule live class).
2. Postgres writes the change to **WAL**.
3. Publication `elearning_pub` includes that table.
4. Slot `elearning_sub` keeps WAL until the replica has it.
5. Subscription worker in **`elearning_replica`** applies the same `INSERT`/`UPDATE`/`DELETE`.

Typical lag: **under a few seconds**.

You do **not** re-run `pg_dump` for every user action.

---

## 4. Verify replica and auto-sync

### 4.1 Subscription is running

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c \
  "SELECT subname, pid IS NOT NULL AS running, received_lsn, latest_end_lsn, last_msg_receipt_time FROM pg_stat_subscription;"
```

`running` must be **`t`**. If `f` / `pid` is null, the apply worker is down (see troubleshooting).

### 4.2 Slot on primary

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "SELECT slot_name, plugin, active, confirmed_flush_lsn FROM pg_replication_slots;"
```

### 4.3 Row counts match

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "SELECT 'users' t, count(*) FROM users UNION ALL SELECT 'courses', count(*) FROM courses;"

docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c \
  "SELECT 'users' t, count(*) FROM users UNION ALL SELECT 'courses', count(*) FROM courses;"
```

### 4.4 Live write test

```bash
# primary
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "INSERT INTO categories (id, name, slug) VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'replica-auto-test', 'replica-auto-test');"

sleep 2

# replica should return 1
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c \
  "SELECT count(*) FROM categories WHERE slug = 'replica-auto-test';"

# cleanup
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning -c \
  "DELETE FROM categories WHERE slug = 'replica-auto-test';"

sleep 2
# replica should return 0
docker exec hotelbooking-postgres-1 psql -U hotel -d elearning_replica -c \
  "SELECT count(*) FROM categories WHERE slug = 'replica-auto-test';"
```

Helper script: `deploy/verify-logical-replica.sh` / `/tmp/verify-logical-replica.sh`.

### 4.5 pgAdmin (port 5050)

URL: `http://165.22.209.200:5050`

If the browser says **connection refused**, pgAdmin container is stopped (it uses RAM). Start it:

```bash
docker start hotelbooking-pgadmin-1
```

Typical login: `admin@hotelbooking.dev` / `admin123`.

Register / open server:

- **Host:** `hotelbooking-postgres-1` (not `localhost`)
- **Port:** `5432`
- **User:** `hotel` or `elearning`
- Databases: **`elearning`** (live) and **`elearning_replica`**

---

## 5. After Prisma / schema changes (`db push`)

Logical replication does **not** copy `ALTER TABLE` / new tables.

1. Apply schema on **primary** (API entrypoint `prisma db push`, or manual).
2. Apply the **same** schema on replica (dump schema and restore, or run the same `CREATE`/`ALTER` on `elearning_replica`).
3. If a **new table** was added:

```sql
-- on elearning
ALTER PUBLICATION elearning_pub ADD TABLE "NewTable";  -- use real table name from \dt

-- on elearning_replica (after the table exists there)
ALTER SUBSCRIPTION elearning_sub REFRESH PUBLICATION;
```

`FOR ALL TABLES` publication **does not auto-add** tables created later. You must `ADD TABLE` + `REFRESH PUBLICATION`.

---

## 6. Troubleshooting

| Problem | Cause | Fix |
|---------|--------|-----|
| `CREATE SUBSCRIPTION` hangs | Same-instance deadlock (`create_slot = true`) | Cancel PIDs; create slot first; subscribe with `create_slot = false` |
| `running = f` | Worker crashed, Postgres restarted | `ALTER SUBSCRIPTION elearning_sub ENABLE;` or drop/recreate subscription |
| Replica missing new rows | Subscription disabled or slot inactive | Check `pg_stat_subscription` and `pg_replication_slots` |
| Duplicate key on replica | Replica had leftover data + `copy_data` | Drop replica DB, restore **schema only**, subscribe again |
| pgAdmin :5050 refused | `hotelbooking-pgadmin-1` exited (OOM) | `docker start hotelbooking-pgadmin-1` |
| Site down after `wal_level` change | Postgres restart | Wait for `pg_isready`; API container should reconnect |
| New Prisma table empty on replica | DDL not replicated | Create table on replica, `ALTER PUBLICATION ... ADD TABLE`, `REFRESH PUBLICATION` |

Cancel a stuck query:

```bash
docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c \
  "SELECT pid, datname, wait_event, left(query,80) FROM pg_stat_activity;"

docker exec hotelbooking-postgres-1 psql -U hotel -d postgres -c \
  "SELECT pg_terminate_backend(PID_HERE);"
```

Disable / drop replication (back to snapshot-only):

```sql
-- on elearning_replica
DROP SUBSCRIPTION IF EXISTS elearning_sub;

-- on elearning
SELECT pg_drop_replication_slot('elearning_sub');
DROP PUBLICATION IF EXISTS elearning_pub;
```

---

## 7. Scripts in this repo

| File | Purpose |
|------|---------|
| `deploy/create-db-replica.sh` | Snapshot dump/restore (no auto-sync) |
| `deploy/check-db-replica.sh` | Size + table/row checks |
| `deploy/enable-logical-replica.sh` | WAL logical + publication + subscription |
| `deploy/fix-logical-subscription.sh` | Slot-first subscribe if setup hung |
| `deploy/verify-logical-replica.sh` | Insert/delete test on `categories` |

On the droplet they may already be under `/tmp/` from an earlier copy.

---

## 8. What was already done on live (Oct 2026)

- `wal_level = logical`
- DB `elearning_replica` exists
- Publication `elearning_pub`, slot + subscription `elearning_sub`
- Auto-sync verified with a test row on `categories`

To confirm later, only run **section 4** (verify). Re-running `enable-logical-replica.sh` **drops the replica database** and recopies everything.
