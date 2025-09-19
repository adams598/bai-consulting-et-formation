// Contrôleur temporaire pour éviter les erreurs d'import
export const notificationsController = {
  getAllNotifications: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  getUserNotificationsById: async (req, res) => {
    res.json({ success: true, data: [] });
  },

  createNotification: async (req, res) => {
    res.json({ success: true, data: { id: "temp" } });
  },

  markAsRead: async (req, res) => {
    res.json({ success: true, data: { id: req.params.id } });
  },

  deleteNotification: async (req, res) => {
    res.json({ success: true, message: "Supprimé" });
  },

  markNotificationAsRead: async (req, res) => {
    res.json({ success: true, data: { id: req.params.id } });
  },
};
