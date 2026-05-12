-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "slNo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmerName" TEXT,
    "changedFarmerName" TEXT,
    "vendorCode" TEXT,
    "surveyNo" TEXT,
    "newSurveyNo" TEXT,
    "rtcExtentAcre" DOUBLE PRECISION,
    "rtcExtentGunta" DOUBLE PRECISION,
    "rtcAKharab" DOUBLE PRECISION,
    "rtcBKharab" DOUBLE PRECISION,
    "balanceExtentAcre" DOUBLE PRECISION,
    "balanceExtentGunta" DOUBLE PRECISION,
    "leaseExtentAcre" DOUBLE PRECISION,
    "leaseExtentGunta" DOUBLE PRECISION,
    "leaseAmount" DOUBLE PRECISION,
    "leaseDeedStampDuty" DOUBLE PRECISION,
    "leaseDeedRegCharges" DOUBLE PRECISION,
    "totalGunta" DOUBLE PRECISION,
    "totalCents" DOUBLE PRECISION,
    "rentPerAcre" DOUBLE PRECISION,
    "balanceRentAmount" DOUBLE PRECISION,
    "rentAmount" DOUBLE PRECISION,
    "tdsAmount" DOUBLE PRECISION,
    "aesAdvanceChequeAmount" DOUBLE PRECISION,
    "aesAdvanceDate" TEXT,
    "aesAdvanceChequeNo" TEXT,
    "aesAdvanceBankName" TEXT,
    "shortageChequeAmount" DOUBLE PRECISION,
    "shortageDate" TEXT,
    "shortageChequeNo" TEXT,
    "shortageBankName" TEXT,
    "atlStampDuty" DOUBLE PRECISION,
    "atlRegCharges" DOUBLE PRECISION,
    "atlTotal" DOUBLE PRECISION,
    "paoStampDuty" DOUBLE PRECISION,
    "paoRegCharges" DOUBLE PRECISION,
    "paoTotal" DOUBLE PRECISION,
    "landConversion" DOUBLE PRECISION,
    "podiFee" DOUBLE PRECISION,
    "cropCompensation" DOUBLE PRECISION,
    "debitNoteNo" TEXT,
    "debitNoteAmount" DOUBLE PRECISION,
    "receivedNeftAmount" DOUBLE PRECISION,
    "receivedDate" TEXT,
    "balanceReceivable" DOUBLE PRECISION,
    "loanAmount" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
