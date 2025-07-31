import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, BadRequestError } from '../utils/errors';

const prisma = new PrismaClient();

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '7d';

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'your-secret-key') {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production environment');
      }
      console.warn('⚠️  Using default JWT secret. Set JWT_SECRET environment variable for production.');
    }
    this.JWT_SECRET = secret || 'your-secret-key';
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    position?: string;
  }): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new BadRequestError('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    });

    // Générer le token JWT
    const token = this.generateToken(user);

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const token = this.generateToken(user);

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async validateToken(token: string): Promise<Omit<User, 'password'>> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        throw new UnauthorizedError('Utilisateur non trouvé');
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new UnauthorizedError('Token invalide');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedError('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Mot de passe actuel incorrect');
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      company?: string;
      position?: string;
      avatar?: string;
    }
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return;
    }

    // Générer un token de réinitialisation (expire dans 1 heure)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password-reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enregistrer le token dans la base de données (optionnel)
    // Pour l'instant, on simule juste l'envoi d'email
    console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);
    
    // TODO: Implémenter l'envoi d'email réel
    // await sendPasswordResetEmail(email, resetToken);
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }
} 