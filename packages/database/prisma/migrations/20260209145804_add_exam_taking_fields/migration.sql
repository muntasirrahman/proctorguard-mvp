-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "instructions" TEXT;

-- AlterTable
ALTER TABLE "ExamSession" ADD COLUMN     "lastViewedQuestionIndex" INTEGER NOT NULL DEFAULT 0;
