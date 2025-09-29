import monitoringService from "../services/monitoring.service.js";

/**
 * Middleware de monitoring pour enregistrer les métriques
 */
export const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Intercepter la réponse pour calculer le temps de réponse
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - startTime;

    // Enregistrer les métriques
    monitoringService.recordRequest(req, res, responseTime);

    // Appeler la méthode originale
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware pour enregistrer les événements de sécurité
 */
export const securityMonitoringMiddleware = (req, res, next) => {
  // Intercepter les erreurs de sécurité
  const originalJson = res.json;
  res.json = function (data) {
    // Enregistrer les tentatives d'accès non autorisées
    if (res.statusCode === 401 || res.statusCode === 403) {
      monitoringService.recordSecurityEvent("blocked_request", {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        url: req.url,
        method: req.method,
        status: res.statusCode,
        userId: req.user?.id || null,
      });
    }

    // Enregistrer les erreurs serveur
    if (res.statusCode >= 500) {
      monitoringService.recordSecurityEvent("suspicious_activity", {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        url: req.url,
        method: req.method,
        status: res.statusCode,
        error: data?.message || "Unknown error",
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware pour enregistrer les tentatives de connexion échouées
 */
export const loginMonitoringMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Enregistrer les échecs de connexion
    if (req.path.includes("/login") && res.statusCode === 401) {
      monitoringService.recordSecurityEvent("failed_login", {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        email: req.body?.email || "unknown",
        timestamp: new Date().toISOString(),
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware pour obtenir les métriques (endpoint admin)
 */
export const getMetricsMiddleware = async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    const alerts = monitoringService.checkAlerts();

    res.json({
      success: true,
      data: {
        metrics,
        alerts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des métriques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des métriques",
    });
  }
};

/**
 * Middleware pour obtenir les logs récents (endpoint admin)
 */
export const getLogsMiddleware = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = monitoringService.getRecentLogs(limit);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des logs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des logs",
    });
  }
};

/**
 * Middleware pour réinitialiser les métriques (endpoint admin)
 */
export const resetMetricsMiddleware = async (req, res) => {
  try {
    monitoringService.resetMetrics();

    res.json({
      success: true,
      message: "Métriques réinitialisées avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des métriques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation des métriques",
    });
  }
};

/**
 * Middleware pour nettoyer les logs (endpoint admin)
 */
export const cleanupLogsMiddleware = async (req, res) => {
  try {
    const daysToKeep = parseInt(req.body.daysToKeep) || 30;
    monitoringService.cleanupLogs(daysToKeep);

    res.json({
      success: true,
      message: `Logs nettoyés (conservés: ${daysToKeep} jours)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors du nettoyage des logs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du nettoyage des logs",
    });
  }
};





