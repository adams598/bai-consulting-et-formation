export const adminMiddleware = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Vérifier si l'utilisateur a un rôle d'administration
    const adminRoles = ["SUPER_ADMIN", "BANK_ADMIN"];

    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès administrateur requis",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur de vérification admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur de vérification des permissions",
    });
  }
};

export const superAdminMiddleware = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Vérifier si l'utilisateur est super admin
    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Accès super administrateur requis",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur de vérification super admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur de vérification des permissions",
    });
  }
};

export const bankAdminMiddleware = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    // Vérifier si l'utilisateur est admin de banque
    if (user.role !== "BANK_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Accès administrateur de banque requis",
      });
    }

    // Vérifier que l'utilisateur a une banque associée
    if (!user.bankId) {
      return res.status(403).json({
        success: false,
        message: "Aucune banque associée",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur de vérification bank admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur de vérification des permissions",
    });
  }
};
