-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Room_lastActivityAt_idx" ON "Room"("lastActivityAt");
