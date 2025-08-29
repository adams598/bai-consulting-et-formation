import React from 'react';
import '../styles/admin-typography.css';

/**
 * Composant de démonstration des classes de typographie admin
 * Ce composant montre toutes les classes disponibles pour la plateforme admin
 */
export const TypographyDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="admin-title-xl admin-title-spacing mb-8">
          Guide de Typographie - Plateforme Admin BAI
        </h1>
        
        <p className="admin-text-lg admin-body-spacing mb-8">
          Ce guide présente toutes les classes de typographie disponibles pour maintenir 
          une cohérence visuelle professionnelle sur toute la plateforme admin.
        </p>

        {/* Hiérarchie des titres */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Hiérarchie des Titres</h2>
          
          <div className="space-y-4">
            <div>
              <h1 className="admin-title-xl">Titre XL (36px) - admin-title-xl</h1>
              <p className="admin-text-sm text-gray-500">Utilisé pour les titres de page principaux</p>
            </div>
            
            <div>
              <h2 className="admin-title-lg">Titre LG (30px) - admin-title-lg</h2>
              <p className="admin-text-sm text-gray-500">Utilisé pour les sections principales</p>
            </div>
            
            <div>
              <h3 className="admin-title-md">Titre MD (24px) - admin-title-md</h3>
              <p className="admin-text-sm text-gray-500">Utilisé pour les sous-sections</p>
            </div>
            
            <div>
              <h4 className="admin-title-sm">Titre SM (20px) - admin-title-sm</h4>
              <p className="admin-text-sm text-gray-500">Utilisé pour les titres de cartes</p>
            </div>
          </div>
        </section>

        {/* Corps de texte */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Corps de Texte</h2>
          
          <div className="space-y-4">
            <div>
              <p className="admin-text-xl">Texte XL (18px) - admin-text-xl</p>
              <p className="admin-text-sm text-gray-500">Utilisé pour les descriptions importantes</p>
            </div>
            
            <div>
              <p className="admin-text-lg">Texte LG (16px) - admin-text-lg</p>
              <p className="admin-text-sm text-gray-500">Utilisé pour le texte principal des paragraphes</p>
            </div>
            
            <div>
              <p className="admin-text-md">Texte MD (14px) - admin-text-md</p>
              <p className="admin-text-sm text-gray-500">Utilisé pour le texte secondaire</p>
            </div>
            
            <div>
              <p className="admin-text-sm">Texte SM (12px) - admin-text-sm</p>
              <p className="admin-text-sm text-gray-500">Utilisé pour les légendes et notes</p>
            </div>
          </div>
        </section>

        {/* Labels et boutons */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Labels et Boutons</h2>
          
          <div className="space-y-4">
            <div>
              <label className="admin-label block mb-2">Label (14px) - admin-label</label>
              <input 
                type="text" 
                placeholder="Placeholder (14px) - admin-input" 
                className="admin-input w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="space-x-4">
              <button className="admin-button bg-blue-600 text-white px-4 py-2 rounded">
                Bouton (14px) - admin-button
              </button>
              <button className="admin-button-lg bg-green-600 text-white px-4 py-2 rounded">
                Bouton LG (16px) - admin-button-lg
              </button>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Navigation</h2>
          
          <div className="space-y-2">
            <a href="#" className="admin-nav block">Navigation (14px) - admin-nav</a>
            <a href="#" className="admin-nav-active block">Navigation Active (14px) - admin-nav-active</a>
          </div>
        </section>

        {/* Tableaux */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Tableaux</h2>
          
          <table className="w-full">
            <thead>
              <tr>
                <th className="admin-table-header text-left p-2 border-b">En-tête (12px) - admin-table-header</th>
                <th className="admin-table-header text-left p-2 border-b">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="admin-table-cell p-2">Cellule (14px) - admin-table-cell</td>
                <td className="admin-table-cell p-2">Utilisé pour le contenu des tableaux</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Badges et étiquettes */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Badges et Étiquettes</h2>
          
          <div className="space-x-4">
            <span className="admin-badge bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Badge (12px) - admin-badge
            </span>
            <span className="admin-badge-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
              Badge SM (10px) - admin-badge-sm
            </span>
          </div>
        </section>

        {/* Cartes et composants */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Cartes et Composants</h2>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="admin-card-title admin-title-spacing mb-2">
              Titre de Carte (18px) - admin-card-title
            </h3>
            <p className="admin-card-subtitle">
              Sous-titre de carte (14px) - admin-card-subtitle
            </p>
          </div>
        </section>

        {/* Modales */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Modales</h2>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="admin-modal-title admin-title-spacing mb-2">
              Titre de Modal (20px) - admin-modal-title
            </h3>
            <p className="admin-modal-content">
              Contenu de modal (14px) - admin-modal-content
            </p>
          </div>
        </section>

        {/* Statistiques et métriques */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Statistiques et Métriques</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="admin-stat-number">32</p>
              <p className="admin-stat-label">Total Banques</p>
            </div>
            <div className="text-center">
              <p className="admin-stat-number">156</p>
              <p className="admin-stat-label">Utilisateurs Actifs</p>
            </div>
            <div className="text-center">
              <p className="admin-stat-number">89%</p>
              <p className="admin-stat-label">Taux de Réussite</p>
            </div>
          </div>
        </section>

        {/* Messages et notifications */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Messages et Notifications</h2>
          
          <div className="space-y-4">
            <p className="admin-message p-3 bg-gray-100 rounded">
              Message standard (14px) - admin-message
            </p>
            <p className="admin-message-success p-3 bg-green-100 rounded">
              Message de succès (14px) - admin-message-success
            </p>
            <p className="admin-message-error p-3 bg-red-100 rounded">
              Message d'erreur (14px) - admin-message-error
            </p>
            <p className="admin-message-warning p-3 bg-yellow-100 rounded">
              Message d'avertissement (14px) - admin-message-warning
            </p>
          </div>
        </section>

        {/* Classes utilitaires */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Classes Utilitaires</h2>
          
          <div className="space-y-4">
            <p className="admin-text-readable">
              Texte avec rendu optimisé - admin-text-readable
            </p>
            <p className="admin-title-spacing">
              Titre avec espacement optimisé - admin-title-spacing
            </p>
            <p className="admin-body-spacing">
              Corps de texte avec espacement optimisé - admin-body-spacing
            </p>
          </div>
        </section>

        {/* Responsive */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="admin-title-lg admin-title-spacing mb-6">Responsive</h2>
          
          <p className="admin-text-md">
            Les classes de typographie s'adaptent automatiquement aux écrans mobiles. 
            Sur mobile, les titres sont légèrement réduits pour une meilleure lisibilité.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TypographyDemo;
