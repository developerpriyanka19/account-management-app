CREATE TABLE "farmer_debit_notes" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "dbNo" TEXT,
    "amount" DOUBLE PRECISION,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_debit_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "farmer_debit_notes_customerId_idx" ON "farmer_debit_notes"("customerId");

ALTER TABLE "farmer_debit_notes" ADD CONSTRAINT "farmer_debit_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "farmer_debit_notes" ("customerId", "category", "dbNo", "amount", "remark")
SELECT
    id,
    'ATL_GPA',
    "debitNoteNo",
    "debitNoteAmount",
    NULL
FROM "Customer"
WHERE TRIM(COALESCE("debitNoteNo", '')) <> ''
   OR "debitNoteAmount" IS NOT NULL;
