// progressService.ts - Service simple de persistance des progressions
export interface LessonProgress {
  lessonId: string;
  timeSpent: number;
  progress: number;
  completed: boolean;
  lastUpdated: string; // ISO string pour la sérialisation
}

export interface FormationProgress {
  formationId: string;
  userId: string;
  lessons: { [lessonId: string]: LessonProgress };
}

class ProgressService {
  private readonly STORAGE_KEY = 'lesson_progress';

  // Récupérer toutes les progressions
  private getAllProgress(): FormationProgress[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des progressions:', error);
      return [];
    }
  }

  // Sauvegarder toutes les progressions
  private saveAllProgress(progress: FormationProgress[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des progressions:', error);
    }
  }

  // Récupérer les progressions pour une formation et un utilisateur
  getProgress(formationId: string, userId: string, lessons: any[]): { [lessonId: string]: LessonProgress } {
    const allProgress = this.getAllProgress();
    const formationProgress = allProgress.find(
      p => p.formationId === formationId && p.userId === userId
    );

    if (!formationProgress) {
      // Initialiser avec des progressions vides
      const emptyProgress: { [lessonId: string]: LessonProgress } = {};
      lessons.forEach(lesson => {
        emptyProgress[lesson.id] = {
          lessonId: lesson.id,
          timeSpent: 0,
          progress: 0,
          completed: false,
          lastUpdated: new Date().toISOString()
        };
      });
      return emptyProgress;
    }

    return formationProgress.lessons;
  }

  // Mettre à jour la progression d'une leçon
  updateProgress(
    formationId: string, 
    userId: string, 
    lessonId: string, 
    progress: Partial<Omit<LessonProgress, 'lessonId' | 'lastUpdated'>>
  ): void {
    const allProgress = this.getAllProgress();
    let formationProgress = allProgress.find(
      p => p.formationId === formationId && p.userId === userId
    );

    if (!formationProgress) {
      // Créer une nouvelle entrée
      formationProgress = {
        formationId,
        userId,
        lessons: {}
      };
      allProgress.push(formationProgress);
    }

    // Mettre à jour la progression
    if (!formationProgress.lessons[lessonId]) {
      formationProgress.lessons[lessonId] = {
        lessonId,
        timeSpent: 0,
        progress: 0,
        completed: false,
        lastUpdated: new Date().toISOString()
      };
    }

    formationProgress.lessons[lessonId] = {
      ...formationProgress.lessons[lessonId],
      ...progress,
      lastUpdated: new Date().toISOString()
    };

    this.saveAllProgress(allProgress);
  }

  // Supprimer les progressions d'une formation
  clearProgress(formationId: string, userId: string): void {
    const allProgress = this.getAllProgress();
    const filteredProgress = allProgress.filter(
      p => !(p.formationId === formationId && p.userId === userId)
    );
    this.saveAllProgress(filteredProgress);
  }

  // Récupérer l'utilisateur actuel (méthode utilitaire)
  getCurrentUserId(): string {
    try {
      // Essayer de récupérer depuis le localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        return userData.id || 'default-user-id';
      }

      // Fallback: utiliser un ID par défaut
      return 'default-user-id';
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      return 'default-user-id';
    }
  }
}

// Instance singleton
const progressService = new ProgressService();
export default progressService;
