---
name: data-change
summary: Change how the app stores data (schema, format, location, migration) without ever losing the user's data - backup, migration, restore test
triggers: migrate, migration, schema, data format, database change, move the data, rename the data, change where data is saved, convert the data, upgrade the data, data storage, storage format
trigger_regex: \b(add|new|rename|drop|remove) (a |an |the )?(['"]?\w+['"]? )?(column|field|table)\b|\bstore (the )?([\w']+ ){1,3}(too|as well)\b|\b(how|where) (\w+ ){0,2}(is|are) (saved|stored)\b|\bnew format\b
menu: A6
---
# Playbook: change stored data safely

**Use when:** the shape, format or location of stored data changes, including adding a column or field (a nullable
one still needs steps 1, 2 and 6). The data-safety rules are in `docs/checks/app-standards.md`.

## Steps
1. **Inventory:** every file, table and key affected, and every reader and writer of it.
2. **Backup first:** the migration creates a dated backup (`backups/<name>-YYYYMMDD-HHMM/`, or the folder
   `docs/foundation.md` names) before touching anything, and refuses to run if the backup fails.
3. **Migrate without deleting:** old data is kept until the new data is verified. Collisions go to a dated backup
   folder. A failed or partial read stops the migration, and never writes "empty".
   Each change is a numbered migration script in the repo, applied only by the migration tool. Run schema changes in
   a transaction where the database allows it (PostgreSQL does; MySQL and Oracle commit DDL at once), set a lock
   timeout, and build large indexes without blocking writes (PostgreSQL `CREATE INDEX CONCURRENTLY`).
   **A live app with old and new versions running at once:** expand (add the new field and write both), backfill old
   records, switch reads once both match, stop writing the old field, then remove it, each as its own release.
4. **Test on copies:** real-shaped sample data, including empty, corrupt and huge cases (10x the largest real size, or
   100k records if unknown). Test the **restore** too.
5. **Sandbox folders only,** never the user's real data during development. The answer names the sandbox path used.
6. **Verify** the triple check, plus a before/after count of the records.

## Done when
- [ ] The answer names the backup, the restore test, and record counts before and after (hook: data-backup) (answer: restore.*pass|restore.*ok|restore.*verified).
- [ ] Followed whenever a migration, schema or data format file changes, even unasked, with backup and restore stated (hook: data-change-trigger).

## Pitfalls
- Data written in the new format after the migration makes a rollback lossy. Say how to roll back, and what happens to
  data written since.
