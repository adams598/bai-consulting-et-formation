import Redis from "ioredis";

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.memoryCache = new Map(); // Cache en mémoire comme fallback
    this.init();
  }

  async init() {
    try {
      // Configuration Redis selon l'environnement
      const redisConfig = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      };

      this.redis = new Redis(redisConfig);

      // Gestion des événements Redis
      this.redis.on("connect", () => {
        console.log("✅ Redis connecté");
        this.isConnected = true;
      });

      this.redis.on("ready", () => {
        console.log("✅ Redis prêt");
        this.isConnected = true;
      });

      this.redis.on("error", (error) => {
        console.error("❌ Erreur Redis:", error.message);
        this.isConnected = false;
      });

      this.redis.on("close", () => {
        console.log("🔌 Connexion Redis fermée");
        this.isConnected = false;
      });

      // Test de connexion
      await this.testConnection();
    } catch (error) {
      console.error("❌ Impossible de se connecter à Redis:", error.message);
      this.isConnected = false;
    }
  }

  async testConnection() {
    try {
      if (this.redis) {
        const result = await this.redis.ping();
        this.isConnected = result === "PONG";
        if (this.isConnected) {
          console.log("✅ Redis test de connexion réussi");
        }
      }
    } catch (error) {
      console.error("❌ Test de connexion Redis échoué:", error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      // Utiliser le cache en mémoire comme fallback
      console.warn(
        "⚠️ Redis non connecté, utilisation du cache mémoire pour la clé:",
        key
      );
      return this.memoryCache.get(key) || null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du cache:",
        error.message
      );
      // Fallback vers le cache mémoire
      return this.memoryCache.get(key) || null;
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) {
      // Utiliser le cache en mémoire comme fallback
      console.warn(
        "⚠️ Redis non connecté, utilisation du cache mémoire pour:",
        key
      );
      this.memoryCache.set(key, value);
      // Nettoyer le cache mémoire après le TTL
      setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
      return true;
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la mise en cache:", error.message);
      // Fallback vers le cache mémoire
      this.memoryCache.set(key, value);
      setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
      return true;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      console.warn("⚠️ Redis non connecté, impossible de supprimer:", key);
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression du cache:",
        error.message
      );
      return false;
    }
  }

  async invalidate(pattern) {
    if (!this.isConnected) {
      console.warn(
        "⚠️ Redis non connecté, impossible d'invalider le pattern:",
        pattern
      );
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(
          `🗑️ ${keys.length} clés supprimées pour le pattern: ${pattern}`
        );
      }
      return true;
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'invalidation du cache:",
        error.message
      );
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la vérification d'existence:",
        error.message
      );
      return false;
    }
  }

  async getTTL(key) {
    if (!this.isConnected) {
      return -1;
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du TTL:", error.message);
      return -1;
    }
  }

  // Méthodes utilitaires pour les formations
  async cacheFormations(filters, formations, ttl = 300) {
    const key = `formations:${JSON.stringify(filters)}`;
    return await this.set(key, formations, ttl);
  }

  async getCachedFormations(filters) {
    const key = `formations:${JSON.stringify(filters)}`;
    return await this.get(key);
  }

  async invalidateFormationsCache() {
    return await this.invalidate("formations:*");
  }

  // Méthodes utilitaires pour les utilisateurs
  async cacheUser(userId, user, ttl = 600) {
    const key = `user:${userId}`;
    return await this.set(key, user, ttl);
  }

  async getCachedUser(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUserCache(userId) {
    const key = `user:${userId}`;
    return await this.del(key);
  }

  // Méthodes utilitaires pour les statistiques
  async cacheStats(key, stats, ttl = 180) {
    return await this.set(`stats:${key}`, stats, ttl);
  }

  async getCachedStats(key) {
    return await this.get(`stats:${key}`);
  }

  async invalidateStatsCache() {
    return await this.invalidate("stats:*");
  }

  // Fermer la connexion
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }

  // Obtenir le statut de la connexion
  getStatus() {
    return {
      connected: this.isConnected,
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    };
  }
}

// Instance singleton
const cacheService = new CacheService();

export default cacheService;
