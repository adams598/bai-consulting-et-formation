import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkActivitiesData() {
  try {
    console.log("🔍 Vérification des données d'activités...");

    // Trouver l'utilisateur
    const user = await prisma.user.findFirst({
      where: {
        email: "mariline@bai.com",
      },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log("👤 Utilisateur:", user.email, "(ID:", user.id, ")");

    // Vérifier les assignations
    const assignments = await prisma.formationAssignment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        formation: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    console.log(`📚 Assignations trouvées: ${assignments.length}`);
    assignments.forEach((assignment) => {
      console.log(
        `   - ${
          assignment.formation.title
        } (${assignment.assignedAt.toLocaleDateString("fr-FR")})`
      );
    });

    // Vérifier les progressions
    const progressions = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
      },
      include: {
        formation: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: "desc",
      },
    });

    console.log(`📈 Progressions trouvées: ${progressions.length}`);
    progressions.forEach((progress) => {
      console.log(
        `   - ${progress.formation.title} (${
          progress.progress
        }%) - ${progress.lastAccessedAt.toLocaleDateString("fr-FR")}`
      );
    });

    // Vérifier les événements
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📅 Événements trouvés: ${events.length}`);
    events.forEach((event) => {
      console.log(
        `   - ${event.title} (${event.createdAt.toLocaleDateString("fr-FR")})`
      );
    });

    // Vérifier les notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`🔔 Notifications trouvées: ${notifications.length}`);
    notifications.forEach((notification) => {
      console.log(
        `   - ${
          notification.title
        } (${notification.createdAt.toLocaleDateString("fr-FR")})`
      );
    });

    // Vérifier les dates récentes (dernières 7 jours)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log(`\n📅 Période de recherche:`);
    console.log(`   - Maintenant: ${now.toLocaleDateString("fr-FR")}`);
    console.log(
      `   - Il y a 7 jours: ${oneWeekAgo.toLocaleDateString("fr-FR")}`
    );

    // Compter les activités récentes
    const recentAssignments = await prisma.formationAssignment.count({
      where: {
        userId: user.id,
        assignedAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const recentProgress = await prisma.userProgress.count({
      where: {
        userId: user.id,
        lastAccessedAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const recentEvents = await prisma.calendarEvent.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const recentNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    console.log(`\n📊 Activités récentes (7 derniers jours):`);
    console.log(`   - Assignations: ${recentAssignments}`);
    console.log(`   - Progressions: ${recentProgress}`);
    console.log(`   - Événements: ${recentEvents}`);
    console.log(`   - Notifications: ${recentNotifications}`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivitiesData();
