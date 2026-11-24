// Règles métier des comptes : création, connexion, jetons JWT.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { versUtilisateur } from '../conversions.js';
import { ErreurApi } from '../utils/erreurs.js';

// En production, un secret par défaut permettrait à n'importe qui de fabriquer des jetons : on refuse de démarrer.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET manquant dans server/.env');
}
const JWT_SECRET = process.env.JWT_SECRET || 'hackfest-dev-secret-a-changer';

/**
 * Le jeton ne contient que l'identifiant (sub) : le rôle est relu en base à chaque requête,
 * donc un changement de rôle s'applique tout de suite, sans attendre l'expiration du jeton.
 */
export function creerJeton(utilisateur) {
  return jwt.sign({ sub: utilisateur.id }, JWT_SECRET, { expiresIn: '7d' });
}

/** Crée un compte (participant par défaut, ou organisateur) et renvoie { token, user } */
export async function inscrire({ nom, email, password, universite, role }) {
  const emailNormalise = email.trim().toLowerCase();
  if (await prisma.utilisateur.findUnique({ where: { email: emailNormalise } })) {
    throw new ErreurApi(409, 'Un compte existe déjà avec cet e-mail.', { email: 'E-mail déjà utilisé.' });
  }
  const utilisateur = await prisma.utilisateur.create({
    data: {
      nom: nom.trim(),
      email: emailNormalise,
      universite: (universite || '').trim(),
      role: role === 'organisateur' ? 'organisateur' : 'participant',
      // bcrypt : hash lent + "sel" aléatoire ; le mot de passe lui-même n'est jamais stocké
      motDePasseHash: await bcrypt.hash(password, 10),
    },
  });
  return { token: creerJeton(utilisateur), user: versUtilisateur(utilisateur) };
}

/** Vérifie e-mail + mot de passe et renvoie { token, user } */
export async function connecter({ email, password }) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  const ok = utilisateur && (await bcrypt.compare(String(password), utilisateur.motDePasseHash));
  // Même message que l'e-mail existe ou non : on ne révèle pas quels comptes existent
  if (!ok) throw new ErreurApi(401, 'E-mail ou mot de passe incorrect.');
  return { token: creerJeton(utilisateur), user: versUtilisateur(utilisateur) };
}

/** Jeton JWT -> utilisateur (sans le hash du mot de passe) */
export async function utilisateurDepuisJeton(jeton) {
  let contenu;
  try {
    contenu = jwt.verify(jeton, JWT_SECRET);
  } catch {
    throw new ErreurApi(401, 'Session expirée, reconnecte-toi.');
  }
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: contenu.sub } });
  if (!utilisateur) throw new ErreurApi(401, 'Utilisateur introuvable.');
  return versUtilisateur(utilisateur);
}
