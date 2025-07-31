import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  // Erreurs Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'Une ressource avec ces données existe déjà'
        });
      case 'P2025':
        return res.status(404).json({
          code: 'RECORD_NOT_FOUND',
          message: 'Ressource non trouvée'
        });
      default:
        return res.status(500).json({
          code: 'DATABASE_ERROR',
          message: 'Une erreur est survenue lors de l\'accès à la base de données'
        });
    }
  }

  // Erreurs de validation Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides'
    });
  }

  // Erreurs personnalisées
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message
    });
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Token invalide'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 'TOKEN_EXPIRED',
      message: 'Token expiré'
    });
  }

  // Erreurs par défaut
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Une erreur inattendue est survenue'
  });
} 