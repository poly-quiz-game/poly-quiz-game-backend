/*
  Warnings:

  - You are about to drop the column `reportId` on the `PlayerAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `playerAnswerPlayerId` on the `ReportQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `playerAnswerQuestionId` on the `ReportQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `ReportQuestionAnswer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlayerAnswer" DROP CONSTRAINT "PlayerAnswer_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerAnswer" DROP CONSTRAINT "PlayerAnswer_reportId_fkey";

-- DropForeignKey
ALTER TABLE "ReportQuestionAnswer" DROP CONSTRAINT "ReportQuestionAnswer_playerAnswerPlayerId_playerAnswerQues_fkey";

-- DropForeignKey
ALTER TABLE "ReportQuestionAnswer" DROP CONSTRAINT "ReportQuestionAnswer_playerId_fkey";

-- AlterTable
ALTER TABLE "PlayerAnswer" DROP COLUMN "reportId";

-- AlterTable
ALTER TABLE "ReportQuestionAnswer" DROP COLUMN "playerAnswerPlayerId",
DROP COLUMN "playerAnswerQuestionId",
DROP COLUMN "playerId";
