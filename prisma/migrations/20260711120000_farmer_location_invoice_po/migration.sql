-- AlterTable Customer: farmer location fields
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "taluk" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "hobbli" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "village" TEXT;

-- AlterTable invoices: P.O Number and P.O Date
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "poDate" TEXT;
