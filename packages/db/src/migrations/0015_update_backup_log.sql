ALTER TYPE "backup_type" ADD VALUE 'dump';
ALTER TYPE "backup_type" ADD VALUE 'verify';
ALTER TYPE "backup_type" ADD VALUE 'drill';

ALTER TABLE "backup_log" ADD COLUMN "restored_rows" integer;