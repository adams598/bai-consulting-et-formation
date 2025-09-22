import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createRecentTestActivities() {
  try {
    console.log("🔄 Création d'activités de test récentes...");

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
      take: 5,
    });

    if (formations.length === 0) {
      console.log("❌ Aucune formation trouvée");
      return;
    }

    console.log("📚 Formations trouvées:", formations.length);

    const now = new Date();

    // Créer des activités pour différents filtres de temps
    const timeFilters = [
      { name: "24h", hours: 24 },
      { name: "1week", days: 7 },
      { name: "1month", days: 30 },
    ];

    for (const filter of timeFilters) {
      console.log(`\n📅 Création d'activités pour le filtre: ${filter.name}`);

      let startDate;
      if (filter.hours) {
        startDate = new Date(now.getTime() - filter.hours * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - filter.days * 24 * 60 * 60 * 1000);
      }

      // Créer quelques assignations pour ce filtre
      for (let i = 0; i < 2; i++) {
        const formation = formations[i % formations.length];
        const randomDate = new Date(
          startDate.getTime() +
            Math.random() * (now.getTime() - startDate.getTime())
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
          await prisma.formationAssignment.create({
            data: {
              userId: collaborator.id,
              formationId: formation.id,
              assignedBy: collaborator.id,
              status: "ASSIGNED",
              dueDate: new Date(
                randomDate.getTime() + 30 * 24 * 60 * 60 * 1000
              ),
              assignedAt: randomDate,
            },
          });

          console.log(
            `✅ Assignation créée pour "${
              formation.title
            }" (${randomDate.toLocaleDateString("fr-FR")})`
          );
        } else {
          // Mettre à jour la date d'assignation
          await prisma.formationAssignment.update({
            where: {
              id: existingAssignment.id,
            },
            data: {
              assignedAt: randomDate,
            },
          });

          console.log(
            `🔄 Assignation mise à jour pour "${
              formation.title
            }" (${randomDate.toLocaleDateString("fr-FR")})`
          );
        }

        // Créer une progression
        const lesson = await prisma.formationContent.findFirst({
          where: {
            formationId: formation.id,
          },
        });

        if (lesson) {
          const progressPercentage = Math.floor(Math.random() * 100);

          // Vérifier si la progression existe déjà
          const existingProgress = await prisma.userProgress.findUnique({
            where: {
              userId_lessonId: {
                userId: collaborator.id,
                lessonId: lesson.id,
              },
            },
          });

          if (!existingProgress) {
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
                        randomDate.getTime() +
                          Math.random() * 24 * 60 * 60 * 1000
                      )
                    : null,
              },
            });

            console.log(
              `📈 Progression créée: ${progressPercentage}% pour "${formation.title}"`
            );
          } else {
            // Mettre à jour la progression existante
            await prisma.userProgress.update({
              where: {
                id: existingProgress.id,
              },
              data: {
                progress: progressPercentage,
                lastAccessedAt: new Date(
                  randomDate.getTime() + Math.random() * 24 * 60 * 60 * 1000
                ),
                isCompleted: progressPercentage === 100,
                completedAt:
                  progressPercentage === 100
                    ? new Date(
                        randomDate.getTime() +
                          Math.random() * 24 * 60 * 60 * 1000
                      )
                    : null,
              },
            });

            console.log(
              `🔄 Progression mise à jour: ${progressPercentage}% pour "${formation.title}"`
            );
          }
        }

        // Créer un événement planifié
        const eventDate = new Date(
          randomDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
        );

        await prisma.calendarEvent.create({
          data: {
            userId: collaborator.id,
            title: `Formation: ${formation.title}`,
            description: `Session de formation planifiée`,
            startDate: eventDate,
            endDate: new Date(eventDate.getTime() + 2 * 60 * 60 * 1000),
            type: "FORMATION",
            formationId: formation.id,
            isAllDay: false,
            createdAt: randomDate,
          },
        });

        console.log(
          `📅 Événement créé pour "${
            formation.title
          }" (${randomDate.toLocaleDateString("fr-FR")})`
        );
      }

      // Créer quelques notifications pour ce filtre
      const notifications = [
        {
          title: `Nouvelle formation assignée (${filter.name})`,
          message: "Une nouvelle formation vous a été assignée",
          type: "FORMATION_ASSIGNED",
        },
        {
          title: `Rappel de formation (${filter.name})`,
          message: "N'oubliez pas de terminer votre formation en cours",
          type: "FORMATION_REMINDER",
        },
      ];

      for (const notification of notifications) {
        const randomDate = new Date(
          startDate.getTime() +
            Math.random() * (now.getTime() - startDate.getTime())
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

        console.log(
          `🔔 Notification créée: "${
            notification.title
          }" (${randomDate.toLocaleDateString("fr-FR")})`
        );
      }
    }

    console.log("\n✅ Activités de test créées avec succès !");
    console.log(`👤 Utilisateur: ${collaborator.email}`);
    console.log(`📅 Période: ${now.toLocaleDateString("fr-FR")}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création des activités:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createRecentTestActivities();
