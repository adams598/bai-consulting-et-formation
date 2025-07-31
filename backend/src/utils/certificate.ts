import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Génère un code de vérification unique pour un certificat
 * Le code est composé de 12 caractères alphanumériques
 * Format: XXXX-XXXX-XXXX
 */
export async function generateVerificationCode(): Promise<string> {
  const generateCode = () => {
    const bytes = crypto.randomBytes(9);
    const code = bytes.toString('hex').toUpperCase();
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
  };

  let code: string;
  let isUnique = false;

  // Générer un code unique
  while (!isUnique) {
    code = generateCode();
    const existingCertificate = await prisma.certificate.findUnique({
      where: { verificationCode: code }
    });
    if (!existingCertificate) {
      isUnique = true;
      return code;
    }
  }

  throw new Error('Impossible de générer un code de vérification unique');
}

/**
 * Génère un PDF de certificat
 * @param certificate Les données du certificat
 * @param user Les données de l'utilisateur
 * @param course Les données du cours
 */
export async function generateCertificatePDF(
  certificate: {
    id: string;
    verificationCode: string;
    issuedAt: Date;
  },
  user: {
    name: string;
    email: string;
  },
  course: {
    title: string;
    description: string;
  }
): Promise<Buffer> {
  // TODO: Implémenter la génération du PDF avec une bibliothèque comme PDFKit
  // Pour l'instant, retourner un buffer vide
  return Buffer.from('');
} 