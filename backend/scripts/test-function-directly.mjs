import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simuler la fonction getRecentActivities
async function getRecentActivities(userId, filter = "1week") {
  try {
    console.log("🔄 Test direct de getRecentActivities...");
    console.log("👤 UserId:", userId);
    console.log("📅 Filter:", filter);

    // Calculer la date de début selon le filtre
    let startDate;
    const now = new Date();

    switch (filter) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    console.log("📅 StartDate:", startDate.toISOString());
    console.log("📅 Now:", now.toISOString());

    const activities = [];

    // 1. Formations assignées récemment
    console.log("\n🔍 1. Formations assignées récemment");
    const recentAssignments = await prisma.formationAssignment.findMany({
      where: {
        userId,
        assignedAt: {
          gte: startDate,
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        assignedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: 10,
    });

    console.log(`✅ Assignations trouvées: ${recentAssignments.length}`);

    // Transformer les assignations en activités
    recentAssignments.forEach((assignment) => {
      activities.push({
        id: `assignment_${assignment.id}`,
        type: "formation_assigned",
        title: assignment.formation.title,
        description: `Nouvelle formation assignée`,
        timestamp: assignment.assignedAt.toISOString(),
        formationId: assignment.formation.id,
        assignedBy: assignment.assignedByUser
          ? {
              firstName: assignment.assignedByUser.firstName,
              lastName: assignment.assignedByUser.lastName,
            }
          : null,
        dueDate: assignment.dueDate,
      });
    });

    // 2. Progression récente (UserProgress)
    console.log("\n🔍 2. Progression récente");
    const recentProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        lastAccessedAt: {
          gte: startDate,
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: "desc",
      },
      take: 10,
    });

    console.log(`✅ Progressions trouvées: ${recentProgress.length}`);

    // Transformer les progressions en activités
    recentProgress.forEach((progress) => {
      let activityType = "formation_started";
      let description = "Formation démarrée";

      if (progress.progress === 100) {
        activityType = "formation_completed";
        description = "Formation terminée avec succès";
      } else if (progress.progress > 0) {
        activityType = "formation_started";
        description = `Progression: ${progress.progress}%`;
      }

      activities.push({
        id: `progress_${progress.id}`,
        type: activityType,
        title: progress.formation.title,
        description,
        timestamp: progress.lastAccessedAt.toISOString(),
        formationId: progress.formation.id,
        progressPercentage: progress.progress,
      });
    });

    // 3. Événements planifiés récemment
    console.log("\n🔍 3. Événements planifiés récemment");
    const recentEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`✅ Événements trouvés: ${recentEvents.length}`);

    // Transformer les événements en activités
    recentEvents.forEach((event) => {
      activities.push({
        id: `event_${event.id}`,
        type: "formation_scheduled",
        title: event.title,
        description: `Événement planifié pour le ${event.startDate.toLocaleDateString(
          "fr-FR"
        )}`,
        timestamp: event.createdAt.toISOString(),
        formationId: event.formationId,
        scheduledDate: event.startDate,
      });
    });

    // 4. Notifications récentes (si elles existent)
    console.log("\n🔍 4. Notifications récentes");
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`✅ Notifications trouvées: ${recentNotifications.length}`);

    // Transformer les notifications en activités
    recentNotifications.forEach((notification) => {
      activities.push({
        id: `notification_${notification.id}`,
        type: "notification",
        title: notification.title,
        description: notification.message,
        timestamp: notification.createdAt.toISOString(),
        isRead: notification.isRead,
      });
    });

    // Trier toutes les activités par timestamp (plus récent en premier)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limiter à 20 activités maximum
    const limitedActivities = activities.slice(0, 20);

    console.log(`\n✅ Total activités: ${limitedActivities.length}`);

    return {
      success: true,
      data: limitedActivities,
      filter,
      total: limitedActivities.length,
    };
  } catch (error) {
    console.error("❌ Erreur dans getRecentActivities:", error);
    throw error;
  }
}

async function testFunction() {
  try {
    // Trouver un utilisateur COLLABORATOR
    const user = await prisma.user.findFirst({
      where: {
        role: "COLLABORATOR",
      },
    });

    if (!user) {
      console.log("❌ Aucun utilisateur COLLABORATOR trouvé");
      return;
    }

    const result = await getRecentActivities(user.id, "1week");
    console.log("\n📊 Résultat final:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFunction();
