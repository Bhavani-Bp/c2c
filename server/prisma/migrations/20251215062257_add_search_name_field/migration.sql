-- AlterTable
ALTER TABLE "User" ADD COLUMN     "searchName" TEXT;

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_searchName_idx" ON "User"("searchName");
