import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Initialisation de la base de données...");

  // Créer les banques
  console.log("📊 Création des banques...");
  const banquePopulaire = await prisma.bank.upsert({
    where: { code: "BP" },
    update: {},
    create: {
      name: "Banque Populaire",
      code: "BP",
      isActive: true,
    },
  });

  const creditAgricole = await prisma.bank.upsert({
    where: { code: "CA" },
    update: {},
    create: {
      name: "Crédit Agricole",
      code: "CA",
      isActive: true,
    },
  });

  const bnpParibas = await prisma.bank.upsert({
    where: { code: "BNP" },
    update: {},
    create: {
      name: "BNP Paribas",
      code: "BNP",
      isActive: true,
    },
  });

  console.log("✅ Banques créées");

  // Créer l'utilisateur super admin
  console.log("👤 Création de l'utilisateur super admin...");
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@bai-consulting.com" },
    update: {},
    create: {
      email: "admin@bai-consulting.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "BAI",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Super admin créé");

  // Créer un admin de banque
  console.log("👤 Création d'un admin de banque...");
  const bankAdmin = await prisma.user.upsert({
    where: { email: "admin@banque-populaire.com" },
    update: {},
    create: {
      email: "admin@banque-populaire.com",
      password: hashedPassword,
      firstName: "Jean",
      lastName: "Dupont",
      role: "BANK_ADMIN",
      bankId: banquePopulaire.id,
      department: "Direction",
      isActive: true,
    },
  });

  console.log("✅ Admin de banque créé");

  // Créer des collaborateurs
  console.log("👥 Création des collaborateurs...");
  const collaborator1 = await prisma.user.upsert({
    where: { email: "marie.martin@banque-populaire.com" },
    update: {},
    create: {
      email: "marie.martin@banque-populaire.com",
      password: hashedPassword,
      firstName: "Marie",
      lastName: "Martin",
      role: "COLLABORATOR",
      bankId: banquePopulaire.id,
      department: "Accueil",
      isActive: true,
    },
  });

  const collaborator2 = await prisma.user.upsert({
    where: { email: "pierre.durand@banque-populaire.com" },
    update: {},
    create: {
      email: "pierre.durand@banque-populaire.com",
      password: hashedPassword,
      firstName: "Pierre",
      lastName: "Durand",
      role: "COLLABORATOR",
      bankId: banquePopulaire.id,
      department: "Conseil",
      isActive: true,
    },
  });

  console.log("✅ Collaborateurs créés");

  // Créer des formations
  console.log("📚 Création des formations...");
  const formation1 = await prisma.formation.create({
    data: {
      title: "Gestion des risques bancaires",
      description:
        "Formation complète sur la gestion des risques dans le secteur bancaire. Cette formation couvre les fondamentaux de la gestion des risques, les outils d'évaluation et les bonnes pratiques du secteur.",
      type: "VIDEO",
      duration: 120,
      isActive: true,
      isMandatory: false,
      createdBy: superAdmin.id,
      bankId: banquePopulaire.id,
      content: {
        create: [
          {
            title: "Introduction à la gestion des risques",
            description: "Vue d'ensemble des concepts fondamentaux",
            type: "VIDEO",
            order: 1,
            duration: 30,
            fileUrl: "https://example.com/video1.mp4",
            fileSize: 50000000,
          },
          {
            title: "Outils d'évaluation des risques",
            description: "Méthodes et outils pratiques",
            type: "SLIDE",
            order: 2,
            duration: 45,
            fileUrl: "https://example.com/slides1.pdf",
            fileSize: 2000000,
          },
          {
            title: "Cas pratiques",
            description: "Études de cas concrets",
            type: "DOCUMENT",
            order: 3,
            duration: 45,
            fileUrl: "https://example.com/cas-pratiques.pdf",
            fileSize: 1500000,
          },
        ],
      },
    },
  });

  const formation2 = await prisma.formation.create({
    data: {
      title: "Compliance bancaire",
      description:
        "Formation sur les règles de conformité et les bonnes pratiques du secteur bancaire. Cette formation aborde les aspects réglementaires et les obligations légales.",
      type: "SLIDES",
      duration: 90,
      isActive: true,
      isMandatory: true,
      createdBy: superAdmin.id,
      bankId: banquePopulaire.id,
      content: {
        create: [
          {
            title: "Cadre réglementaire",
            description: "Les principales réglementations",
            type: "SLIDE",
            order: 1,
            duration: 30,
            fileUrl: "https://example.com/reglementation.pdf",
            fileSize: 3000000,
          },
          {
            title: "Obligations de conformité",
            description: "Les obligations légales et réglementaires",
            type: "DOCUMENT",
            order: 2,
            duration: 30,
            fileUrl: "https://example.com/obligations.pdf",
            fileSize: 2500000,
          },
          {
            title: "Bonnes pratiques",
            description: "Mise en œuvre des bonnes pratiques",
            type: "VIDEO",
            order: 3,
            duration: 30,
            fileUrl: "https://example.com/bonnes-pratiques.mp4",
            fileSize: 40000000,
          },
        ],
      },
    },
  });

  const formation3 = await prisma.formation.create({
    data: {
      title: "Relation client avancée",
      description:
        "Techniques avancées de relation client et de vente dans le secteur bancaire. Cette formation développe les compétences commerciales et relationnelles.",
      type: "DOCUMENT",
      duration: 60,
      isActive: true,
      isMandatory: false,
      createdBy: superAdmin.id,
      bankId: banquePopulaire.id,
      content: {
        create: [
          {
            title: "Techniques de vente",
            description: "Méthodes et techniques de vente",
            type: "DOCUMENT",
            order: 1,
            duration: 30,
            fileUrl: "https://example.com/techniques-vente.pdf",
            fileSize: 1800000,
          },
          {
            title: "Gestion des objections",
            description: "Comment gérer les objections clients",
            type: "VIDEO",
            order: 2,
            duration: 30,
            fileUrl: "https://example.com/objections.mp4",
            fileSize: 35000000,
          },
        ],
      },
    },
  });

  console.log("✅ Formations créées");

  // Créer des assignations
  console.log("📋 Création des assignations...");
  await prisma.formationAssignment.createMany({
    data: [
      {
        formationId: formation1.id,
        userId: collaborator1.id,
        assignedBy: superAdmin.id,
        status: "PENDING",
      },
      {
        formationId: formation2.id,
        userId: collaborator1.id,
        assignedBy: superAdmin.id,
        status: "IN_PROGRESS",
      },
      {
        formationId: formation2.id,
        userId: collaborator2.id,
        assignedBy: superAdmin.id,
        status: "COMPLETED",
      },
    ],
  });

  console.log("✅ Assignations créées");

  // Créer des progressions
  console.log("📈 Création des progressions...");
  await prisma.userProgress.createMany({
    data: [
      {
        userId: collaborator1.id,
        formationId: formation1.id,
        progress: 0,
        timeSpent: 0,
      },
      {
        userId: collaborator1.id,
        formationId: formation2.id,
        progress: 50,
        timeSpent: 2700, // 45 minutes
      },
      {
        userId: collaborator2.id,
        formationId: formation2.id,
        progress: 100,
        timeSpent: 5400, // 90 minutes
      },
    ],
  });

  console.log("✅ Progressions créées");

  // Créer des notifications
  console.log("🔔 Création des notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: collaborator1.id,
        type: "FORMATION_ASSIGNED",
        title: "Nouvelle formation assignée",
        message:
          'La formation "Gestion des risques bancaires" vous a été assignée.',
        data: JSON.stringify({ formationId: formation1.id }),
      },
      {
        userId: collaborator1.id,
        type: "FORMATION_STARTED",
        title: "Formation commencée",
        message: 'Vous avez commencé la formation "Compliance bancaire".',
        data: JSON.stringify({ formationId: formation2.id }),
      },
      {
        userId: collaborator2.id,
        type: "FORMATION_COMPLETED",
        title: "Formation terminée",
        message:
          'Félicitations ! Vous avez terminé la formation "Compliance bancaire".',
        data: JSON.stringify({ formationId: formation2.id }),
      },
    ],
  });

  console.log("✅ Notifications créées");

  console.log("🎉 Initialisation terminée avec succès !");
  console.log("\n📋 Données créées :");
  console.log(`- ${await prisma.bank.count()} banques`);
  console.log(`- ${await prisma.user.count()} utilisateurs`);
  console.log(`- ${await prisma.formation.count()} formations`);
  console.log(`- ${await prisma.formationAssignment.count()} assignations`);
  console.log(`- ${await prisma.userProgress.count()} progressions`);
  console.log(`- ${await prisma.notification.count()} notifications`);

  console.log("\n🔑 Identifiants de test :");
  console.log("Super Admin: admin@bai-consulting.com / admin123");
  console.log("Admin Banque: admin@banque-populaire.com / admin123");
  console.log("Collaborateur 1: marie.martin@banque-populaire.com / admin123");
  console.log("Collaborateur 2: pierre.durand@banque-populaire.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'initialisation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
