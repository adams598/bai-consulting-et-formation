import { PrismaClient, Certificate, Course, User } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { generateVerificationCode } from '../utils/certificate';

export class CertificateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async generateCertificate(
    userId: string,
    courseId: string
  ): Promise<Certificate> {
    // Vérifier si l'utilisateur a complété le cours
    const progress = await this.prisma.progress.findFirst({
      where: {
        userId,
        lesson: {
          module: {
            courseId
          }
        },
        completed: true
      }
    });

    if (!progress) {
      throw new Error('Le cours doit être complété pour générer un certificat');
    }

    // Vérifier si un certificat existe déjà
    const existingCertificate = await this.prisma.certificate.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Générer un code de vérification unique
    const verificationCode = await generateVerificationCode();

    // Créer le certificat
    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        verificationCode,
        issuedAt: new Date(),
        downloadUrl: `/certificates/${verificationCode}.pdf` // URL pour télécharger le PDF
      }
    });

    return certificate;
  }

  async getCertificateById(certificateId: string): Promise<Certificate & {
    user: User;
    course: Course;
  }> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true,
        course: true
      }
    });

    if (!certificate) {
      throw new NotFoundError('Certificat non trouvé');
    }

    return certificate;
  }

  async verifyCertificate(verificationCode: string): Promise<{
    isValid: boolean;
    certificate?: Certificate & {
      user: User;
      course: Course;
    };
  }> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        user: true,
        course: true
      }
    });

    return {
      isValid: !!certificate,
      certificate
    };
  }

  async getUserCertificates(userId: string): Promise<(Certificate & {
    course: Course;
  })[]> {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: true
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });
  }
} 