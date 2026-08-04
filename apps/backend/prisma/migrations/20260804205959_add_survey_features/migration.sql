-- AlterTable
ALTER TABLE "question_options" ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "responses" ADD COLUMN     "maxScore" INTEGER,
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "isLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isQuiz" BOOLEAN NOT NULL DEFAULT false;
