import fs from "fs";
import path from "path";

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {},
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        responseTimes: [],
      },
      security: {
        blockedRequests: 0,
        suspiciousActivities: 0,
        failedLogins: 0,
        bannedIPs: [],
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        lastHealthCheck: new Date(),
      },
    };

    this.startTime = Date.now();
    this.logFile = path.join(process.cwd(), "logs", "monitoring.log");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Enregistrer une requête
  recordRequest(req, res, responseTime) {
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const status = res.statusCode;

    // Métriques générales
    this.metrics.requests.total++;

    if (status >= 200 && status < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Métriques par endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, errors: 0 };
    }
    this.metrics.requests.byEndpoint[endpoint].total++;
    if (status >= 400) {
      this.metrics.requests.byEndpoint[endpoint].errors++;
    }

    // Métriques par méthode
    if (!this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method] = 0;
    }
    this.metrics.requests.byMethod[method]++;

    // Métriques par statut
    if (!this.metrics.requests.byStatus[status]) {
      this.metrics.requests.byStatus[status] = 0;
    }
    this.metrics.requests.byStatus[status]++;

    // Métriques de performance
    this.updatePerformanceMetrics(responseTime);

    // Log détaillé pour les erreurs
    if (status >= 400) {
      this.logError(req, res, responseTime);
    }
  }

  // Mettre à jour les métriques de performance
  updatePerformanceMetrics(responseTime) {
    this.metrics.performance.responseTimes.push(responseTime);

    // Garder seulement les 1000 dernières mesures
    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes.shift();
    }

    // Calculer les statistiques
    const times = this.metrics.performance.responseTimes;
    this.metrics.performance.avgResponseTime =
      times.reduce((a, b) => a + b, 0) / times.length;
    this.metrics.performance.maxResponseTime = Math.max(...times);
    this.metrics.performance.minResponseTime = Math.min(...times);
  }

  // Enregistrer une activité de sécurité
  recordSecurityEvent(type, details) {
    switch (type) {
      case "blocked_request":
        this.metrics.security.blockedRequests++;
        break;
      case "suspicious_activity":
        this.metrics.security.suspiciousActivities++;
        break;
      case "failed_login":
        this.metrics.security.failedLogins++;
        break;
      case "banned_ip":
        if (!this.metrics.security.bannedIPs.includes(details.ip)) {
          this.metrics.security.bannedIPs.push(details.ip);
        }
        break;
    }

    this.logSecurityEvent(type, details);
  }

  // Logger une erreur
  logError(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: "ERROR",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id || null,
      error: res.error || "Unknown error",
    };

    this.writeLog(logEntry);
  }

  // Logger un événement de sécurité
  logSecurityEvent(type, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: "SECURITY",
      event: type,
      details,
      ip: details.ip || "unknown",
      userAgent: details.userAgent || "unknown",
    };

    this.writeLog(logEntry);
  }

  // Écrire dans le fichier de log
  writeLog(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + "\n";
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error("Erreur lors de l'écriture du log:", error);
    }
  }

  // Obtenir les métriques
  getMetrics() {
    // Mettre à jour les métriques système
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.cpuUsage = process.cpuUsage();
    this.metrics.system.lastHealthCheck = new Date();

    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
    };
  }

  // Obtenir les métriques de performance
  getPerformanceMetrics() {
    return {
      requests: this.metrics.requests,
      performance: this.metrics.performance,
      uptime: Date.now() - this.startTime,
    };
  }

  // Obtenir les métriques de sécurité
  getSecurityMetrics() {
    return {
      security: this.metrics.security,
      timestamp: new Date().toISOString(),
    };
  }

  // Obtenir les métriques système
  getSystemMetrics() {
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.cpuUsage = process.cpuUsage();

    return {
      system: this.metrics.system,
      timestamp: new Date().toISOString(),
    };
  }

  // Réinitialiser les métriques
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {},
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        responseTimes: [],
      },
      security: {
        blockedRequests: 0,
        suspiciousActivities: 0,
        failedLogins: 0,
        bannedIPs: [],
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        lastHealthCheck: new Date(),
      },
    };
    this.startTime = Date.now();
  }

  // Vérifier les seuils d'alerte
  checkAlerts() {
    const alerts = [];

    // Alerte sur le taux d'erreur élevé
    const errorRate =
      this.metrics.requests.errors / this.metrics.requests.total;
    if (errorRate > 0.1 && this.metrics.requests.total > 100) {
      alerts.push({
        type: "HIGH_ERROR_RATE",
        message: `Taux d'erreur élevé: ${(errorRate * 100).toFixed(2)}%`,
        severity: "WARNING",
      });
    }

    // Alerte sur le temps de réponse élevé
    if (this.metrics.performance.avgResponseTime > 5000) {
      alerts.push({
        type: "HIGH_RESPONSE_TIME",
        message: `Temps de réponse moyen élevé: ${this.metrics.performance.avgResponseTime}ms`,
        severity: "WARNING",
      });
    }

    // Alerte sur les activités suspectes
    if (this.metrics.security.suspiciousActivities > 10) {
      alerts.push({
        type: "SUSPICIOUS_ACTIVITY",
        message: `Activités suspectes détectées: ${this.metrics.security.suspiciousActivities}`,
        severity: "CRITICAL",
      });
    }

    // Alerte sur l'utilisation mémoire
    const memoryUsage = this.metrics.system.memoryUsage;
    const memoryUsagePercent =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      alerts.push({
        type: "HIGH_MEMORY_USAGE",
        message: `Utilisation mémoire élevée: ${memoryUsagePercent.toFixed(
          2
        )}%`,
        severity: "WARNING",
      });
    }

    return alerts;
  }

  // Obtenir les logs récents
  getRecentLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const logs = fs
        .readFileSync(this.logFile, "utf8")
        .split("\n")
        .filter((line) => line.trim())
        .slice(-limit)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((log) => log !== null);

      return logs;
    } catch (error) {
      console.error("Erreur lors de la lecture des logs:", error);
      return [];
    }
  }

  // Nettoyer les anciens logs
  cleanupLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      if (!fs.existsSync(this.logFile)) {
        return;
      }

      const logs = fs
        .readFileSync(this.logFile, "utf8")
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((log) => log !== null && new Date(log.timestamp) > cutoffDate);

      const cleanedLogs = logs.map((log) => JSON.stringify(log)).join("\n");
      fs.writeFileSync(this.logFile, cleanedLogs + "\n");

      console.log(`Logs nettoyés: ${logs.length} entrées conservées`);
    } catch (error) {
      console.error("Erreur lors du nettoyage des logs:", error);
    }
  }
}

// Instance singleton
const monitoringService = new MonitoringService();

export default monitoringService;
