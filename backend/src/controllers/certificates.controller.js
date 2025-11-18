import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Contrôleur pour la génération de certificats
export const certificatesController = {
  // Générer un certificat pour un utilisateur qui a terminé une formation
  async generateCertificate(req, res) {
    try {
      const { userId, formationId } = req.params;

      // Vérifier si l'utilisateur a terminé la formation
      const userProgress = await prisma.userProgress.findFirst({
        where: {
          userId,
          formationId,
          completedAt: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      if (!userProgress) {
        return res.status(404).json({
          success: false,
          message: "Formation non terminée par cet utilisateur",
        });
      }

      // Vérifier si un certificat existe déjà
      const existingCertificate = await prisma.certificate.findFirst({
        where: {
          userId,
          formationId,
        },
      });

      if (existingCertificate) {
        return res.json({
          success: true,
          message: "Certificat déjà généré",
          data: existingCertificate,
        });
      }

      // Générer le certificat
      const certificate = await prisma.certificate.create({
        data: {
          userId,
          formationId,
          certificateNumber: `BAI-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`,
          issuedAt: new Date(),
          completedAt: userProgress.completedAt,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          formation: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      });

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId,
          type: "certificate_generated",
          title: "Certificat généré !",
          message: `Félicitations ! Votre certificat pour la formation "${userProgress.formation.title}" est maintenant disponible.`,
          data: JSON.stringify({
            certificateId: certificate.id,
            formationId,
            certificateNumber: certificate.certificateNumber,
          }),
        },
      });

      res.status(201).json({
        success: true,
        message: "Certificat généré avec succès",
        data: certificate,
      });
    } catch (error) {
      console.error("Erreur generateCertificate:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Générer automatiquement des certificats pour tous les utilisateurs ayant terminé une formation
  async generateBulkCertificates(req, res) {
    try {
      const { formationId } = req.params;

      // Trouver tous les utilisateurs qui ont terminé cette formation
      const completedUsers = await prisma.userProgress.findMany({
        where: {
          formationId,
          completedAt: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          formation: {
            select: {
              title: true,
            },
          },
        },
      });

      if (completedUsers.length === 0) {
        return res.json({
          success: true,
          message: "Aucun utilisateur n'a terminé cette formation",
          data: { certificatesGenerated: 0 },
        });
      }

      // Générer les certificats
      const certificates = await Promise.all(
        completedUsers.map(async (progress) => {
          // Vérifier si un certificat existe déjà
          const existingCertificate = await prisma.certificate.findFirst({
            where: {
              userId: progress.userId,
              formationId,
            },
          });

          if (existingCertificate) {
            return existingCertificate;
          }

          // Créer le nouveau certificat
          const certificate = await prisma.certificate.create({
            data: {
              userId: progress.userId,
              formationId,
              certificateNumber: `BAI-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)
                .toUpperCase()}`,
              issuedAt: new Date(),
              completedAt: progress.completedAt,
            },
          });

          // Créer une notification
          await prisma.notification.create({
            data: {
              userId: progress.userId,
              type: "certificate_generated",
              title: "Certificat généré !",
              message: `Félicitations ! Votre certificat pour la formation "${progress.formation.title}" est maintenant disponible.`,
              data: JSON.stringify({
                certificateId: certificate.id,
                formationId,
                certificateNumber: certificate.certificateNumber,
              }),
            },
          });

          return certificate;
        })
      );

      res.json({
        success: true,
        message: `${certificates.length} certificats générés avec succès`,
        data: {
          certificatesGenerated: certificates.length,
          certificates,
        },
      });
    } catch (error) {
      console.error("Erreur generateBulkCertificates:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les certificats d'un utilisateur
  async getUserCertificates(req, res) {
    try {
      const { userId } = req.params;

      const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      });

      res.json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      console.error("Erreur getUserCertificates:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir tous les certificats (pour les admins)
  async getAllCertificates(req, res) {
    try {
      const { page = 1, limit = 50, formationId, userId } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {};
      if (formationId) whereClause.formationId = formationId;
      if (userId) whereClause.userId = userId;

      const certificates = await prisma.certificate.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              bank: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: { issuedAt: "desc" },
        skip,
        take: parseInt(limit),
      });

      const total = await prisma.certificate.count({ where: whereClause });

      res.json({
        success: true,
        data: {
          certificates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Erreur getAllCertificates:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Télécharger un certificat (générer le PDF)
  async downloadCertificate(req, res) {
    try {
      const { certificateId } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          formation: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificat non trouvé",
        });
      }

      // Pour l'instant, retourner les données du certificat
      // Dans une implémentation complète, on générerait un PDF
      res.json({
        success: true,
        data: {
          certificate,
          downloadUrl: `/api/certificates/${certificateId}/pdf`, // URL pour télécharger le PDF
        },
      });
    } catch (error) {
      console.error("Erreur downloadCertificate:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Vérifier la validité d'un certificat
  async verifyCertificate(req, res) {
    try {
      const { certificateNumber } = req.params;

      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          formation: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificat non trouvé ou invalide",
        });
      }

      res.json({
        success: true,
        message: "Certificat valide",
        data: certificate,
      });
    } catch (error) {
      console.error("Erreur verifyCertificate:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};
































