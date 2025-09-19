// Test du nouveau format de nommage des fichiers d'opportunités
// Format : file-{titredufichier}-{id du fichier}.pdf

function sanitizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
    .replace(/[^a-zA-Z0-9_-]/g, "_") // Remplacer les caractères spéciaux par _
    .replace(/_+/g, "_") // Remplacer les underscores multiples par un seul
    .replace(/^_|_$/g, ""); // Retirer les underscores en début/fin
}

// Test avec différents noms de fichiers
const testFiles = [
  "Document de présentation.pdf",
  "Rapport financier 2024.pdf", 
  "Présentation commerciale.pptx",
  "Guide utilisateur final.docx",
  "Document avec accents éàç.pdf",
  "Fichier avec espaces multiples   .pdf",
  "Document-avec-tirets.pdf"
];

console.log("🧪 Test du nouveau format de nommage des fichiers d'opportunités\n");

testFiles.forEach((originalName, index) => {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const extension = originalName.match(/\.[^/.]+$/)?.[0] || "";
  const sanitizedTitle = sanitizeTitle(baseName);
  const fileId = 1703123456789 + index; // ID simulé
  
  const newFilename = `file-${sanitizedTitle}-${fileId}${extension}`;
  
  console.log(`📄 Fichier ${index + 1}:`);
  console.log(`   Original: ${originalName}`);
  console.log(`   Sanitized: ${sanitizedTitle}`);
  console.log(`   Nouveau format: ${newFilename}`);
  
  // Test de l'extraction
  const match = newFilename.match(/^file-(.+)-(\d+)\.(.+)$/);
  if (match) {
    const extractedTitle = match[1].replace(/_/g, " ");
    const extractedId = match[2];
    const extractedExt = match[3];
    console.log(`   ✅ Extraction réussie:`);
    console.log(`      Titre: ${extractedTitle}`);
    console.log(`      ID: ${extractedId}`);
    console.log(`      Extension: .${extractedExt}`);
  } else {
    console.log(`   ❌ Échec de l'extraction`);
  }
  console.log("");
});

console.log("✅ Test terminé !");

