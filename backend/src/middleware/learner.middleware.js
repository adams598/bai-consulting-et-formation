import { UserRole } from "../types/index.js";

export const learnerMiddleware = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Vérifier que l'utilisateur est un collaborateur ou un admin
    const allowedRoles = [
      UserRole.COLLABORATOR,
      UserRole.SUPER_ADMIN,
      UserRole.BANK_ADMIN,
    ];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux collaborateurs et administrateurs",
      });
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur dans learnerMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
