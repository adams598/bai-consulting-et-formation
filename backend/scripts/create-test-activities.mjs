import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestActivities() {
  try {
    console.log("🔄 Création des activités de test...");

    // Trouver un utilisateur COLLABORATOR
    const collaborator = await prisma.user.findFirst({
      where: {
        role: "COLLABORATOR",
      },
    });

    if (!collaborator) {
      console.log("❌ Aucun utilisateur COLLABORATOR trouvé");
      return;
    }

    console.log("👤 Utilisateur trouvé:", collaborator.email);

    // Trouver quelques formations
    const formations = await prisma.formation.findMany({
      take: 3,
    });

    if (formations.length === 0) {
      console.log("❌ Aucune formation trouvée");
      return;
    }

    console.log("📚 Formations trouvées:", formations.length);

    // Créer des assignations récentes (dernières 7 jours)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < formations.length; i++) {
      const formation = formations[i];
      const randomDate = new Date(
        oneWeekAgo.getTime() +
          Math.random() * (now.getTime() - oneWeekAgo.getTime())
      );

      // Vérifier si l'assignation existe déjà
      const existingAssignment = await prisma.formationAssignment.findUnique({
        where: {
          userId_formationId: {
            userId: collaborator.id,
            formationId: formation.id,
          },
        },
      });

      if (!existingAssignment) {
        // Créer une assignation
        const assignment = await prisma.formationAssignment.create({
          data: {
            userId: collaborator.id,
            formationId: formation.id,
            assignedBy: collaborator.id, // Auto-assigné pour le test
            status: "ASSIGNED",
            dueDate: new Date(randomDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 jours après assignation
            assignedAt: randomDate,
          },
        });

        console.log(`✅ Assignation créée pour "${formation.title}"`);
      } else {
        console.log(`ℹ️ Assignation existante pour "${formation.title}"`);
      }

      // Créer une progression pour certaines formations
      if (Math.random() > 0.3) {
        const progressPercentage = Math.floor(Math.random() * 100);

        // Trouver une leçon de cette formation
        const lesson = await prisma.formationContent.findFirst({
          where: {
            formationId: formation.id,
          },
        });

        if (lesson) {
          await prisma.userProgress.create({
            data: {
              userId: collaborator.id,
              formationId: formation.id,
              lessonId: lesson.id,
              progress: progressPercentage,
              lastAccessedAt: new Date(
                randomDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
              ),
              isCompleted: progressPercentage === 100,
              completedAt:
                progressPercentage === 100
                  ? new Date(
                      randomDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
                    )
                  : null,
            },
          });

          console.log(
            `📈 Progression créée: ${progressPercentage}% pour "${formation.title}"`
          );
        }
      }

      // Créer un événement planifié pour certaines formations
      if (Math.random() > 0.5) {
        const eventDate = new Date(
          randomDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
        );

        await prisma.calendarEvent.create({
          data: {
            userId: collaborator.id,
            title: `Formation: ${formation.title}`,
            description: `Session de formation planifiée`,
            startDate: eventDate,
            endDate: new Date(eventDate.getTime() + 2 * 60 * 60 * 1000), // 2 heures
            type: "FORMATION",
            formationId: formation.id,
            isAllDay: false,
            createdAt: randomDate,
          },
        });

        console.log(`📅 Événement créé pour "${formation.title}"`);
      }
    }

    // Créer quelques notifications
    const notifications = [
      {
        title: "Nouvelle formation assignée",
        message: "Une nouvelle formation vous a été assignée",
        type: "FORMATION_ASSIGNED",
      },
      {
        title: "Rappel de formation",
        message: "N'oubliez pas de terminer votre formation en cours",
        type: "FORMATION_REMINDER",
      },
      {
        title: "Formation terminée",
        message: "Félicitations ! Vous avez terminé une formation",
        type: "FORMATION_COMPLETED",
      },
    ];

    for (const notification of notifications) {
      const randomDate = new Date(
        oneWeekAgo.getTime() +
          Math.random() * (now.getTime() - oneWeekAgo.getTime())
      );

      await prisma.notification.create({
        data: {
          userId: collaborator.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: Math.random() > 0.5,
          createdAt: randomDate,
        },
      });

      console.log(`🔔 Notification créée: "${notification.title}"`);
    }

    console.log("✅ Activités de test créées avec succès !");
    console.log(`👤 Utilisateur: ${collaborator.email}`);
    console.log(`📚 Formations: ${formations.length}`);
    console.log(
      `📅 Période: ${oneWeekAgo.toLocaleDateString(
        "fr-FR"
      )} - ${now.toLocaleDateString("fr-FR")}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création des activités:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestActivities();
