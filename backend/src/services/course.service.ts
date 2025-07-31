import { PrismaClient, Course, CourseCategory, CourseLevel } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

export class CourseService {
  async getAllCourses(filters?: {
    category?: CourseCategory;
    level?: CourseLevel;
    search?: string;
  }) {
    const where = {
      ...(filters?.category && { category: filters.category }),
      ...(filters?.level && { level: filters.level }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    return prisma.course.findMany({
      where,
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: true,
            quiz: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });
  }

  async getCourseById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { id: 'asc' }
            },
            quiz: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new NotFoundError('Cours non trouvé');
    }

    return course;
  }

  async getCourseProgress(userId: string, courseId: string) {
    const progress = await prisma.progress.findMany({
      where: {
        userId,
        courseId
      },
      include: {
        lesson: true
      }
    });

    const course = await this.getCourseById(courseId);
    const totalLessons = course.modules.reduce(
      (acc, module) => acc + module.lessons.length,
      0
    );
    const completedLessons = progress.filter(p => p.completedAt).length;

    return {
      overallProgress: (completedLessons / totalLessons) * 100,
      completedLessons,
      totalLessons,
      currentModule: progress[0]?.currentModule || 1,
      currentLesson: progress[0]?.currentLesson || 1
    };
  }

  async enrollUserInCourse(userId: string, courseId: string) {
    return prisma.enrollment.create({
      data: {
        userId,
        courseId
      }
    });
  }

  async updateLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    completed: boolean
  ) {
    const progress = await prisma.progress.upsert({
      where: {
        userId_courseId_lessonId: {
          userId,
          courseId,
          lessonId
        }
      },
      update: {
        completedAt: completed ? new Date() : null
      },
      create: {
        userId,
        courseId,
        lessonId,
        completedAt: completed ? new Date() : null,
        currentModule: 1,
        currentLesson: 1
      }
    });

    // Mettre à jour la progression globale
    const courseProgress = await this.getCourseProgress(userId, courseId);
    await prisma.progress.updateMany({
      where: {
        userId,
        courseId
      },
      data: {
        overallProgress: courseProgress.overallProgress
      }
    });

    return progress;
  }

  async getEnrolledCourses(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true
          }
        }
      }
    });
  }
} 