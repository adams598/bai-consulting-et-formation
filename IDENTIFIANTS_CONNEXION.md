# 🔐 IDENTIFIANTS DE CONNEXION - ESPACE APPRENANT

## 🎓 COMPTES APPRENANTS DE TEST

### **URL de connexion :** 
`http://localhost:3001/apprenant/connexion`

### **Identifiants disponibles :**

#### 1. **Marie Martin** - Conseillère Clientèle
- **Email :** `marie.martin@banque-populaire.com`
- **Mot de passe :** `admin123`

#### 2. **Pierre Durand** - Chargé de Clientèle  
- **Email :** `pierre.durand@banque-populaire.com`
- **Mot de passe :** `admin123`

#### 3. **Sophie Bernard** - Responsable Commercial
- **Email :** `sophie.bernard@test.com` 
- **Mot de passe :** `learner123`

#### 4. **Thomas Petit** - Conseiller Bancaire
- **Email :** `thomas.petit@test.com`
- **Mot de passe :** `learner123`

## 🔧 POUR TESTER LA CONNEXION :

### **Étapes :**
1. **Aller sur :** `http://localhost:3001/apprenant/connexion`
2. **Utiliser un des emails ci-dessus**
3. **Mot de passe :** `admin123` ou `learner123`
4. **Cliquer sur "Se connecter"**

### **Après connexion :**
- ✅ Redirection vers `/apprenant/dashboard`
- ✅ Interface sans barre de navigation publique
- ✅ Navigation horizontale avec 7 onglets :
  - 🏠 Tableau de bord
  - 📚 Mes formations
  - 🎯 Opportunités
  - 📅 Mon agenda  
  - 📊 Progression
  - 🏆 Certificats
  - ⚙️ Paramètres

## 🐛 EN CAS D'ERREUR :

### **"Token invalide" :**
- Vérifier que le backend tourne sur le port 3000
- Vérifier que l'utilisateur existe dans la base
- Essayer de vider le cache : Ctrl+Shift+R

### **"HTTP 404" :**
- Certaines routes API ne sont pas encore implémentées côté backend
- C'est normal pour les notifications et stats (données mockées)

### **Erreur de connexion :**
- Vérifier l'email et le mot de passe
- Vérifier les logs du backend dans le terminal

## 📊 BACKEND LOGS VISIBLES :

D'après les logs, on voit que :
- ✅ Les appels API sont bien reçus
- ✅ La connexion fonctionne (`POST /api/learner/auth/login`)
- ✅ La vérification utilisateur fonctionne (`GET /api/learner/auth/me`)
- ⚠️ Certaines routes retournent 404 (normal, pas encore implémentées)

## 🎯 RECOMMANDATION :

**Utilise ces identifiants pour tester :**
- **Email :** `marie.martin@banque-populaire.com`
- **Mot de passe :** `admin123`

Cet utilisateur devrait déjà exister dans la base selon le README du backend.
