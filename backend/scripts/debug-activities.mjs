import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugActivities() {
  try {
    console.log("🔍 Debug des activités récentes...");

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

    console.log("👤 Utilisateur trouvé:", user.email, "(ID:", user.id, ")");

    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log(
      "📅 Période:",
      startDate.toLocaleDateString("fr-FR"),
      "-",
      now.toLocaleDateString("fr-FR")
    );

    // Test 1: Formations assignées récemment
    console.log("\n🔍 Test 1: Formations assignées récemment");
    try {
      const recentAssignments = await prisma.formationAssignment.findMany({
        where: {
          userId: user.id,
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
      recentAssignments.forEach((assignment) => {
        console.log(
          `   - ${
            assignment.formation.title
          } (${assignment.assignedAt.toLocaleDateString("fr-FR")})`
        );
      });
    } catch (error) {
      console.error("❌ Erreur assignations:", error.message);
    }

    // Test 2: Progression récente
    console.log("\n🔍 Test 2: Progression récente");
    try {
      const recentProgress = await prisma.userProgress.findMany({
        where: {
          userId: user.id,
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
      recentProgress.forEach((progress) => {
        console.log(
          `   - ${progress.formation.title} (${
            progress.progress
          }%) - ${progress.lastAccessedAt.toLocaleDateString("fr-FR")}`
        );
      });
    } catch (error) {
      console.error("❌ Erreur progressions:", error.message);
    }

    // Test 3: Événements récents
    console.log("\n🔍 Test 3: Événements récents");
    try {
      const recentEvents = await prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
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
      recentEvents.forEach((event) => {
        console.log(
          `   - ${event.title} (${event.createdAt.toLocaleDateString("fr-FR")})`
        );
      });
    } catch (error) {
      console.error("❌ Erreur événements:", error.message);
    }

    // Test 4: Notifications récentes
    console.log("\n🔍 Test 4: Notifications récentes");
    try {
      const recentNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
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
      recentNotifications.forEach((notification) => {
        console.log(
          `   - ${
            notification.title
          } (${notification.createdAt.toLocaleDateString("fr-FR")})`
        );
      });
    } catch (error) {
      console.error("❌ Erreur notifications:", error.message);
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugActivities();
