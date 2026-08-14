DO $$
BEGIN
  IF to_regclass('"debit_notes"') IS NOT NULL THEN
    ALTER TABLE "debit_notes" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;
