/**
 * Construit l'URL complète d'une image en fonction de son type
 * @param imagePath - Le chemin relatif de l'image (ex: /uploads/formations/...)
 * @returns L'URL complète vers le serveur backend
 */
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
      
      const apiUrl = `http://localhost:3000/api/formations/${formationTitle}/${filename}`;
      //console.log('🔍 getImageUrl - URL API formation couverture générée:', apiUrl);
      return apiUrl;
    }
    
    // Lesson image/file: uploads/formations/{formation}/lessons/{lesson}/couverture-{timestamp}.jpg
    if (pathParts.length === 6) {
      const formationTitle = pathParts[2];
      const lessonTitle = pathParts[4];
      const filename = pathParts[5];
      
      const apiUrl = `http://localhost:3000/api/formations/${formationTitle}/lessons/${lessonTitle}/${filename}`;
      //console.log('🔍 getImageUrl - URL API leçon générée:', apiUrl);
      return apiUrl;
    }
    
      // Lesson folder (for files): uploads/formations/{formation}/lessons/{lesson}
    if (pathParts.length === 5) {
      const formationTitle = pathParts[2];
      const lessonTitle = pathParts[4];
      
      // Utiliser la route admin qui récupère le fichier le plus récent
      const apiUrl = `http://localhost:3000/api/admin/lesson-file/${formationTitle}/${lessonTitle}`;
      //console.log('🔍 getImageUrl - URL API dossier leçon générée:', apiUrl);
      return apiUrl;
    }
  }
  
  // Fallback to the old /api/images/ route for other /uploads/ types
  if (cleanPath.startsWith('uploads/')) {
    const apiUrl = `http://localhost:3000/api/images/${cleanPath.replace('uploads/', '')}`;
    //console.log('🔍 getImageUrl - URL API fallback générée:', apiUrl);
    return apiUrl;
  }
  
  // Fallback to direct URL if not an uploads/ path
  const directUrl = `http://localhost:3000/${cleanPath}`;
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
  lessonTitle: string
): string => {
  if (!formationTitle || !lessonTitle) return '';
  
  // Sanitizer les titres pour correspondre au backend
  const sanitizedFormationTitle = formationTitle
    .replace(/[^a-zA-ZÀ-ÿ0-9]/g, "_") // Remplacer les caractères non alphanumériques (sauf accents) par des underscores
    .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, "") // Supprimer les underscores au début et à la fin
    .toLowerCase();
    
  const sanitizedLessonTitle = lessonTitle
    .replace(/[^a-zA-ZÀ-ÿ0-9]/g, "_") // Remplacer les caractères non alphanumériques (sauf accents) par des underscores
    .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, "") // Supprimer les underscores au début et à la fin
    .toLowerCase();
  
  // URL directe vers l'API qui récupère le fichier de la leçon
  const apiUrl = `http://localhost:3000/api/admin/lesson-file/${sanitizedFormationTitle}/${sanitizedLessonTitle}`;
  
  // console.log('🔍 getLessonFileUrl - URL API générée:', apiUrl);
  return apiUrl;
};
