import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ProgressService {
  /**
   * Calcule la progression globale d'une formation pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} formationId - ID de la formation
   * @returns {Promise<number>} Progression globale en pourcentage (0-100)
   */
  async calculateFormationProgress(userId, formationId) {
    try {
      // Récupérer toutes les leçons de la formation
      const formationContent = await prisma.formationContent.findMany({
        where: {
          formationId,
          contentType: "LESSON",
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (formationContent.length === 0) {
        return 0; // Aucune leçon, progression à 0%
      }

      // Récupérer les progressions des leçons pour cet utilisateur
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          formationId,
          lessonId: {
            in: formationContent.map((lesson) => lesson.id),
          },
        },
        select: {
          lessonId: true,
          progress: true,
          isCompleted: true,
        },
      });

      // Créer un map pour faciliter la recherche
      const progressMap = new Map();
      userProgress.forEach((progress) => {
        progressMap.set(progress.lessonId, progress);
      });

      // Calculer la progression globale
      let totalProgress = 0;
      let lessonsWithProgress = 0;

      formationContent.forEach((lesson) => {
        const progress = progressMap.get(lesson.id);
        if (progress) {
          // Si la leçon est marquée comme complétée, utiliser 100%
          if (progress.isCompleted) {
            totalProgress += 100;
          } else {
            // Sinon, utiliser la progression spécifique
            totalProgress += Math.min(100, Math.max(0, progress.progress));
          }
          lessonsWithProgress++;
        }
      });

      // Si aucune leçon n'a de progression, retourner 0
      if (lessonsWithProgress === 0) {
        return 0;
      }

      // Calculer la moyenne
      const averageProgress = totalProgress / formationContent.length;
      return Math.round(averageProgress * 100) / 100; // Arrondir à 2 décimales
    } catch (error) {
      console.error("Erreur lors du calcul de la progression:", error);
      return 0;
    }
  }

  /**
   * Met à jour la progression globale dans FormationAssignment
   * @param {string} userId - ID de l'utilisateur
   * @param {string} formationId - ID de la formation
   * @returns {Promise<number>} Nouvelle progression globale
   */
  async updateFormationAssignmentProgress(userId, formationId) {
    try {
      // Calculer la nouvelle progression
      const globalProgress = await this.calculateFormationProgress(
        userId,
        formationId
      );

      // Note: FormationAssignment n'a pas de champ progress dans le schéma actuel
      // La progression globale est calculée dynamiquement depuis UserProgress
      // On pourrait ajouter un champ progress à FormationAssignment si nécessaire

      return globalProgress;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la progression:", error);
      return 0;
    }
  }

  /**
   * Met à jour la progression d'une leçon spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} lessonId - ID de la leçon
   * @param {number} progress - Progression de la leçon (0-100)
   * @param {boolean} isCompleted - Si la leçon est complétée
   * @returns {Promise<number>} Nouvelle progression globale de la formation
   */
  async updateLessonProgress(userId, lessonId, progress, isCompleted = false) {
    try {
      // Récupérer la leçon pour obtenir l'ID de la formation
      const lesson = await prisma.formationContent.findUnique({
        where: { id: lessonId },
        select: { formationId: true },
      });

      if (!lesson) {
        throw new Error("Leçon non trouvée");
      }

      // Mettre à jour ou créer la progression de la leçon
      await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          progress: Math.min(100, Math.max(0, progress)),
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          formationId: lesson.formationId,
          progress: Math.min(100, Math.max(0, progress)),
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
        },
      });

      // Mettre à jour la progression globale de la formation
      return await this.updateFormationAssignmentProgress(
        userId,
        lesson.formationId
      );
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la progression de la leçon:",
        error
      );
      return 0;
    }
  }

  /**
   * Récupère la progression détaillée d'une formation pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} formationId - ID de la formation
   * @returns {Promise<Object>} Détails de la progression
   */
  async getFormationProgressDetails(userId, formationId) {
    try {
      // Récupérer toutes les leçons de la formation
      const formationContent = await prisma.formationContent.findMany({
        where: {
          formationId,
          contentType: "LESSON",
        },
        select: {
          id: true,
          title: true,
          duration: true,
          order: true,
        },
        orderBy: { order: "asc" },
      });

      // Récupérer les progressions des leçons
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          formationId,
          lessonId: {
            in: formationContent.map((lesson) => lesson.id),
          },
        },
        select: {
          lessonId: true,
          progress: true,
          isCompleted: true,
          lastAccessedAt: true,
          completedAt: true,
        },
      });

      // Créer un map pour faciliter la recherche
      const progressMap = new Map();
      userProgress.forEach((progress) => {
        progressMap.set(progress.lessonId, progress);
      });

      // Calculer les statistiques
      const totalLessons = formationContent.length;
      const completedLessons = userProgress.filter((p) => p.isCompleted).length;
      const globalProgress = await this.calculateFormationProgress(
        userId,
        formationId
      );

      // Détails par leçon
      const lessonDetails = formationContent.map((lesson) => {
        const progress = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          order: lesson.order,
          progress: progress ? progress.progress : 0,
          isCompleted: progress ? progress.isCompleted : false,
          lastAccessedAt: progress ? progress.lastAccessedAt : null,
          completedAt: progress ? progress.completedAt : null,
        };
      });

      return {
        globalProgress,
        totalLessons,
        completedLessons,
        remainingLessons: totalLessons - completedLessons,
        lessonDetails,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de progression:",
        error
      );
      return {
        globalProgress: 0,
        totalLessons: 0,
        completedLessons: 0,
        remainingLessons: 0,
        lessonDetails: [],
      };
    }
  }
}

export default new ProgressService();
