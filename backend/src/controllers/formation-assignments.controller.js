import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour les assignations directes formation-utilisateur
export const formationAssignmentsController = {
  // Créer une assignation directe formation-utilisateur
  async createAssignment(req, res) {
    try {
      const { userId, formationId, isMandatory = false, dueDate } = req.body;
      const assignedBy = req.user.id; // ID de l'admin qui fait l'assignation

      // Validation
      if (!userId || !formationId) {
        return res.status(400).json({
          success: false,
          message: "userId et formationId sont obligatoires",
        });
      }

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
      });

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }

      // Vérifier si l'assignation existe déjà
      const existingAssignment = await prisma.formationAssignment.findUnique({
        where: {
          userId_formationId: {
            userId,
            formationId,
          },
        },
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: "Cette formation est déjà assignée à cet utilisateur",
        });
      }

      // Créer l'assignation
      const assignment = await prisma.formationAssignment.create({
        data: {
          userId,
          formationId,
          assignedBy,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: "Formation assignée avec succès",
      });
    } catch (error) {
      console.error("Erreur createAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer toutes les assignations
  async getAllAssignments(req, res) {
    try {
      const { userId, formationId, status } = req.query;

      const whereClause = {};
      if (userId) whereClause.userId = userId;
      if (formationId) whereClause.formationId = formationId;
      if (status) whereClause.status = status;

      const assignments = await prisma.formationAssignment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      });

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      console.error("Erreur getAllAssignments:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Récupérer une assignation par ID
  async getAssignmentById(req, res) {
    try {
      const { id } = req.params;

      const assignment = await prisma.formationAssignment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
          assignedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignation non trouvée",
        });
      }

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      console.error("Erreur getAssignmentById:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Mettre à jour une assignation
  async updateAssignment(req, res) {
    try {
      const { id } = req.params;
      const { status, dueDate } = req.body;

      const assignment = await prisma.formationAssignment.findUnique({
        where: { id },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignation non trouvée",
        });
      }

      const updatedAssignment = await prisma.formationAssignment.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          formation: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedAssignment,
        message: "Assignation mise à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur updateAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Supprimer une assignation
  async deleteAssignment(req, res) {
    try {
      const { id } = req.params;

      const assignment = await prisma.formationAssignment.findUnique({
        where: { id },
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignation non trouvée",
        });
      }

      await prisma.formationAssignment.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Assignation supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur deleteAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Assignation en masse
  async bulkAssign(req, res) {
    try {
      const { assignments } = req.body; // [{ userId, formationId, isMandatory, dueDate }]
      const assignedBy = req.user.id;

      if (!assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          message: "Liste d'assignations requise",
        });
      }

      const createdAssignments = [];
      const errors = [];

      for (const assignmentData of assignments) {
        try {
          const { userId, formationId, isMandatory = false, dueDate } = assignmentData;

          // Vérifier si l'assignation existe déjà
          const existingAssignment = await prisma.formationAssignment.findUnique({
            where: {
              userId_formationId: {
                userId,
                formationId,
              },
            },
          });

          if (existingAssignment) {
            errors.push({
              userId,
              formationId,
              error: "Assignation déjà existante",
            });
            continue;
          }

          // Créer l'assignation
          const assignment = await prisma.formationAssignment.create({
            data: {
              userId,
              formationId,
              assignedBy,
              dueDate: dueDate ? new Date(dueDate) : null,
              status: "PENDING",
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
                },
              },
            },
          });

          createdAssignments.push(assignment);
        } catch (error) {
          errors.push({
            userId: assignmentData.userId,
            formationId: assignmentData.formationId,
            error: error.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          created: createdAssignments,
          errors,
        },
        message: `${createdAssignments.length} assignation(s) créée(s) avec succès`,
      });
    } catch (error) {
      console.error("Erreur bulkAssign:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};

