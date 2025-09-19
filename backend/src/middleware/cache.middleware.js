import cacheService from '../services/cache.service.js';

/**
 * Middleware de cache générique
 * @param {Object} options - Options de configuration du cache
 * @param {number} options.ttl - Durée de vie du cache en secondes (défaut: 300)
 * @param {Function} options.keyGenerator - Fonction pour générer la clé de cache
 * @param {Array} options.invalidateOn - Méthodes HTTP qui invalident le cache
 * @returns {Function} Middleware Express
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes par défaut
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    invalidateOn = ['POST', 'PUT', 'DELETE', 'PATCH']
  } = options;

  return async (req, res, next) => {
    // Ne pas mettre en cache les requêtes qui modifient les données
    if (invalidateOn.includes(req.method)) {
      return next();
    }

    // Générer la clé de cache
    const cacheKey = keyGenerator(req);

    try {
      // Vérifier le cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache hit pour: ${cacheKey}`);
        return res.json({
          ...cachedData,
          fromCache: true,
          cachedAt: new Date().toISOString()
        });
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(data) {
        // Mettre en cache la réponse
        cacheService.set(cacheKey, data, ttl).then(() => {
          console.log(`💾 Données mises en cache: ${cacheKey}`);
        }).catch(error => {
          console.error(`❌ Erreur mise en cache: ${error.message}`);
        });

        // Envoyer la réponse originale
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('❌ Erreur middleware cache:', error.message);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
};

/**
 * Middleware de cache spécialisé pour les formations
 */
export const formationsCacheMiddleware = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const { page, limit, search, universeId, isActive } = req.query;
    return `formations:${JSON.stringify({ page, limit, search, universeId, isActive })}`;
  }
});

/**
 * Middleware de cache spécialisé pour les utilisateurs
 */
export const usersCacheMiddleware = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => {
    const { page, limit, search, role, bankId } = req.query;
    return `users:${JSON.stringify({ page, limit, search, role, bankId })}`;
  }
});

/**
 * Middleware de cache spécialisé pour les banques
 */
export const banksCacheMiddleware = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => {
    const { page, limit, search, isActive } = req.query;
    return `banks:${JSON.stringify({ page, limit, search, isActive })}`;
  }
});

/**
 * Middleware d'invalidation du cache
 * @param {string} pattern - Pattern des clés à invalider
 */
export const invalidateCacheMiddleware = (pattern) => {
  return async (req, res, next) => {
    try {
      await cacheService.invalidate(pattern);
      console.log(`🗑️ Cache invalidé pour le pattern: ${pattern}`);
      next();
    } catch (error) {
      console.error('❌ Erreur invalidation cache:', error.message);
      next(); // Continuer même en cas d'erreur
    }
  };
};

/**
 * Middleware d'invalidation du cache des formations
 */
export const invalidateFormationsCacheMiddleware = invalidateCacheMiddleware('formations:*');

/**
 * Middleware d'invalidation du cache des utilisateurs
 */
export const invalidateUsersCacheMiddleware = invalidateCacheMiddleware('users:*');

/**
 * Middleware d'invalidation du cache des banques
 */
export const invalidateBanksCacheMiddleware = invalidateCacheMiddleware('banks:*');

/**
 * Middleware d'invalidation globale du cache
 */
export const invalidateAllCacheMiddleware = async (req, res, next) => {
  try {
    await cacheService.invalidate('*');
    console.log('🗑️ Cache global invalidé');
    next();
  } catch (error) {
    console.error('❌ Erreur invalidation cache global:', error.message);
    next();
  }
};

/**
 * Middleware pour obtenir le statut du cache
 */
export const cacheStatusMiddleware = async (req, res, next) => {
  try {
    const status = cacheService.getStatus();
    res.json({
      success: true,
      data: {
        cache: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut du cache',
      error: error.message
    });
  }
};

