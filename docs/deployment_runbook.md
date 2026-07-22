# Deployment Runbook — Database Backup & Rollback

This runbook outlines the required procedure for executing database migrations on the production system.

## 1. Pre-Migration Database Backup (Mandatory)

Always perform a full logical backup of the PostgreSQL database before applying any new migration.

```bash
# Execute pg_dump to create a compressed custom-format backup file
pg_dump -U postgres -h localhost -d psc_db -F c -b -v -f psc_db_backup_$(date +%F_%T).dump
```

## 2. Apply Migration

Deploy the latest Prisma migrations:

```bash
npx prisma migrate deploy
```

## 3. Rollback Procedure

If the migration fails or issues are detected in production, rollback immediately to the pre-migration state:

```bash
# Restore from the backup file
pg_restore -U postgres -h localhost -d psc_db -c -v psc_db_backup_xxx.dump
```
