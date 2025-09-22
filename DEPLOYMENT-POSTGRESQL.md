# 🐘 Guide de Déploiement PostgreSQL - BAI Consulting

## 📋 Prérequis

### **Système**
- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 15+ (ou Docker)
- Redis 7+ (ou Docker)

### **Sécurité**
- Firewall configuré
- Certificats SSL valides
- Secrets sécurisés générés

## 🚀 Déploiement Étape par Étape

### **1. Préparation de l'environnement**

```bash
# Cloner le repository
git clone <votre-repo>
cd bai-consulting

# Générer les secrets sécurisés
node scripts/generate-secrets.js

# Copier les secrets dans .env
cp .env.example .env
# Éditer .env avec vos secrets réels
```

### **2. Configuration PostgreSQL**

```bash
# Démarrer PostgreSQL avec Docker
docker-compose -f docker-compose.postgresql.yml up -d postgres

# Attendre que PostgreSQL soit prêt
docker-compose -f docker-compose.postgresql.yml logs -f postgres

# Vérifier la connexion
docker exec bai-postgres-prod pg_isready -U bai_user -d bai_consulting
```

### **3. Migration des données (si migration depuis SQLite)**

```bash
# Sauvegarder les données SQLite existantes
cp backend/prisma/dev.db backend/prisma/dev.db.backup

# Exécuter la migration
node scripts/migrate-to-postgresql.js
```

### **4. Configuration Prisma pour PostgreSQL**

```bash
# Mettre à jour le schéma Prisma
# (déjà fait dans le fichier schema.prisma)

# Générer le client Prisma
cd backend
DATABASE_URL="postgresql://bai_user:bai_password@localhost:5432/bai_consulting" npx prisma generate

# Appliquer les migrations
DATABASE_URL="postgresql://bai_user:bai_password@localhost:5432/bai_consulting" npx prisma db push
```

### **5. Déploiement complet**

```bash
# Démarrer tous les services
docker-compose -f docker-compose.postgresql.yml up -d

# Vérifier le statut
docker-compose -f docker-compose.postgresql.yml ps

# Vérifier les logs
docker-compose -f docker-compose.postgresql.yml logs -f
```

### **6. Tests de validation**

```bash
# Test de santé
curl http://localhost:3001/api/admin/auth/health

# Test de la base de données
docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -c "SELECT COUNT(*) FROM \"User\";"

# Test Redis
docker exec bai-redis-prod redis-cli ping
```

## 🔧 Configuration Avancée

### **Optimisations PostgreSQL**

```sql
-- Connexion à PostgreSQL
docker exec -it bai-postgres-prod psql -U bai_user -d bai_consulting

-- Optimisations de performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();

-- Création d'index pour les performances
CREATE INDEX CONCURRENTLY idx_user_email ON "User"(email);
CREATE INDEX CONCURRENTLY idx_formation_active ON "Formation"(isActive);
CREATE INDEX CONCURRENTLY idx_user_progress_user_id ON "UserProgress"("userId");
```

### **Sauvegarde automatique**

```bash
# Script de sauvegarde quotidienne
cat > /usr/local/bin/backup-postgresql.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Sauvegarde PostgreSQL
docker exec bai-postgres-prod pg_dump -U bai_user bai_consulting > $BACKUP_DIR/postgres_$DATE.sql

# Compression
gzip $BACKUP_DIR/postgres_$DATE.sql

# Nettoyage (30 jours)
find $BACKUP_DIR -name "postgres_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde PostgreSQL terminée: postgres_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/backup-postgresql.sh

# Cron job quotidien
echo "0 2 * * * /usr/local/bin/backup-postgresql.sh" | crontab -
```

### **Monitoring PostgreSQL**

```bash
# Installation d'outils de monitoring
docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -c "
-- Statistiques des connexions
SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';

-- Taille de la base de données
SELECT pg_size_pretty(pg_database_size('bai_consulting')) as database_size;

-- Tables les plus volumineuses
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;
"
```

## 🔒 Sécurité PostgreSQL

### **Configuration sécurisée**

