import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour les certificats des apprenants
export const learnerCertificatesController = {
  // Obtenir les certificats de l'apprenant
  getCertificates: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, search } = req.query;

      // Construire les filtres
      const whereClause = { userId };

      // Récupérer les certificats
      const certificates = await prisma.certificate.findMany({
        where: whereClause,
        include: {
          formation: true,
        },
        orderBy: { issuedAt: "desc" },
      });

      // Transformer les données
      const certificatesData = certificates.map((certificate) => {
        const now = new Date();
        const isValid = !certificate.expiresAt || certificate.expiresAt > now;

        return {
          id: certificate.id,
          formationTitle: certificate.formation.title,
          formationCode: certificate.formation.code,
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt,
          completedAt: certificate.completedAt,
          score: certificate.score,
          duration: certificate.formation.duration,
          organization: certificate.formation.organization || "BAI Consulting",
          isValid,
          expiresAt: certificate.expiresAt,
          downloadUrl: `/api/learner/certificates/${certificate.id}/download`,
          verificationUrl: `/api/learner/certificates/${certificate.certificateNumber}/verify`,
        };
      });

      // Appliquer les filtres
      let filteredCertificates = certificatesData;

      if (status && status !== "all") {
        if (status === "valid") {
          filteredCertificates = filteredCertificates.filter((c) => c.isValid);
        } else if (status === "expired") {
          filteredCertificates = filteredCertificates.filter((c) => !c.isValid);
        }
      }

      if (search) {
        const searchTerm = search.toLowerCase();
        filteredCertificates = filteredCertificates.filter(
          (c) =>
            c.formationTitle.toLowerCase().includes(searchTerm) ||
            (c.formationCode &&
              c.formationCode.toLowerCase().includes(searchTerm)) ||
            c.certificateNumber.toLowerCase().includes(searchTerm)
        );
      }

      res.json({
        success: true,
        data: filteredCertificates,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des certificats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des certificats",
      });
    }
  },

  // Télécharger un certificat
  downloadCertificate: async (req, res) => {
    try {
      const userId = req.user.id;
      const certificateId = req.params.certificateId;

      // Vérifier que le certificat appartient à l'utilisateur
      const certificate = await prisma.certificate.findFirst({
        where: {
          id: certificateId,
          userId,
        },
        include: {
          formation: true,
          user: true,
        },
      });

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificat non trouvé",
        });
      }

      // TODO: Générer le PDF du certificat
      // Pour l'instant, on retourne les données du certificat
      // Dans une implémentation complète, on générerait un PDF avec les informations

      const certificateData = {
        certificateNumber: certificate.certificateNumber,
        formationTitle: certificate.formation.title,
        formationCode: certificate.formation.code,
        userName: `${certificate.user.firstName} ${certificate.user.lastName}`,
        userEmail: certificate.user.email,
        issuedAt: certificate.issuedAt,
        completedAt: certificate.completedAt,
        score: certificate.score,
        duration: certificate.formation.duration,
        organization: certificate.formation.organization || "BAI Consulting",
      };

      res.json({
        success: true,
        data: certificateData,
        message: "Données du certificat (PDF à générer)",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement du certificat:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du téléchargement du certificat",
      });
    }
  },

  // Vérifier un certificat
  verifyCertificate: async (req, res) => {
    try {
      const certificateNumber = req.params.certificateNumber;

      // Récupérer le certificat
      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber },
        include: {
          formation: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
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

      const now = new Date();
      const isValid = !certificate.expiresAt || certificate.expiresAt > now;

      const verificationData = {
        certificateNumber: certificate.certificateNumber,
        formationTitle: certificate.formation.title,
        formationCode: certificate.formation.code,
        userName: `${certificate.user.firstName} ${certificate.user.lastName}`,
        userEmail: certificate.user.email,
        issuedAt: certificate.issuedAt,
        completedAt: certificate.completedAt,
        score: certificate.score,
        duration: certificate.formation.duration,
        organization: certificate.formation.organization || "BAI Consulting",
        isValid,
        expiresAt: certificate.expiresAt,
      };

      res.json({
        success: true,
        data: verificationData,
      });
    } catch (error) {
      console.error("Erreur lors de la vérification du certificat:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du certificat",
      });
    }
  },

  // Obtenir les statistiques des certificats
  getCertificateStats: async (req, res) => {
    try {
      const userId = req.user.id;

      // Récupérer tous les certificats de l'utilisateur
      const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: {
          formation: true,
        },
      });

      const now = new Date();
      const validCertificates = certificates.filter(
        (c) => !c.expiresAt || c.expiresAt > now
      );
      const expiredCertificates = certificates.filter(
        (c) => c.expiresAt && c.expiresAt <= now
      );

      const averageScore =
        certificates.length > 0
          ? certificates.reduce((sum, c) => sum + (c.score || 0), 0) /
            certificates.length
          : 0;

      const stats = {
        total: certificates.length,
        valid: validCertificates.length,
        expired: expiredCertificates.length,
        averageScore: Math.round(averageScore),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques des certificats:",
        error
      );
      res.status(500).json({
        success: false,
        message:
          "Erreur lors de la récupération des statistiques des certificats",
      });
    }
  },
};
