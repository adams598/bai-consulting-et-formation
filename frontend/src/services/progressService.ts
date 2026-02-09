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
    // console.log(`📊 progressService.getProgress - formationId: ${formationId}, userId: ${userId}`);
    
    const allProgress = this.getAllProgress();
    // console.log(`📊 progressService.getProgress - Toutes les progressions:`, allProgress);
    
    const formationProgress = allProgress.find(
      p => p.formationId === formationId && p.userId === userId
    );
    
    // console.log(`📊 progressService.getProgress - Progression trouvée:`, formationProgress);

    if (!formationProgress) {
      console.log(`📊 progressService.getProgress - Aucune progression trouvée, initialisation...`);
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
      console.log(`📊 progressService.getProgress - Progressions vides créées:`, emptyProgress);
      return emptyProgress;
    }

    console.log(`📊 progressService.getProgress - Progressions retournées:`, formationProgress.lessons);
    return formationProgress.lessons;
  }

  // Mettre à jour la progression d'une leçon
  updateProgress(
    formationId: string, 
    userId: string, 
    lessonId: string, 
    progress: Partial<Omit<LessonProgress, 'lessonId' | 'lastUpdated'>>
  ): void {
    console.log(`💾 progressService.updateProgress - formationId: ${formationId}, userId: ${userId}, lessonId: ${lessonId}`);
    console.log(`💾 progressService.updateProgress - Données à sauvegarder:`, progress);
    
    const allProgress = this.getAllProgress();
    console.log(`💾 progressService.updateProgress - Progressions existantes:`, allProgress);
    
    let formationProgress = allProgress.find(
      p => p.formationId === formationId && p.userId === userId
    );
    
    console.log(`💾 progressService.updateProgress - Progression formation trouvée:`, formationProgress);

    if (!formationProgress) {
      console.log(`💾 progressService.updateProgress - Création d'une nouvelle progression formation`);
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
      // console.log(`💾 progressService.updateProgress - Création d'une nouvelle progression leçon`);
      formationProgress.lessons[lessonId] = {
        lessonId,
        timeSpent: 0,
        progress: 0,
        completed: false,
        lastUpdated: new Date().toISOString()
      };
    }

    const oldProgress = formationProgress.lessons[lessonId];
    formationProgress.lessons[lessonId] = {
      ...formationProgress.lessons[lessonId],
      ...progress,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`💾 progressService.updateProgress - Ancienne progression:`, oldProgress);
    console.log(`💾 progressService.updateProgress - Nouvelle progression:`, formationProgress.lessons[lessonId]);

    this.saveAllProgress(allProgress);
    console.log(`💾 progressService.updateProgress - Sauvegarde terminée`);
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
      console.log('🔍 progressService.getCurrentUserId - Début de la récupération');
      
      // Essayer de récupérer depuis le localStorage
      const userInfo = localStorage.getItem('userInfo');
      console.log('🔍 progressService.getCurrentUserId - userInfo:', userInfo);
      
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        console.log('🔍 progressService.getCurrentUserId - userData parsé:', userData);
        const userId = userData.id || 'default-user-id';
        console.log('🔍 progressService.getCurrentUserId - userId final:', userId);
        return userId;
      }

      // Essayer de récupérer depuis le token JWT
      const accessToken = localStorage.getItem('accessToken');
      console.log('🔍 progressService.getCurrentUserId - accessToken:', accessToken ? 'présent' : 'absent');
      
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('🔍 progressService.getCurrentUserId - payload JWT:', payload);
          if (payload.userId || payload.sub) {
            const userId = payload.userId || payload.sub;
            console.log('🔍 progressService.getCurrentUserId - userId depuis JWT:', userId);
            return userId;
          }
        } catch (error) {
          console.error('🔍 progressService.getCurrentUserId - Erreur décodage JWT:', error);
        }
      }

      // Fallback: utiliser un ID par défaut
      console.log('🔍 progressService.getCurrentUserId - Utilisation de default-user-id');
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
