# Suivi de Progression des Utilisateurs

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de suivre en détail la progression de chaque collaborateur dans leurs formations. Elle inclut un bouton "Suivre" dans la page de gestion des utilisateurs qui ouvre un modal détaillé avec toutes les informations de progression.

## Fonctionnalités implémentées

### 1. Bouton "Suivre" dans la page des utilisateurs
- **Localisation** : Page Admin > Collaborateurs
- **Affichage** : Bouton avec icône `TrendingUp` dans les colonnes d'actions
- **Disponible dans** : Vue liste et vue cartes
- **Couleur** : Bleu pour se distinguer des autres actions

### 2. Modal de suivi de progression (`UserProgressModal`)
Le modal affiche 4 onglets principaux :

#### 📊 Vue d'ensemble
- **Statistiques principales** :
  - Total des formations assignées
  - Formations terminées
  - Formations en cours
  - Score moyen des quiz
- **Activité récente** :
  - Dernière activité
  - Dernière formation vue avec date

#### 📚 Formations
- **Liste détaillée** de toutes les formations avec :
  - Statut (En attente, En cours, Terminée)
  - Barre de progression visuelle
  - Temps passé sur chaque formation
  - Dates de démarrage et de fin
  - Informations sur les quiz (réussi/raté, score)
  - Statut des certificats

#### 🏆 Quiz
- **Statistiques des quiz** :
  - Total des tentatives
  - Nombre de quiz réussis
  - Nombre de quiz ratés
  - Taux de réussite avec barre de progression

#### 📅 Planification
- **Formations planifiées** avec :
  - Date prévue
  - Statut (À venir, En retard)
  - Indication si obligatoire

## Architecture technique

### Backend

#### Contrôleur (`user-progress.controller.js`)
- **`getUserProgress`** : Récupère toutes les données de progression d'un utilisateur
- **`getUserProgressSummary`** : Récupère un résumé rapide des statistiques

#### Routes (`user-progress.routes.js`)
- **`GET /api/user-progress/user/:userId`** : Progression détaillée
- **`GET /api/user-progress/user/:userId/summary`** : Résumé rapide

#### Sécurité
- **Authentification requise** : Middleware `authMiddleware`
- **Autorisation** : Seuls les `SUPER_ADMIN` et `BANK_ADMIN` peuvent consulter les progressions
- **Validation** : Vérification de l'existence de l'utilisateur cible

### Frontend

#### API (`userProgressApi.ts`)
- **`getUserProgress`** : Appel API pour la progression détaillée
- **`getUserProgressSummary`** : Appel API pour le résumé

#### Composant (`UserProgressModal.tsx`)
- **Interface responsive** avec onglets
- **Gestion des états** : Loading, erreurs, données
- **Formatage des données** : Dates, durées, pourcentages
- **Design cohérent** avec le reste de l'application

## Données collectées

### Formations
- Progression par formation (0-100%)
- Temps passé (en minutes)
- Dates de démarrage et de fin
- Dernière activité

### Quiz
- Nombre total de tentatives
- Taux de réussite
- Score moyen
- Détail par formation

### Certificats
- Certificats obtenus
- Dates d'obtention
- Formations associées

### Planification
- Formations avec échéances
- Statut obligatoire/optionnel
- Dates prévues vs réelles

## Utilisation

1. **Accéder à la page** : Admin > Collaborateurs
2. **Cliquer sur le bouton "Suivre"** (icône bleue avec flèche vers le haut)
3. **Explorer les onglets** pour voir les différentes informations
4. **Fermer le modal** avec le bouton "Fermer" ou la croix

## Permissions

- **Accès** : Administrateurs uniquement (`SUPER_ADMIN`, `BANK_ADMIN`)
- **Données** : Tous les collaborateurs peuvent être suivis
- **Sécurité** : Chaque requête vérifie les permissions de l'utilisateur connecté

## Tests

Un script de test est disponible : `backend/test-user-progress-api.mjs`

```bash
cd backend
node test-user-progress-api.mjs
```

## Évolutions possibles

1. **Export des données** : PDF ou Excel des progressions
2. **Notifications** : Alertes pour les retards ou échéances
3. **Comparaisons** : Comparer les progressions entre utilisateurs
4. **Graphiques** : Visualisations avancées des données
5. **Filtres** : Filtrer par période, formation, etc.
