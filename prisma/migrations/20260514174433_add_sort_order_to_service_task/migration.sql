-- Migration: add sortOrder to ServiceTask
-- This migration adds only the sortOrder column to ServiceTask.
-- No other tables, indexes, or foreign keys are modified.

-- AddColumn
ALTER TABLE "ServiceTask" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;