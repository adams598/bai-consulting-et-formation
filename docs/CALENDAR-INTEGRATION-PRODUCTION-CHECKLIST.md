# ✅ Checklist - Intégration Calendrier (Préproduction)

## Phase 1: Préparation (1-2 jours)

### Configuration Google Cloud
- [ ] Compte Google créé
- [ ] Google Cloud Console accessible
- [ ] Projet "BAI Consulting" créé
- [ ] Google Calendar API activée
- [ ] OAuth consent screen configuré
- [ ] OAuth 2.0 credentials créées
- [ ] CLIENT_ID copié
- [ ] CLIENT_SECRET copié
- [ ] Redirect URI enregistrée (localhost + production)

### Configuration Azure/Microsoft
- [ ] Compte Microsoft créé
- [ ] Azure Portal accessible
- [ ] Application enregistrée
- [ ] Permissions Microsoft Graph ajoutées:
  - [ ] Calendars.ReadWrite
  - [ ] User.Read
- [ ] Client secret créé et copié
- [ ] Redirect URI enregistrée (localhost + production)
- [ ] APPLICATION_ID copié

### Configuration Backend
- [ ] backend/.env copié de .env.example
- [ ] GOOGLE_CLIENT_ID ajouté
- [ ] GOOGLE_CLIENT_SECRET ajouté
- [ ] OUTLOOK_CLIENT_ID ajouté
- [ ] OUTLOOK_CLIENT_SECRET ajouté
- [ ] FRONTEND_URL configurée
- [ ] DATABASE_URL configurée
- [ ] JWT_SECRET configuré

### Dépendances
- [ ] `npm install` exécuté (backend)
- [ ] `npm install` exécuté (frontend)
- [ ] Aucune dépendance manquante

---

## Phase 2: Tests locaux (1 jour)

### Frontend
- [ ] App démarre sans erreur: `npm run dev`
- [ ] Page calendrier accessible
- [ ] Aucune erreur console

### Tests Google
- [ ] Bouton "Connecter Google" visible
- [ ] Clic ouvre popup OAuth
- [ ] Authentification réussit
- [ ] Popup se ferme
- [ ] Statut "Connecté" s'affiche
- [ ] Email affiche correctement
- [ ] Bouton "Synchroniser" visible
- [ ] Synchronisation fonctionne
- [ ] Message de succès affiche
- [ ] Événements importés correctement

### Tests Outlook
- [ ] Bouton "Connecter Outlook" visible
- [ ] Clic ouvre popup OAuth
- [ ] Authentification réussit
- [ ] Popup se ferme
- [ ] Statut "Connecté" s'affiche
- [ ] Email affiche correctement
- [ ] Bouton "Synchroniser" visible
- [ ] Synchronisation fonctionne
- [ ] Message de succès affiche
- [ ] Événements importés correctement

### Déconnexion
- [ ] Bouton "Déconnecter" visible quand connecté
- [ ] Modal de confirmation s'affiche
- [ ] Annulation ferme le modal
- [ ] Confirmation déconnecte
- [ ] Statut passe à "Non connecté"
- [ ] Événements conservés localement

### Erreurs & Edge Cases
- [ ] Refuser les permissions → message d'erreur
- [ ] Fermer popup auth → récupération gracieuse
- [ ] Timeout auth → gestion d'erreur
- [ ] Token expiré → refresh automatique
- [ ] Pas de connexion internet → erreur claire

### Sécurité
- [ ] Tokens non visibles dans logs
- [ ] JWT requis pour endpoints
- [ ] CORS fonctionne correctement
- [ ] Validation des inputs

---

## Phase 3: Tests de performance (4 heures)

### Synchronisation
- [ ] 10 événements: < 2s
- [ ] 50 événements: < 5s
- [ ] 100 événements: < 10s
- [ ] Descriptions longues (> 1000 chars): OK
- [ ] Récurrence (RRULE): OK
- [ ] Attendees multiples: OK

### Pagination
- [ ] Import avec maxResults=50: OK
- [ ] NextToken handling: OK
- [ ] Pas de timeout sur gros volumes

### Cache
- [ ] Intégrations cachées: OK
- [ ] Refresh cache après sync: OK
- [ ] TTL respecté: OK

---

## Phase 4: Tests de sécurité (4 heures)

### OAuth
- [ ] State parameter validé
- [ ] Code échangé correctement
- [ ] CSRF protection: OK
- [ ] Tokens non exposés en URL

### Authentification
- [ ] JWT validation: OK
- [ ] Token expiré rejeté: OK
- [ ] Refresh token sécurisé: OK
- [ ] Logout supprime token: OK

### Autorisation
- [ ] User ne voit que ses propres intégrations
- [ ] User ne voit que ses événements
- [ ] Admin peut voir tous les logs: OK

### Validation
- [ ] Email invalides rejetées
- [ ] Dates invalides rejetées
- [ ] RRULE invalides rejetées
- [ ] Emails malveillants filtrés

