/**
 * Construit l'URL complète d'une image en fonction de son type
 * @param imagePath - Le chemin relatif de l'image (ex: /uploads/formations/...)
 * @returns L'URL complète vers le serveur backend
 */
import { currentEnv } from '../config/environments';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_UPLOADS_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    return (currentEnv.apiUrl || window.location.origin).replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
};

const baseUrl = getBaseUrl();

export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  
  //console.log('🔍 getImageUrl - Chemin original:', imagePath);

  // Handle data:image URLs directly
  if (imagePath.startsWith('data:image/')) {
    //console.log('🔍 getImageUrl - Data URL détectée, retournée telle quelle');
    return imagePath;
  }

  // If it's a complete localhost:3000 URL, extract and re-process the relative path
  if (imagePath.startsWith('http://localhost:3000/')) {
    //console.log('🔍 getImageUrl - URL localhost:3000 détectée, extraction du chemin relatif');
    const relativePath = imagePath.replace('http://localhost:3000/', '');
    //console.log('🔍 getImageUrl - Chemin relatif extrait:', relativePath);
    return getImageUrl(relativePath); // Recursively call with relative path
  }
  
  // If it's any other complete URL, return it as is
  if (imagePath.startsWith('http')) {
    //console.log('🔍 getImageUrl - Autre URL complète détectée, retournée telle quelle');
    return imagePath;
  }
  
  // Clean the path (remove leading slashes)
  const cleanPath = imagePath.replace(/^\/+/, '');
  //console.log('🔍 getImageUrl - Chemin nettoyé:', cleanPath);
  
  // Transform /uploads/ into specific API routes
  if (cleanPath.startsWith('uploads/formations/')) {
    const pathParts = cleanPath.split('/');
    //console.log('🔍 getImageUrl - Path parts:', pathParts);
    
    // Formation cover image: uploads/formations/{formation}/couverture-{timestamp}.jpg
    if (pathParts.length === 4) {
      const formationTitle = pathParts[2];
      const filename = pathParts[3];
      
      // Sanitizer le titre comme le fait le backend
      const sanitizedFormationTitle = formationTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, ''); // Retirer les underscores en début/fin
      
      const apiUrl = `${baseUrl}/api/formations/${sanitizedFormationTitle}/${filename}`;
      //console.log('🔍 getImageUrl - URL API formation couverture générée:', apiUrl);
      return apiUrl;
    }
    
    // Lesson image/file: uploads/formations/{formation}/lessons/{lesson}/couverture-{timestamp}.jpg
    if (pathParts.length === 6) {
      const formationTitle = pathParts[2];
      const lessonTitle = pathParts[4];
      const filename = pathParts[5];
      
      // Sanitizer les titres comme le fait le backend
      const sanitizedFormationTitle = formationTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, ''); // Retirer les underscores en début/fin
      const sanitizedLessonTitle = lessonTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, ''); // Retirer les underscores en début/fin
      
      const apiUrl = `${baseUrl}/api/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/${filename}`;
      //console.log('🔍 getImageUrl - URL API leçon générée:', apiUrl);
      return apiUrl;
    }
    
      // Lesson folder (for files): uploads/formations/{formation}/lessons/{lesson}
    if (pathParts.length === 5) {
      const formationTitle = pathParts[2];
      const lessonTitle = pathParts[4];
      
      // Sanitizer les titres comme le fait le backend
      const sanitizedFormationTitle = formationTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, ''); // Retirer les underscores en début/fin
      const sanitizedLessonTitle = lessonTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Remplacer les underscores multiples par un seul
        .replace(/^_|_$/g, ''); // Retirer les underscores en début/fin
      
      // Utiliser la route admin qui récupère le fichier le plus récent
      const apiUrl = `${baseUrl}/api/admin/lesson-file/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}`;
      //console.log('🔍 getImageUrl - URL API dossier leçon générée:', apiUrl);
      return apiUrl;
    }
  }
  
  // Fallback to the old /api/images/ route for other /uploads/ types
  if (cleanPath.startsWith('uploads/')) {
    const apiUrl = `${baseUrl}/api/images/${cleanPath.replace('uploads/', '')}`;
    //console.log('🔍 getImageUrl - URL API fallback générée:', apiUrl);
    return apiUrl;
  }
  
  // Fallback to direct URL if not an uploads/ path
  const directUrl = `${baseUrl}/${cleanPath}`;
  //console.log('🔍 getImageUrl - URL directe générée:', directUrl);
  return directUrl;
};

/**
 * Construit l'URL d'une image de couverture de formation
 * @param coverImage - Le chemin relatif de l'image de couverture
 * @returns L'URL complète de l'image
 */
export const getFormationCoverImageUrl = (coverImage: string | null | undefined): string => {
  // console.log('🔍 getFormationCoverImageUrl appelé avec:', coverImage);
  const result = getImageUrl(coverImage);
  // console.log('🔍 getFormationCoverImageUrl retourne:', result);
  return result;
};

/**
 * Construit l'URL d'une image de leçon
 * @param lessonImage - Le chemin relatif de l'image de leçon
 * @returns L'URL complète de l'image
 */
export const getLessonImageUrl = (lessonImage: string | null | undefined): string => {
  // console.log('🔍 getLessonImageUrl appelé avec:', lessonImage);
  const result = getImageUrl(lessonImage);
  // console.log('🔍 getLessonImageUrl retourne:', result);
  return result;
};

/**
 * Construit l'URL de téléchargement d'un fichier de leçon
 * @param formationTitle - Le titre de la formation
 * @param lessonTitle - Le titre de la leçon
 * @returns L'URL complète vers le serveur backend pour télécharger le fichier
 */
export const getLessonFileUrl = (
  formationTitle: string,
  lessonTitle: string,
  filename?: string
): string => {
  if (!formationTitle || !lessonTitle) return '';
  
  const sanitizedFormationTitle = formationTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const sanitizedLessonTitle = lessonTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (filename) {
    const sanitizedFilename = filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');

    return `${baseUrl}/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/${sanitizedFilename}`;
  }

  return `${baseUrl}/uploads/formations/${sanitizedFormationTitle}/lessons/${sanitizedLessonTitle}/`;
};

/**
 * Construit l'URL d'un fichier d'opportunité commerciale
 * @param fileName - Le nom du fichier (ex: file-dc_2025_01_astek_adams_dextert_fr-1758052332771.pdf)
 * @returns L'URL complète vers le serveur backend pour accéder au fichier
 */
export const getOpportunityFileUrl = (fileName: string | null | undefined): string => {
  if (!fileName) return '';
  
  // console.log('🔍 getOpportunityFileUrl appelé avec:', fileName);
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (fileName.startsWith('http')) {
    return fileName;
  }
  
  // Construire l'URL complète vers l'API publique des fichiers OC (sans authentification)
  const apiUrl = `${baseUrl}/api/opportunities/files/${fileName}`;
  
  // console.log('🔍 getOpportunityFileUrl retourne:', apiUrl);
  return apiUrl;
};
