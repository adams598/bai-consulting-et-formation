// Contrôleur temporaire pour éviter les erreurs d'import
export const progressController = {
  getUserProgress: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  getUserAllProgress: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  saveProgress: async (req, res) => {
    res.json({ success: true, data: { id: "temp" } });
  },

  getProgress: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  updateProgress: async (req, res) => {
    res.json({ success: true, data: { id: req.params.id } });
  },

  getStats: async (req, res) => {
    res.json({
      success: true,
      data: {
        totalFormations: 0,
        completedFormations: 0,
        inProgressFormations: 0,
        upcomingFormations: 0,
        totalTimeSpent: 0,
        averageProgress: 0,
        certificatesEarned: 0,
        quizzesPassed: 0,
      },
    });
  },

  // Méthodes supplémentaires pour admin.routes.js
  getFormationProgress: async (req, res) => {
    res.json({ success: true, data: { progress: 0, completed: false } });
  },

  markLessonCompleted: async (req, res) => {
    res.json({ success: true, data: { completed: true } });
  },

  getUserProgressByFormation: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  getDetailedProgress: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  resetProgress: async (req, res) => {
    res.json({ success: true, message: "Progress reset" });
  },

  getProgressStats: async (req, res) => {
    res.json({ success: true, data: { total: 0, completed: 0 } });
  },

  bulkUpdateProgress: async (req, res) => {
    res.json({ success: true, data: { updated: 0 } });
  },
};
