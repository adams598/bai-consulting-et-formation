import { PrismaClient, Quiz, Question, QuizAttempt } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

export class QuizService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getQuizById(quizId: string): Promise<Quiz & { questions: Question[] }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    });

    if (!quiz) {
      throw new NotFoundError('Quiz non trouvé');
    }

    return quiz;
  }

  async submitQuizAttempt(
    userId: string,
    quizId: string,
    answers: { questionId: string; answer: string }[]
  ): Promise<QuizAttempt> {
    const quiz = await this.getQuizById(quizId);
    
    // Calculer le score
    let correctAnswers = 0;
    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        correctAnswers++;
      }
    }

    const score = (correctAnswers / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    // Créer la tentative
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        passed,
        answers: answers.map(a => ({
          questionId: a.questionId,
          answer: a.answer
        }))
      }
    });

    // Si le quiz est réussi, mettre à jour la progression
    if (passed) {
      await this.prisma.progress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId: quiz.lessonId
          }
        },
        data: {
          completed: true,
          completedAt: new Date()
        }
      });
    }

    return attempt;
  }

  async getQuizAttempts(
    userId: string,
    quizId: string
  ): Promise<QuizAttempt[]> {
    return this.prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getQuizStatistics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  }> {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId }
    });

    const totalAttempts = attempts.length;
    const averageScore = attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts;
    const passRate = (attempts.filter(a => a.passed).length / totalAttempts) * 100;

    return {
      totalAttempts,
      averageScore,
      passRate
    };
  }
} 