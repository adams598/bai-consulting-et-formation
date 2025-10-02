import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Contrôleur pour les assignations avancées
export const advancedAssignmentsController = {
  // Assignation en masse d'une formation à plusieurs banques
  async bulkAssignToBanks(req, res) {
    try {
      const { formationId, bankIds, mandatory = false, dueDate } = req.body;

      // Validation
      if (!formationId || !bankIds || !Array.isArray(bankIds)) {
        return res.status(400).json({
          success: false,
          message: "formationId et bankIds sont obligatoires",
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

      // Vérifier si les banques existent
      const banks = await prisma.bank.findMany({
        where: { id: { in: bankIds } },
      });

      if (banks.length !== bankIds.length) {
        return res.status(400).json({
          success: false,
          message: "Une ou plusieurs banques n'existent pas",
        });
      }

      // Créer les assignations
      const assignments = await Promise.all(
        bankIds.map((bankId) =>
          prisma.bankFormation.create({
            data: {
              bankId,
              formationId,
              mandatory,
              dueDate: dueDate ? new Date(dueDate) : null,
              assignedAt: new Date(),
            },
          })
        )
      );

      // Créer des notifications pour chaque banque
      await Promise.all(
        bankIds.map(async (bankId) => {
          const bankUsers = await prisma.user.findMany({
            where: { bankId, isActive: true },
          });

          await Promise.all(
            bankUsers.map((user) =>
              prisma.notification.create({
                data: {
                  userId: user.id,
                  type: "formation_assigned",
                  title: "Nouvelle formation assignée",
                  message: `La formation "${
                    formation.title
                  }" vous a été assignée${mandatory ? " (obligatoire)" : ""}.`,
                  data: JSON.stringify({
                    formationId,
                    bankId,
                    mandatory,
                    dueDate,
                  }),
                },
              })
            )
          );
        })
      );

      res.status(201).json({
        success: true,
        message: `Formation assignée à ${assignments.length} banques avec succès`,
        data: assignments,
      });
    } catch (error) {
      console.error("Erreur bulkAssignToBanks:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Assignation en masse d'utilisateurs à une formation
  async bulkAssignUsers(req, res) {
    try {
      const { bankFormationId, userIds, mandatory = false } = req.body;

      // Validation
      if (!bankFormationId || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: "bankFormationId et userIds sont obligatoires",
        });
      }

      // Vérifier si l'assignation banque-formation existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id: bankFormationId },
        include: {
          formation: true,
          bank: true,
        },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation banque-formation non trouvée",
        });
      }

      // Vérifier si les utilisateurs existent et appartiennent à la bonne banque
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          bankId: bankFormation.bankId,
          isActive: true,
        },
      });

      if (users.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "Un ou plusieurs utilisateurs n'existent pas ou n'appartiennent pas à cette banque",
        });
      }

      // Créer les assignations utilisateur
      const assignments = await Promise.all(
        userIds.map((userId) =>
          prisma.userFormationAssignment.create({
            data: {
              userId,
              bankFormationId,
              mandatory,
              assignedAt: new Date(),
            },
          })
        )
      );

      // Créer des notifications pour chaque utilisateur
      await Promise.all(
        userIds.map((userId) =>
          prisma.notification.create({
            data: {
              userId,
              type: "formation_assigned",
              title: "Nouvelle formation assignée",
              message: `La formation "${
                bankFormation.formation.title
              }" vous a été assignée${mandatory ? " (obligatoire)" : ""}.`,
              data: JSON.stringify({
                formationId: bankFormation.formationId,
                bankId: bankFormation.bankId,
                mandatory,
              }),
            },
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `${assignments.length} utilisateurs assignés avec succès`,
        data: assignments,
      });
    } catch (error) {
      console.error("Erreur bulkAssignUsers:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Assignation par critères (rôle, département, etc.)
  async assignByCriteria(req, res) {
    try {
      const { bankFormationId, criteria, mandatory = false } = req.body;

      // Validation
      if (!bankFormationId || !criteria) {
        return res.status(400).json({
          success: false,
          message: "bankFormationId et criteria sont obligatoires",
        });
      }

      // Vérifier si l'assignation banque-formation existe
      const bankFormation = await prisma.bankFormation.findUnique({
        where: { id: bankFormationId },
        include: {
          formation: true,
          bank: true,
        },
      });

      if (!bankFormation) {
        return res.status(404).json({
          success: false,
          message: "Assignation banque-formation non trouvée",
        });
      }

      // Construire la clause WHERE basée sur les critères
      const whereClause = {
        bankId: bankFormation.bankId,
        isActive: true,
      };

      if (criteria.role) {
        whereClause.role = criteria.role;
      }
      if (criteria.department) {
        whereClause.department = criteria.department;
      }
      if (criteria.position) {
        whereClause.position = criteria.position;
      }

      // Trouver les utilisateurs correspondants
      const users = await prisma.user.findMany({
        where: whereClause,
      });

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Aucun utilisateur ne correspond aux critères",
        });
      }

      // Créer les assignations
      const assignments = await Promise.all(
        users.map((user) =>
          prisma.userFormationAssignment.create({
            data: {
              userId: user.id,
              bankFormationId,
              mandatory,
              assignedAt: new Date(),
            },
          })
        )
      );

      // Créer des notifications
      await Promise.all(
        users.map((user) =>
          prisma.notification.create({
            data: {
              userId: user.id,
              type: "formation_assigned",
              title: "Nouvelle formation assignée",
              message: `La formation "${
                bankFormation.formation.title
              }" vous a été assignée${mandatory ? " (obligatoire)" : ""}.`,
              data: JSON.stringify({
                formationId: bankFormation.formationId,
                bankId: bankFormation.bankId,
                mandatory,
              }),
            },
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `${assignments.length} utilisateurs assignés selon les critères`,
        data: {
          assignments,
          criteria,
          matchedUsers: users.length,
        },
      });
    } catch (error) {
      console.error("Erreur assignByCriteria:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Envoyer des rappels pour les formations en retard
  async sendReminders(req, res) {
    try {
      const { bankFormationId, reminderType = "overdue" } = req.body;

      // Trouver les utilisateurs en retard
      const overdueAssignments = await prisma.userFormationAssignment.findMany({
        where: {
          bankFormationId,
          completedAt: null,
          bankFormation: {
            dueDate: {
              lt: new Date(),
            },
          },
        },
        include: {
          user: true,
          bankFormation: {
            include: {
              formation: true,
            },
          },
        },
      });

      if (overdueAssignments.length === 0) {
        return res.json({
          success: true,
          message: "Aucun utilisateur en retard trouvé",
          data: { remindersSent: 0 },
        });
      }

      // Créer des notifications de rappel
      const reminders = await Promise.all(
        overdueAssignments.map((assignment) =>
          prisma.notification.create({
            data: {
              userId: assignment.userId,
              type: "formation_reminder",
              title: "Rappel de formation",
              message: `La formation "${
                assignment.bankFormation.formation.title
              }" était due le ${assignment.bankFormation.dueDate?.toLocaleDateString()}. Veuillez la terminer rapidement.`,
              data: JSON.stringify({
                formationId: assignment.bankFormation.formationId,
                bankFormationId,
                dueDate: assignment.bankFormation.dueDate,
                reminderType,
              }),
            },
          })
        )
      );

      res.json({
        success: true,
        message: `${reminders.length} rappels envoyés avec succès`,
        data: {
          remindersSent: reminders.length,
          overdueUsers: overdueAssignments.map((a) => ({
            id: a.user.id,
            name: `${a.user.firstName} ${a.user.lastName}`,
            email: a.user.email,
          })),
        },
      });
    } catch (error) {
      console.error("Erreur sendReminders:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },

  // Obtenir les statistiques d'assignation
  async getAssignmentStats(req, res) {
    try {
      const { bankFormationId } = req.params;

      const stats = await prisma.userFormationAssignment.groupBy({
        by: ["mandatory"],
        where: { bankFormationId },
        _count: {
          id: true,
        },
      });

      const completedStats = await prisma.userFormationAssignment.groupBy({
        by: ["mandatory"],
        where: {
          bankFormationId,
          completedAt: { not: null },
        },
        _count: {
          id: true,
        },
      });

      const overdueCount = await prisma.userFormationAssignment.count({
        where: {
          bankFormationId,
          completedAt: null,
          bankFormation: {
            dueDate: {
              lt: new Date(),
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          total: stats.reduce((sum, stat) => sum + stat._count.id, 0),
          mandatory: stats.find((s) => s.mandatory)?._count.id || 0,
          optional: stats.find((s) => !s.mandatory)?._count.id || 0,
          completed: completedStats.reduce(
            (sum, stat) => sum + stat._count.id,
            0
          ),
          overdue: overdueCount,
        },
      });
    } catch (error) {
      console.error("Erreur getAssignmentStats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
      });
    }
  },
};














