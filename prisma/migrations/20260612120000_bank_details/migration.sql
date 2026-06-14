-- CreateTable
CREATE TABLE "bank_details" (
    "id" SERIAL NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "branchName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices" ADD COLUMN "bankDetailsId" INTEGER,
ADD COLUMN "bankName" TEXT,
ADD COLUMN "accountHolderName" TEXT,
ADD COLUMN "accountNumber" TEXT,
ADD COLUMN "ifscCode" TEXT,
ADD COLUMN "branchName" TEXT;

ALTER TABLE "debit_notes" ADD COLUMN "bankDetailsId" INTEGER,
ADD COLUMN "bankName" TEXT,
ADD COLUMN "accountHolderName" TEXT,
ADD COLUMN "accountNumber" TEXT,
ADD COLUMN "ifscCode" TEXT,
ADD COLUMN "branchName" TEXT;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bankDetailsId_fkey" FOREIGN KEY ("bankDetailsId") REFERENCES "bank_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "debit_notes" ADD CONSTRAINT "debit_notes_bankDetailsId_fkey" FOREIGN KEY ("bankDetailsId") REFERENCES "bank_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
