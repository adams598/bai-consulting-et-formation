# 🔒 PERMISSIONS COLLABORATOR - FORMATIONS

## ✅ **RESTRICTIONS APPLIQUÉES !**

### 🎯 **PRINCIPE :**
Les apprenants (COLLABORATOR) utilisent la même interface qu'`AdminFormationsPage` mais avec des **permissions restreintes**.

### 🔧 **MODIFICATIONS APPLIQUÉES :**

#### **1. Masquage des boutons de création :**
```typescript
// AVANT : Bouton visible pour tous
<button onClick={handleCreateFormation}>
  Nouvelle Formation
</button>

// APRÈS : Visible uniquement pour les admins
{viewMode === 'formations' && isAdmin() && (
  <button onClick={handleCreateFormation}>
    Nouvelle Formation
  </button>
)}
```

#### **2. Masquage des actions en lot :**
```typescript
// AVANT : Actions en lot visibles pour tous
{showBulkActions && (
  <div>Actions en lot...</div>
)}

// APRÈS : Visible uniquement pour les admins
{showBulkActions && isAdmin() && (
  <div>Actions en lot...</div>
)}
```

#### **3. Masquage du sélecteur Formations/Univers :**
```typescript
// AVANT : Sélecteur visible pour tous
<div className="flex bg-gray-100 rounded-lg p-1">
  <button>Formations</button>
  <button>Univers</button>
</div>

// APRÈS : Visible uniquement pour les admins
{isAdmin() && (
  <div className="flex bg-gray-100 rounded-lg p-1">
    <button>Formations</button>
    <button>Univers</button>
  </div>
)}
```

#### **4. Vue univers masquée pour apprenants :**
```typescript
// AVANT : Vue univers accessible à tous
) : viewMode === 'universes' ? (

// APRÈS : Vue univers uniquement pour admins
) : (isAdmin() && viewMode === 'universes') ? (
```

#### **5. Titre adapté selon le rôle :**
```typescript
<h2>
  {isAdmin() ? (
    viewMode === 'universes' ? 'Univers disponibles' : 
    selectedUniverse ? `Formations - ${selectedUniverse.name}` : 
    'Formations disponibles'
  ) : (
    'Mes formations assignées'  // ← Titre pour apprenants
  )}
</h2>
```

#### **6. Menu d'actions différencié :**
```typescript
// Menu Admin (existant)
{isAdmin() && (
  <div>
    <button>Gérer le contenu</button>
    <button>Configurer le quiz</button>
    <button>Assigner</button>
    <button>Modifier</button>
    <button>Supprimer</button>
  </div>
)}

// Menu Apprenant (nouveau)
{!isAdmin() && (
  <div>
    <button>👁️ Voir les détails</button>
    <button>📅 Planifier dans l'agenda</button>  // ← NOUVEAU
    <button>📄 Télécharger certificat</button>
  </div>
)}
```

### 🎯 **RÉSULTAT POUR LES APPRENANTS :**

#### **✅ ACTIONS AUTORISÉES :**
- **Consulter** les formations assignées
- **Voir les détails** des formations
- **Planifier** dans l'agenda
- **Télécharger** les certificats (si disponibles)
- **Démarrer/Continuer** les formations

#### **❌ ACTIONS INTERDITES :**
- **Créer** de nouvelles formations
- **Modifier** les formations existantes
- **Supprimer** des formations
- **Gérer** le contenu des formations
- **Configurer** les quiz
- **Assigner** des formations à d'autres utilisateurs
- **Gérer** les univers
- **Actions en lot** (sélection multiple)

#### **🔍 DONNÉES FILTRÉES :**
- **Formations affichées** → Uniquement celles assignées à l'utilisateur
- **API utilisée** → `learnerFormationsApi.getMyFormations()`
- **Base de données** → Requête via `FormationAssignment`

### 🚀 **POUR TESTER :**

#### **1. En tant qu'admin :**
```
Se connecter avec un compte admin
→ Voir TOUTES les formations
→ Boutons de création/modification visibles
→ Gestion des univers disponible
```

#### **2. En tant qu'apprenant :**
```
Se connecter : marie.martin@test.com / admin123
→ Voir UNIQUEMENT les formations assignées
→ Pas de boutons de création/modification
→ Menu avec "Planifier dans l'agenda"
```

### 🎉 **AVANTAGES :**

**✅ Interface cohérente** - Même design pour tous
**✅ Permissions strictes** - Actions limitées selon le rôle
**✅ Code réutilisé** - Pas de duplication
**✅ Sécurité** - Pas d'actions non autorisées

**🎯 Une interface, deux niveaux de permissions ! 🚀**
