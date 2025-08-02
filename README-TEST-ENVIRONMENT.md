# Environnement de Test BAI Consulting

Ce guide vous explique comment mettre en place et utiliser l'environnement de test pour le projet BAI Consulting avant le déploiement sur Hostinger.

## 🚀 Démarrage Rapide

### Prérequis

- Docker Desktop installé et démarré
- Docker Compose installé
- PowerShell (Windows) ou Bash (Linux/Mac)

### Démarrage de l'environnement de test

**Windows (PowerShell):**
```powershell
.\scripts\test-environment.ps1 start
```

**Linux/Mac (Bash):**
```bash
./scripts/test-environment.sh start
```

## 📋 Services Disponibles

Une fois l'environnement démarré, les services suivants sont disponibles :

| Service | URL | Port | Description |
|---------|-----|------|-------------|
| Frontend | http://localhost:3003 | 3003 | Application React avec hot reload |
| Backend | http://localhost:3002 | 3002 | API Express.js |
| Nginx | http://localhost:8080 | 8080 | Serveur web avec proxy |
| PostgreSQL | localhost:5433 | 5433 | Base de données de test |

## 🛠️ Commandes Disponibles

### Script PowerShell (Windows)

```powershell
# Démarrer l'environnement
.\scripts\test-environment.ps1 start

# Arrêter l'environnement
.\scripts\test-environment.ps1 stop

# Redémarrer l'environnement
.\scripts\test-environment.ps1 restart

# Vérifier le statut
.\scripts\test-environment.ps1 status

# Afficher les logs
.\scripts\test-environment.ps1 logs

# Nettoyer complètement (supprime tout)
.\scripts\test-environment.ps1 clean
```

### Script Bash (Linux/Mac)

```bash
# Démarrer l'environnement
./scripts/test-environment.sh start

# Arrêter l'environnement
./scripts/test-environment.sh stop

# Redémarrer l'environnement
./scripts/test-environment.sh restart

# Vérifier le statut
./scripts/test-environment.sh status

# Afficher les logs
./scripts/test-environment.sh logs

# Nettoyer complètement (supprime tout)
./scripts/test-environment.sh clean
```

## 🔧 Configuration

### Variables d'Environnement de Test

L'environnement de test utilise des configurations spécifiques définies dans `backend/env.test` :

- **Base de données** : PostgreSQL avec des données de test
- **JWT** : Clés de test (non sécurisées pour la production)
- **CORS** : Configuration pour localhost
- **Rate Limiting** : Limites plus élevées pour les tests

### Différences avec la Production

| Aspect | Test | Production |
|--------|------|------------|
| Base de données | PostgreSQL locale | Hostinger PostgreSQL |
| Ports | 3002, 3003, 8080 | 80, 443 |
| JWT Secret | Test uniquement | Sécurisé |
| CORS | localhost | Domaine de production |
| Hot Reload | Activé | Désactivé |

## 🧪 Tests et Validation

### Tests de Connectivité

1. **Frontend** : Ouvrez http://localhost:3003
2. **Backend** : Testez http://localhost:3002/api/health
3. **Nginx** : Vérifiez http://localhost:8080

### Tests de Base de Données

```bash
# Se connecter à PostgreSQL
docker exec -it bai-postgres-test psql -U test_user -d bai_consulting_test

# Lister les tables
\dt

# Quitter
\q
```

### Tests d'API

```bash
# Test de santé de l'API
curl http://localhost:3002/api/health

# Test avec authentification
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🔍 Dépannage

### Problèmes Courants

#### 1. Ports déjà utilisés
```bash
# Vérifier les ports utilisés
netstat -an | findstr :3002
netstat -an | findstr :3003
netstat -an | findstr :8080

# Arrêter les services qui utilisent ces ports
```

#### 2. Docker ne démarre pas
```bash
# Vérifier que Docker Desktop est démarré
docker --version

# Redémarrer Docker Desktop si nécessaire
```

#### 3. Erreurs de base de données
```bash
# Redémarrer uniquement la base de données
docker-compose -f docker-compose.test.yml restart postgres-test

# Vérifier les logs
docker-compose -f docker-compose.test.yml logs postgres-test
```

#### 4. Problèmes de build
```bash
# Reconstruire les images
docker-compose -f docker-compose.test.yml build --no-cache

# Redémarrer l'environnement
.\scripts\test-environment.ps1 restart
```

### Logs Détaillés

```bash
# Logs de tous les services
docker-compose -f docker-compose.test.yml logs

# Logs d'un service spécifique
docker-compose -f docker-compose.test.yml logs backend-test
docker-compose -f docker-compose.test.yml logs frontend-test
docker-compose -f docker-compose.test.yml logs postgres-test
```

## 📊 Monitoring

### Ressources Système

```bash
# Utilisation des conteneurs
docker stats

# Espace disque
docker system df
```

### Performance

- **Frontend** : Hot reload activé pour le développement
- **Backend** : Mode développement avec rechargement automatique
- **Base de données** : Données persistantes dans un volume Docker

## 🔄 Workflow de Développement

1. **Démarrer l'environnement de test**
   ```bash
   .\scripts\test-environment.ps1 start
   ```

2. **Développer et tester**
   - Modifications automatiquement rechargées
   - Tests sur http://localhost:3003

3. **Valider les changements**
   - Tests fonctionnels
   - Tests d'intégration
   - Tests de performance

4. **Préparer pour la production**
   - Vérifier les variables d'environnement
   - Tester le build de production
   - Valider la configuration

5. **Arrêter l'environnement**
   ```bash
   .\scripts\test-environment.ps1 stop
   ```

## 🚀 Déploiement sur Hostinger

Une fois les tests validés dans l'environnement de test :

1. **Arrêter l'environnement de test**
   ```bash
   .\scripts\test-environment.ps1 stop
   ```

2. **Utiliser les scripts de déploiement existants**
   ```bash
   .\frontend\scripts\deploy-hostinger.bat
   ```

3. **Vérifier le déploiement**
   - Tests sur le site de production
   - Validation des fonctionnalités
   - Monitoring des performances

## 📝 Notes Importantes

- **Données de test** : L'environnement de test utilise une base de données séparée
- **Sécurité** : Les clés de test ne doivent jamais être utilisées en production
- **Performance** : L'environnement de test est optimisé pour le développement
- **Persistance** : Les données de test sont conservées entre les redémarrages

## 🆘 Support

En cas de problème :

1. Consultez les logs : `.\scripts\test-environment.ps1 logs`
2. Vérifiez le statut : `.\scripts\test-environment.ps1 status`
3. Redémarrez : `.\scripts\test-environment.ps1 restart`
4. Nettoyez et recommencez : `.\scripts\test-environment.ps1 clean` 