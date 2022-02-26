/*
  Warnings:

  - Added the required column `type` to the `ReportQuestion` table without a default value. This is not possible if the table is not empty.
  - Made the column `question` on table `ReportQuestion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ReportQuestion" ADD COLUMN     "type" "QuestionType" NOT NULL,
ALTER COLUMN "question" SET NOT NULL;
