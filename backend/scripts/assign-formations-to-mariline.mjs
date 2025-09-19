import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignFormationsToMariline() {
  try {
    console.log(
      "🎯 Début de l'assignation des formations à mariline@bai.com..."
    );

    // 1. Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: "mariline@bai.com" },
      include: { bank: true },
    });

    if (!user) {
      console.log("❌ Utilisateur mariline@bai.com non trouvé");
      console.log("📝 Création de l'utilisateur...");

      // Créer l'utilisateur s'il n'existe pas
      const newUser = await prisma.user.create({
        data: {
          email: "mariline@bai.com",
          password:
            "$2b$10$rQJZjP7QvQJ9YQJ9YQJ9YO7QvQJ9YQJ9YQJ9YQJ9YQJ9YQJ9YQJ9Y", // admin123
          firstName: "Mariline",
          lastName: "Test",
          role: "COLLABORATOR",
          department: "Formation",
          isActive: true,
        },
      });

      console.log("✅ Utilisateur créé:", newUser.email);
      user = newUser;
    } else {
      console.log("✅ Utilisateur trouvé:", user.email, "- Rôle:", user.role);
    }

    // 2. Récupérer les formations disponibles
    const formations = await prisma.formation.findMany({
      where: { isActive: true },
      take: 5, // Limiter à 5 formations pour la démo
      orderBy: { createdAt: "desc" },
    });

    console.log(`📚 ${formations.length} formations trouvées pour assignation`);

    if (formations.length === 0) {
      console.log("❌ Aucune formation disponible");
      return;
    }

    // 3. Récupérer un admin pour faire l'assignation
    const admin = await prisma.user.findFirst({
      where: {
        role: { in: ["SUPER_ADMIN", "BANK_ADMIN"] },
        isActive: true,
      },
    });

    if (!admin) {
      console.log("❌ Aucun admin trouvé pour faire l'assignation");
      return;
    }

    console.log("👨‍💼 Admin assignateur:", admin.email);

    // 4. Supprimer les assignations existantes pour éviter les doublons
    await prisma.formationAssignment.deleteMany({
      where: { userId: user.id },
    });

    console.log("🧹 Anciennes assignations supprimées");

    // 5. Créer les nouvelles assignations
    const assignationsData = formations.map((formation, index) => {
      const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];
      const status = statuses[index % statuses.length];

      // Dates d'échéance variées
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (30 + index * 15)); // 30, 45, 60 jours...

      return {
        userId: user.id,
        formationId: formation.id,
        assignedBy: admin.id,
        status,
        dueDate,
        // isMandatory n'existe pas dans FormationAssignment
        assignedAt: new Date(),
      };
    });

    const assignations = await prisma.formationAssignment.createMany({
      data: assignationsData,
    });

    console.log(`✅ ${assignations.count} formations assignées avec succès !`);

    // 6. Créer des progressions simulées pour certaines formations
    for (let i = 0; i < formations.length; i++) {
      const formation = formations[i];
      const assignment = assignationsData[i];

      // Récupérer le contenu de la formation
      const lessons = await prisma.formationContent.findMany({
        where: {
          formationId: formation.id,
          contentType: "LESSON",
        },
        orderBy: { order: "asc" },
      });

      if (lessons.length > 0) {
        // Créer des progressions pour simuler l'avancement
        const progressesToCreate = [];

        if (assignment.status === "IN_PROGRESS") {
          // Compléter 50% des leçons
          const lessonsToComplete = Math.floor(lessons.length * 0.5);
          for (let j = 0; j < lessonsToComplete; j++) {
            progressesToCreate.push({
              userId: user.id,
              lessonId: lessons[j].id,
              formationId: formation.id,
              progress: 100,
              isCompleted: true,
              completedAt: new Date(),
              startedAt: new Date(Date.now() - (j + 1) * 24 * 60 * 60 * 1000), // Étalé sur plusieurs jours
            });
          }
        } else if (assignment.status === "COMPLETED") {
          // Compléter toutes les leçons
          lessons.forEach((lesson, j) => {
            progressesToCreate.push({
              userId: user.id,
              lessonId: lesson.id,
              formationId: formation.id,
              progress: 100,
              isCompleted: true,
              completedAt: new Date(
                Date.now() - (lessons.length - j) * 24 * 60 * 60 * 1000
              ),
              startedAt: new Date(
                Date.now() - (lessons.length - j + 1) * 24 * 60 * 60 * 1000
              ),
            });
          });
        }

        if (progressesToCreate.length > 0) {
          await prisma.userProgress.createMany({
            data: progressesToCreate,
          });
          console.log(
            `📈 ${progressesToCreate.length} progressions créées pour "${formation.title}"`
          );
        }
      }
    }

    // 7. Créer quelques notifications de test
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          title: "Nouvelles formations assignées",
          message: `${formations.length} nouvelles formations vous ont été assignées.`,
          type: "INFO",
          isRead: false,
          // relatedFormationId n'existe pas dans le modèle
        },
        {
          userId: user.id,
          title: "Formation en cours",
          message: `N'oubliez pas de continuer votre formation "${formations[1]?.title}".`,
          type: "INFO",
          isRead: false,
          // relatedFormationId n'existe pas dans le modèle
        },
      ],
    });

    console.log("🔔 Notifications de test créées");

    // 8. Afficher un résumé
    console.log("\n🎉 ASSIGNATION TERMINÉE !");
    console.log("📊 RÉSUMÉ :");
    console.log(
      `👤 Utilisateur: ${user.email} (${user.firstName} ${user.lastName})`
    );
    console.log(`📚 Formations assignées: ${formations.length}`);

    assignationsData.forEach((assignment, index) => {
      console.log(
        `  ${index + 1}. ${formations[index].title} - ${assignment.status}`
      );
    });

    console.log(
      "\n🚀 L'utilisateur peut maintenant se connecter et voir ses formations !"
    );
    console.log("🔑 Identifiants de test:");
    console.log("   Email: mariline@bai.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Erreur lors de l'assignation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignFormationsToMariline();