### Encryption
- [ ] Tokens en BDD cryptés
- [ ] Passwords JAMAIS en logs
- [ ] Secrets pas en GitHub
- [ ] HTTPS forcé en prod

---

## Phase 5: Préparation production (2 jours)

### Infrastructure
- [ ] Domaine production défini
- [ ] Certificat SSL obtenu
- [ ] HTTPS activé
- [ ] CDN configuré (optionnel)
- [ ] DB backups en place
- [ ] Monitoring activé

### Configuration
- [ ] .env production configuré
- [ ] Secrets manager en place (AWS/Vault)
- [ ] Variables d'env sensibles sécurisées
- [ ] Logs centralisés
- [ ] Error tracking (Sentry/etc)

### URLs de redirection
- [ ] Google Cloud Console: https://domain.com/learner/calendar
- [ ] Azure Portal: https://domain.com/learner/calendar
- [ ] Attendez 5-10 minutes que les changements se propagent

### Build
- [ ] Frontend build: `npm run build` ✅
- [ ] Aucune erreur TypeScript
- [ ] Aucune dépendance manquante
- [ ] Bundle size acceptable

### Tests en staging
- [ ] Frontend déployé sur staging
- [ ] Backend déployé sur staging
- [ ] Tous les tests passent
- [ ] Pas de warnings critiques
- [ ] Performance acceptable

---

## Phase 6: Déploiement (1 jour)

### Avant déploiement
- [ ] Backup BDD complète
- [ ] Notification à l'équipe
- [ ] Plan de rollback préparé
- [ ] Monitoring en place

### Déploiement backend
- [ ] Code pushé sur branche `main`
- [ ] CI/CD pipeline réussi
- [ ] Backend déployé
- [ ] Migrations Prisma exécutées
- [ ] Health check: OK
- [ ] Logs sans erreurs

### Déploiement frontend
- [ ] Code pushé sur branche `main`
- [ ] CI/CD pipeline réussi
- [ ] Frontend déployé
- [ ] Assets chargent correctement
- [ ] Aucune erreur console
- [ ] Lighthouse > 80

### Vérifications post-déploiement
- [ ] Page calendrier accessible
- [ ] Google OAuth fonctionne
- [ ] Outlook OAuth fonctionne
- [ ] Synchronisation fonctionne
- [ ] Pas d'erreurs en logs
- [ ] Performance acceptable
- [ ] Users peuvent se connecter

---

## Phase 7: Monitoring (Continu)

### Métriques
- [ ] Taux de connexion OAuth
- [ ] Taux de synchronisation réussi
- [ ] Temps moyen de sync
- [ ] Erreurs par jour
- [ ] Users actifs

### Alertes
- [ ] OAuth failure rate > 5%
- [ ] Sync failure rate > 10%
- [ ] Sync time > 30s
- [ ] Error rate > 1%
- [ ] Uptime < 99%

### Logs
- [ ] Tous les OAuth events loggés
- [ ] Tous les sync events loggés
- [ ] Erreurs loggées avec context
- [ ] Performance metrics tracés
- [ ] Aucun secret exposé

---

## Phase 8: Documentation utilisateur

- [ ] Guide utilisateur écrit
- [ ] Screenshots ajoutées
- [ ] FAQ rédigée
- [ ] Vidéo tutoriel (optionnel)
- [ ] Mises à jour FAQ basées sur feedback

---

## 🚨 Rollback Plan

Si problème critique détecté:

1. **Immédiat**: Arrêter tous les déploiements
2. **5 min**: Notifier l'équipe sur Slack
3. **10 min**: Analyser les logs
4. **15 min**: Décider rollback ou fix
5. **30 min**: Restaurer version précédente si nécessaire
6. **1h**: Post-mortem et correction

---

## ✅ Points clés à retenir

### Avant de commencer
- ✅ Credentials Google et Outlook créés
- ✅ Variables d'env configurées
- ✅ Tests locaux réussis
- ✅ Aucun secret en GitHub

### Configuration production
- ✅ HTTPS activé
- ✅ Secrets manager utilisé
- ✅ URLs de redirection mises à jour
- ✅ Logs centralisés
- ✅ Monitoring en place

### Post-déploiement
- ✅ Monitorer les erreurs
- ✅ Vérifier les metrics
- ✅ Collecter le feedback
- ✅ Mettre à jour la doc
- ✅ Plan de rollback prêt

---

## 📞 Contacts d'urgence

- **Lead technique**: [Nom] - [Email]
- **DevOps**: [Nom] - [Email]
- **Support**: support@bai-consulting.com
- **Slack**: #incidents

---

## 📝 Notes

```
Date planifiée: [À remplir]
Status: [ ] Non commencé  [ ] En cours  [ ] Complété
Responsable: [À remplir]
Approbation: [ ] Approuvé  [ ] En attente  [ ] Rejeté
```

---

**Créé le:** 10 février 2026
**Dernière mise à jour:** 10 février 2026
**Version:** 1.0

