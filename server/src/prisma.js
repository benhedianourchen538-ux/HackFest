// Client Prisma unique pour toute l'API : il ouvre et réutilise les connexions à PostgreSQL (DATABASE_URL).
import './env.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
