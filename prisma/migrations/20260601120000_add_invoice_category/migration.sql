-- Add invoice category and backfill from invoiceType
ALTER TABLE "invoices" ADD COLUMN "invoiceCategory" TEXT;

UPDATE "invoices"
SET "invoiceCategory" = CASE
  WHEN LOWER("invoiceType") = 'service' THEN 'SERVICE'
  ELSE 'NA'
END;

ALTER TABLE "invoices" ALTER COLUMN "invoiceCategory" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "invoiceCategory" SET DEFAULT 'NA';