```sql
-- Connexion sécurisée
docker exec -it bai-postgres-prod psql -U bai_user -d bai_consulting

-- Création d'un utilisateur en lecture seule
CREATE USER bai_readonly WITH PASSWORD 'mot_de_passe_readonly';
GRANT CONNECT ON DATABASE bai_consulting TO bai_readonly;
GRANT USAGE ON SCHEMA public TO bai_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bai_readonly;

-- Configuration SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/var/lib/postgresql/server.crt';
ALTER SYSTEM SET ssl_key_file = '/var/lib/postgresql/server.key';
SELECT pg_reload_conf();
```

### **Audit et logging**

```sql
-- Activation du logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log des requêtes > 1s
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
SELECT pg_reload_conf();
```

## 📊 Monitoring et Alertes

### **Métriques importantes**

- **Connexions actives** : < 80% du max_connections
- **Utilisation CPU** : < 80%
- **Utilisation mémoire** : < 90%
- **Espace disque** : < 85%
- **Temps de réponse** : < 100ms (95e percentile)

### **Alertes automatiques**

```bash
# Script de monitoring
cat > /usr/local/bin/monitor-postgresql.sh << 'EOF'
#!/bin/bash

# Vérification des connexions
CONNECTIONS=$(docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -t -c "SELECT count(*) FROM pg_stat_activity;")
MAX_CONNECTIONS=$(docker exec bai-postgres-prod psql -U bai_user -d bai_consulting -t -c "SHOW max_connections;")

if [ $CONNECTIONS -gt $((MAX_CONNECTIONS * 80 / 100)) ]; then
    echo "ALERTE: Trop de connexions PostgreSQL ($CONNECTIONS/$MAX_CONNECTIONS)"
fi

# Vérification de l'espace disque
DISK_USAGE=$(df /var/lib/docker/volumes/bai-consulting_postgres_data/_data | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "ALERTE: Espace disque PostgreSQL critique ($DISK_USAGE%)"
fi
EOF

chmod +x /usr/local/bin/monitor-postgresql.sh
```

## 🚨 Procédures d'Urgence

### **En cas de problème**

```bash
# Redémarrage des services
docker-compose -f docker-compose.postgresql.yml restart

# Redémarrage complet
docker-compose -f docker-compose.postgresql.yml down
docker-compose -f docker-compose.postgresql.yml up -d

# Restauration depuis sauvegarde
docker exec bai-postgres-prod psql -U bai_user -d bai_consulting < /backups/postgres_YYYYMMDD_HHMMSS.sql
```

### **Contacts d'urgence**

- **Administrateur système** : admin@votre-domaine.com
- **Support technique** : support@votre-domaine.com
- **Sécurité** : security@votre-domaine.com

## 📈 Optimisations Performance

### **Configuration recommandée**

```yaml
# docker-compose.postgresql.yml - Optimisations
services:
  postgres:
    environment:
      # Optimisations mémoire
      POSTGRES_SHARED_BUFFERS: "256MB"
      POSTGRES_EFFECTIVE_CACHE_SIZE: "1GB"
      POSTGRES_MAINTENANCE_WORK_MEM: "64MB"
      
      # Optimisations I/O
      POSTGRES_CHECKPOINT_COMPLETION_TARGET: "0.9"
      POSTGRES_WAL_BUFFERS: "16MB"
      
      # Optimisations requêtes
      POSTGRES_DEFAULT_STATISTICS_TARGET: "100"
```

## ✅ Checklist de Déploiement

- [ ] PostgreSQL démarré et accessible
- [ ] Base de données créée avec le bon schéma
- [ ] Données migrées (si applicable)
- [ ] Redis connecté et fonctionnel
- [ ] Backend connecté à PostgreSQL
- [ ] Frontend accessible
- [ ] Health checks passent
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring en place
- [ ] Alertes configurées
- [ ] Tests de sécurité effectués
- [ ] Documentation mise à jour

## 📞 Support

Pour toute question ou problème :
- **Documentation** : [docs.votre-domaine.com](https://docs.votre-domaine.com)
- **Support** : support@votre-domaine.com
- **Urgences** : +33 1 23 45 67 89



