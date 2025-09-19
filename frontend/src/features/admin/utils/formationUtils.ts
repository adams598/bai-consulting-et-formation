/**
 * Utilitaires pour gérer les données dynamiques des formations
 */

/**
 * Parse une chaîne JSON en tableau de chaînes
 */
export const parseJsonArray = (jsonString?: string): string[] => {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erreur lors du parsing JSON:', error);
    return [];
  }
};

/**
 * Convertit un tableau de chaînes en JSON
 */
export const stringifyJsonArray = (array: string[]): string => {
  return JSON.stringify(array);
};

/**
 * Obtient les objectifs pédagogiques d'une formation
 */
export const getFormationObjectives = (formation: any): string[] => {
  return parseJsonArray(formation.objectives);
};

/**
 * Obtient le programme détaillé d'une formation
 */
export const getFormationDetailedProgram = (formation: any): string[] => {
  return parseJsonArray(formation.detailedProgram);
};

/**
 * Obtient le public concerné d'une formation
 */
export const getFormationTargetAudience = (formation: any): string[] => {
  return parseJsonArray(formation.targetAudience);
};

/**
 * Obtient le code de formation formaté
 */
export const getFormationCode = (formation: any): string => {
  return formation.code || formation.id.substring(0, 8).toUpperCase();
};

/**
 * Obtient la modalité pédagogique avec une valeur par défaut
 */
export const getFormationPedagogicalModality = (formation: any): string => {
  return formation.pedagogicalModality || 'E-learning';
};

/**
 * Obtient l'organisme de formation avec une valeur par défaut
 */
export const getFormationOrganization = (formation: any): string => {
  return formation.organization || 'SHERPA Developpement';
};

/**
 * Obtient les prérequis avec une valeur par défaut
 */
export const getFormationPrerequisites = (formation: any): string => {
  return formation.prerequisites || 'Aucune connaissance préalable n\'est nécessaire.';
};




