/*
  Warnings:

  - Added the required column `type` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CORRECT_ANSWER', 'MULTIPLE_CORRECT_ANSWER', 'TRUE_FALSE_ANSWER');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "type" "QuestionType" NOT NULL,
ALTER COLUMN "correctAnswer" SET DATA TYPE TEXT;
