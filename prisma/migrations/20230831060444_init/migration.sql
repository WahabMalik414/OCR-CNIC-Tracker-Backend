-- CreateTable
CREATE TABLE "Data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileHash" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "extractedData" TEXT NOT NULL,
    "createdDate" DATETIME,
    "modifiedDate" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Data_id_key" ON "Data"("id");
