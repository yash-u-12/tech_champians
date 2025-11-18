-- CreateTable
CREATE TABLE "HospitalVisit" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'checked_in',
    "arrivalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "doctorName" TEXT,
    "roomId" TEXT,
    "triageData" JSONB,
    "labResults" JSONB,
    "prescription" JSONB,
    "prescriptionInstructions" TEXT,
    "followUp" TEXT,
    "invoice" JSONB,
    "medicationsDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HospitalVisit_appointmentId_key" ON "HospitalVisit"("appointmentId");

-- CreateIndex
CREATE INDEX "HospitalVisit_patientId_createdAt_idx" ON "HospitalVisit"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "HospitalVisit_appointmentId_idx" ON "HospitalVisit"("appointmentId");

-- AddForeignKey
ALTER TABLE "HospitalVisit" ADD CONSTRAINT "HospitalVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("clerkUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
