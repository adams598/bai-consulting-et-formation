import crypto from "crypto";

/**
 * Génère un mot de passe sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} Mot de passe généré
 */
export function generatePassword(length = 12) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // Assurer au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += charset.charAt(Math.floor(Math.random() * 26)); // Majuscule
  password += charset.charAt(26 + Math.floor(Math.random() * 26)); // Minuscule
  password += charset.charAt(52 + Math.floor(Math.random() * 10)); // Chiffre
  password += charset.charAt(62 + Math.floor(Math.random() * 8)); // Caractère spécial

  // Remplir le reste avec des caractères aléatoires
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Mélanger le mot de passe
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Valide un mot de passe selon les critères de sécurité
 * @param {string} password - Mot de passe à valider
 * @returns {object} Résultat de la validation
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Génère un hash sécurisé pour un mot de passe
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} Hash du mot de passe
 */
export async function hashPassword(password) {
  const saltRounds = 12;
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare un mot de passe avec son hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Hash du mot de passe
 * @returns {Promise<boolean>} True si le mot de passe correspond
 */
export async function comparePassword(password, hash) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
