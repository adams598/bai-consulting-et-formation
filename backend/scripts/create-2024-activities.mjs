import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function create2024Activities() {
  try {
    console.log("🔄 Création d'activités avec des dates de 2024...");

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

    // Créer des activités avec des dates de 2024 (dernières 7 jours)
    const now = new Date("2024-12-22"); // Date fixe de 2024
    const oneWeekAgo = new Date("2024-12-15"); // 7 jours avant

    for (let i = 0; i < formations.length; i++) {
      const formation = formations[i];
      const randomDate = new Date(
        oneWeekAgo.getTime() +
          Math.random() * (now.getTime() - oneWeekAgo.getTime())
      );

      // Créer une nouvelle assignation avec une date de 2024
      const assignment = await prisma.formationAssignment.create({
        data: {
          userId: collaborator.id,
          formationId: formation.id,
          assignedBy: collaborator.id,
          status: "ASSIGNED",
          dueDate: new Date(randomDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          assignedAt: randomDate,
        },
      });

      console.log(
        `✅ Assignation créée pour "${
          formation.title
        }" (${randomDate.toLocaleDateString("fr-FR")})`
      );

      // Créer une progression récente
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

      // Créer un événement planifié récent
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
    }

    // Créer quelques notifications récentes
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

      console.log(
        `🔔 Notification créée: "${
          notification.title
        }" (${randomDate.toLocaleDateString("fr-FR")})`
      );
    }

    console.log("✅ Activités de 2024 créées avec succès !");
    console.log(`👤 Utilisateur: ${collaborator.email}`);
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

create2024Activities();
