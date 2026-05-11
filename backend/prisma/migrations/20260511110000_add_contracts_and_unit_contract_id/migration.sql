-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "contractId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Unit_contractId_key" ON "Unit"("contractId");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
