---
name: data-change
summary: Change how the app stores data (schema, format, location, migration) without ever losing the user's data - backup, migration, restore test
triggers: migrate, migration, schema, data format, storage, database change, move the data, rename the data, change where data is saved, convert the data, upgrade the data
menu: A6
---
# Playbook: change stored data safely

**Use when:** the shape, format or location of stored data changes. The data-safety rules are in
`docs/checks/app-standards.md`.

## Steps
1. **Inventory:** every file, table and key affected, and every reader and writer of it.
2. **Backup first:** the migration creates a dated backup before touching anything, and refuses to run if the backup
   fails.
3. **Migrate without deleting:** old data is kept until the new data is verified. Collisions go to a dated backup
   folder. A failed or partial read stops the migration, and never writes "empty".
4. **Test on copies:** real-shaped sample data, including empty, corrupt and huge cases. Test the **restore** too.
5. **Never on the user's real data during development:** sandbox folders only.
6. **Verify** the triple check, plus a before/after count of the records.

## Done when
- [ ] The answer names the backup, the restore test, and record counts before and after (hook: data-backup).
- [ ] Followed whenever a migration, schema or data format file changes, even unasked, with backup and restore stated (hook: data-change-trigger).
