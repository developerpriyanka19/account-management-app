-- Structured billing address for GST customers (invoice Bill To section)
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "buildingNumber" TEXT;
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "locality" TEXT;
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "village" TEXT;
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "gst_customers" ADD COLUMN IF NOT EXISTS "pincode" TEXT;
