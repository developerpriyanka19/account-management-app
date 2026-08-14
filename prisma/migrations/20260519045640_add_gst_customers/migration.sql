-- CreateTable
CREATE TABLE "gst_customers" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "gstNumber" TEXT NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "state" TEXT,
    "gstStatus" TEXT,
    "panNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gst_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gst_customers_gstNumber_key" ON "gst_customers"("gstNumber");
