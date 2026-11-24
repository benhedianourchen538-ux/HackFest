// Exécuté avant chaque fichier de test (setupFiles), AVANT l'import de l'application :
// Prisma lira donc la base de test, et la limite générale de requêtes est désactivée.
import { adresseBaseTest } from './base.js';

process.env.DATABASE_URL = adresseBaseTest();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secret-des-tests';
