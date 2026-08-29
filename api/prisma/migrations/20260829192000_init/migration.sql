-- CreateTable
CREATE TABLE "Retainer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "leadEngineer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "retainerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "ragStatus" TEXT NOT NULL,
    "riskNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_retainerId_fkey" FOREIGN KEY ("retainerId") REFERENCES "Retainer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Retainer_status_idx" ON "Retainer"("status");

-- CreateIndex
CREATE INDEX "CheckIn_retainerId_idx" ON "CheckIn"("retainerId");

-- CreateIndex
CREATE INDEX "CheckIn_date_idx" ON "CheckIn"("date");
