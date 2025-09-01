const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// POST /api/admin/progress/save - Sauvegarder la progression
router.post('/save', async (req, res) => {
  try {
    const { lessonId, formationId, userId, currentPage, totalPages, timeSpent, progress, completed } = req.body;

    // Validation des données
    if (!lessonId || !formationId || !userId) {
      return res.status(400).json({ 
        error: 'Données manquantes', 
        required: ['lessonId', 'formationId', 'userId'] 
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que la leçon existe
    const lesson = await prisma.formationContent.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Leçon non trouvée' });
    }

    // Vérifier que la formation existe
    const formation = await prisma.formation.findUnique({
      where: { id: formationId }
    });

    if (!formation) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    // Créer ou mettre à jour la progression
    const progressData = {
      userId,
      lessonId,
      formationId,
      progress: Math.min(100, Math.max(0, progress || 0)), // Limiter entre 0 et 100
      currentPage: currentPage || null,
      totalPages: totalPages || null,
      currentTime: timeSpent || 0,
      totalTime: null, // Sera mis à jour si nécessaire
      lastPosition: JSON.stringify({
        currentPage,
        totalPages,
        timeSpent,
        progress,
        completed,
        timestamp: new Date().toISOString()
      }),
      lastAccessedAt: new Date(),
      isCompleted: completed || false,
      completedAt: completed ? new Date() : null
    };

    // Upsert (créer ou mettre à jour)
    const savedProgress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: progressData,
      create: {
        ...progressData,
        startedAt: new Date()
      }
    });

    console.log('📊 Progression sauvegardée:', {
      userId,
      lessonId,
      formationId,
      progress: savedProgress.progress,
      currentPage: savedProgress.currentPage,
      isCompleted: savedProgress.isCompleted
    });

    res.json({
      success: true,
      message: 'Progression sauvegardée avec succès',
      progress: savedProgress
    });

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la progression:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

// GET /api/admin/progress/get - Récupérer la progression
router.get('/get', async (req, res) => {
  try {
    const { lessonId, formationId, userId } = req.query;

    // Validation des paramètres
    if (!lessonId || !formationId || !userId) {
      return res.status(400).json({ 
        error: 'Paramètres manquants', 
        required: ['lessonId', 'formationId', 'userId'] 
      });
    }

    // Récupérer la progression
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            type: true
          }
        },
        formation: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!progress) {
      return res.json({
        success: true,
        message: 'Aucune progression trouvée',
        progress: null
      });
    }

    console.log('📊 Progression récupérée:', {
      userId,
      lessonId,
      formationId,
      progress: progress.progress,
      currentPage: progress.currentPage,
      isCompleted: progress.isCompleted
    });

    res.json({
      success: true,
      message: 'Progression récupérée avec succès',
      progress: {
        id: progress.id,
        userId: progress.userId,
        lessonId: progress.lessonId,
        formationId: progress.formationId,
        progress: progress.progress,
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        currentTime: progress.currentTime,
        totalTime: progress.totalTime,
        lastPosition: progress.lastPosition ? JSON.parse(progress.lastPosition) : null,
        startedAt: progress.startedAt,
        lastAccessedAt: progress.lastAccessedAt,
        completedAt: progress.completedAt,
        isCompleted: progress.isCompleted,
        lesson: progress.lesson,
        formation: progress.formation
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la progression:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

// GET /api/admin/progress/user/:userId - Récupérer toutes les progressions d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { formationId } = req.query;

    // Validation des paramètres
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur manquant' });
    }

    // Construire la requête
    const where = { userId };
    if (formationId) {
      where.formationId = formationId;
    }

    // Récupérer toutes les progressions
    const progressions = await prisma.userProgress.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            type: true,
            contentType: true
          }
        },
        formation: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { formationId: 'asc' },
        { lessonId: 'asc' }
      ]
    });

    console.log(`📊 ${progressions.length} progressions récupérées pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Progressions récupérées avec succès',
      count: progressions.length,
      progressions: progressions.map(p => ({
        id: p.id,
        userId: p.userId,
        lessonId: p.lessonId,
        formationId: p.formationId,
        progress: p.progress,
        currentPage: p.currentPage,
        totalPages: p.totalPages,
        currentTime: p.currentTime,
        totalTime: p.totalTime,
        lastPosition: p.lastPosition ? JSON.parse(p.lastPosition) : null,
        startedAt: p.startedAt,
        lastAccessedAt: p.lastAccessedAt,
        completedAt: p.completedAt,
        isCompleted: p.isCompleted,
        lesson: p.lesson,
        formation: p.formation
      }))
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des progressions:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

module.exports = router;
