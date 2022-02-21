-- AlterTable
ALTER TABLE "ReportQuestionAnswer" ADD COLUMN     "playerAnswerPlayerId" INTEGER,
ADD COLUMN     "playerAnswerQuestionId" INTEGER,
ADD COLUMN     "playerId" INTEGER;

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "score" INTEGER NOT NULL DEFAULT 0,
    "reportId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerAnswer" (
    "playerId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" VARCHAR(255),
    "time" INTEGER NOT NULL DEFAULT 0,
    "reportId" INTEGER NOT NULL,

    CONSTRAINT "PlayerAnswer_pkey" PRIMARY KEY ("playerId","questionId")
);

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAnswer" ADD CONSTRAINT "PlayerAnswer_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAnswer" ADD CONSTRAINT "PlayerAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportQuestionAnswer" ADD CONSTRAINT "ReportQuestionAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportQuestionAnswer" ADD CONSTRAINT "ReportQuestionAnswer_playerAnswerPlayerId_playerAnswerQues_fkey" FOREIGN KEY ("playerAnswerPlayerId", "playerAnswerQuestionId") REFERENCES "PlayerAnswer"("playerId", "questionId") ON DELETE SET NULL ON UPDATE CASCADE;
