import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier le cache utilisateur d'abord
    const cacheService = (await import("../services/cache.service.js")).default;
    let user = await cacheService.getCachedUser(decoded.userId);

    if (!user) {
      // Récupérer l'utilisateur avec Prisma
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          bankId: true,
          department: true,
          isActive: true,
          lastLogin: true,
          lastLoginAt: true,
          passwordExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        // Mettre en cache pour 10 minutes
        await cacheService.cacheUser(decoded.userId, user, 600);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
        code: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Compte désactivé",
        code: "ACCOUNT_DISABLED",
      });
    }

    // Vérifier la session et gérer l'inactivité (10 minutes)
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expirée",
        code: "SESSION_EXPIRED",
      });
    }

    // Vérifier l'inactivité (10 minutes = 600 secondes)
    const now = new Date();
    const lastActivity = session.lastActivity || session.createdAt;
    const inactivityTimeout = 10 * 60 * 1000; // 10 minutes en millisecondes

    if (now.getTime() - lastActivity.getTime() > inactivityTimeout) {
      // Session expirée due à l'inactivité, supprimer la session
      await prisma.userSession.delete({
        where: { id: session.id },
      });

      return res.status(401).json({
        success: false,
        message: "Session expirée due à l'inactivité",
        code: "SESSION_INACTIVE",
      });
    }

    // Mettre à jour l'activité de la session et prolonger l'expiration
    const newExpiresAt = new Date(now.getTime() + inactivityTimeout);
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        lastActivity: now,
        expiresAt: newExpiresAt,
      },
    });

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Token pas encore valide",
        code: "TOKEN_NOT_ACTIVE",
      });
    }

    console.error("Erreur d'authentification:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
      code: "AUTH_ERROR",
    });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continuer sans utilisateur
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        bankId: true,
        department: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    next();
  }
};
