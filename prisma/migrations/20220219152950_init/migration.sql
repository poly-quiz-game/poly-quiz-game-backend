/*
  Warnings:

  - Added the required column `answer` to the `PlayerAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerAnswer" DROP COLUMN "answer",
ADD COLUMN     "answer" INTEGER NOT NULL;
