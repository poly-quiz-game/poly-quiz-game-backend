-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "coverImage" VARCHAR(255),
    "backgroundImage" VARCHAR(255),
    "music" VARCHAR(255),
    "needLogin" BOOLEAN NOT NULL DEFAULT false,
    "numberOfPlayer" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "image" VARCHAR(255),
    "correctAnswer" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "index" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" VARCHAR(255) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("index","questionId")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quizId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportQuestion" (
    "id" SERIAL NOT NULL,
    "image" VARCHAR(255),
    "correctAnswer" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "reportId" INTEGER NOT NULL,

    CONSTRAINT "ReportQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportQuestionAnswer" (
    "index" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" VARCHAR(255) NOT NULL,

    CONSTRAINT "ReportQuestionAnswer_pkey" PRIMARY KEY ("index","questionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportQuestion" ADD CONSTRAINT "ReportQuestion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportQuestionAnswer" ADD CONSTRAINT "ReportQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReportQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
