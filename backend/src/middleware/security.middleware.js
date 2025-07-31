// Middleware de logging de sécurité
export const securityLogger = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent") || "Unknown";
  const method = req.method;
  const url = req.url;
  const timestamp = new Date().toISOString();

  // Détecter les patterns suspects
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  const requestBody = JSON.stringify(req.body || {});
  const requestHeaders = JSON.stringify(req.headers);

  let isSuspicious = false;
  let suspiciousPattern = "";

  // Vérifier le body et les headers
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestHeaders)) {
      isSuspicious = true;
      suspiciousPattern = pattern.source;
      break;
    }
  }

  // Logger les activités suspectes
  if (isSuspicious) {
    console.warn(`🚨 ACTIVITÉ SUSPECTE DÉTECTÉE:
    Timestamp: ${timestamp}
    IP: ${clientIP}
    User-Agent: ${userAgent}
    Method: ${method}
    URL: ${url}
    Pattern suspect: ${suspiciousPattern}
    Body: ${requestBody.substring(0, 500)}
    Headers: ${requestHeaders.substring(0, 500)}
    `);
  }

  // Logger toutes les requêtes en mode debug
  if (process.env.NODE_ENV === "development") {
    console.log(`📝 ${timestamp} - ${method} ${url} - IP: ${clientIP}`);
  }

  next();
};

// Middleware pour bloquer les requêtes suspectes
export const blockSuspiciousRequests = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Liste d'IPs bannies (à configurer selon vos besoins)
  const bannedIPs = process.env.BANNED_IPS
    ? process.env.BANNED_IPS.split(",")
    : [];

  if (bannedIPs.includes(clientIP)) {
    console.warn(`🚫 Requête bloquée depuis l'IP bannie: ${clientIP}`);
    return res.status(403).json({
      error: "Accès interdit",
    });
  }

  // Vérifier les headers suspects
  const suspiciousHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-forwarded-proto",
  ];

  const hasSuspiciousHeaders = suspiciousHeaders.some(
    (header) => req.headers[header] && req.headers[header].includes("<script")
  );

  if (hasSuspiciousHeaders) {
    console.warn(`🚨 Headers suspects détectés depuis ${clientIP}`);
    return res.status(400).json({
      error: "Requête invalide",
    });
  }

  next();
};

// Middleware pour ajouter des headers de sécurité
export const addSecurityHeaders = (req, res, next) => {
  // Headers de sécurité supplémentaires
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  next();
};
