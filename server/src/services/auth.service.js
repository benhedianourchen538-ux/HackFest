// Règles métier des comptes : création, vérification de l'e-mail par code, connexion, jetons JWT.
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { versUtilisateur } from '../conversions.js';
import { ErreurApi } from '../utils/erreurs.js';
import { envoyerCodeVerification } from './email.service.js';

// En production, un secret par défaut permettrait à n'importe qui de fabriquer des jetons : on refuse de démarrer.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET manquant dans server/.env');
}
const JWT_SECRET = process.env.JWT_SECRET || 'hackfest-dev-secret-a-changer';

export const DUREE_CODE_MINUTES = 15; // validité d'un code
export const ESSAIS_MAX = 5; // essais ratés autorisés pour un même code
export const DELAI_RENVOI_SECONDES = 60; // délai minimum entre deux envois de code

/**
 * Le jeton ne contient que l'identifiant (sub) : le rôle est relu en base à chaque requête,
 * donc un changement de rôle s'applique tout de suite, sans attendre l'expiration du jeton.
 */
export function creerJeton(utilisateur) {
  return jwt.sign({ sub: utilisateur.id }, JWT_SECRET, { expiresIn: '7d' });
}

// ---------- Code de vérification ----------

/** Le code n'est jamais stocké en clair : on garde son empreinte HMAC-SHA256 (signée avec JWT_SECRET) */
const hacherCode = (code) => createHmac('sha256', JWT_SECRET).update(code).digest('hex');

/** Comparaison en temps constant (ne révèle pas, par sa durée, combien de caractères sont justes) */
const memeCode = (hash1, hash2) => timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(hash2, 'hex'));

/**
 * Génère un nouveau code, l'enregistre (haché) et l'envoie par e-mail.
 * Ne fait rien si un code a été envoyé il y a moins de DELAI_RENVOI_SECONDES (anti-spam).
 */
async function envoyerNouveauCode(utilisateur) {
  const dernierEnvoi = utilisateur.codeEnvoyeLe?.getTime() ?? 0;
  if (Date.now() - dernierEnvoi < DELAI_RENVOI_SECONDES * 1000) return;

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0'); // hasard cryptographique, "000000" à "999999"
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: {
      codeVerificationHash: hacherCode(code),
      codeExpireLe: new Date(Date.now() + DUREE_CODE_MINUTES * 60 * 1000),
      codeTentatives: 0,
      codeEnvoyeLe: new Date(),
    },
  });
  try {
    await envoyerCodeVerification({ email: utilisateur.email, nom: utilisateur.nom, code, minutes: DUREE_CODE_MINUTES });
  } catch (err) {
    // E-mail non parti : on autorise un nouvel essai tout de suite
    await prisma.utilisateur.update({ where: { id: utilisateur.id }, data: { codeEnvoyeLe: null } });
    throw err;
  }
}

// ---------- Inscription, vérification, connexion ----------

/**
 * Crée un compte NON vérifié (participant par défaut, ou organisateur) et envoie le code par e-mail.
 * Aucun jeton n'est donné : il faut d'abord saisir le code (verifierEmail).
 * Si l'adresse existe mais n'a jamais été vérifiée, le compte est mis à jour et un nouveau code est envoyé.
 */
export async function inscrire({ nom, email, password, universite, role }) {
  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant?.emailVerifie) {
    throw new ErreurApi(409, 'Un compte existe déjà avec cet e-mail.', { email: 'E-mail déjà utilisé.' });
  }
  const donnees = {
    nom,
    universite,
    role: role === 'organisateur' ? 'organisateur' : 'participant',
    // bcrypt : hash lent + "sel" aléatoire ; le mot de passe lui-même n'est jamais stocké
    motDePasseHash: await bcrypt.hash(password, 10),
  };
  const utilisateur = existant
    ? await prisma.utilisateur.update({ where: { id: existant.id }, data: donnees })
    : await prisma.utilisateur.create({ data: { ...donnees, email } });

  await envoyerNouveauCode(utilisateur);
  return { message: `Un code de vérification a été envoyé à ${email}.`, email, verificationRequise: true };
}

/** Vérifie le code reçu par e-mail ; si c'est le bon, le compte est activé et l'utilisateur connecté */
export async function verifierEmail({ email, code }) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (utilisateur?.emailVerifie) throw new ErreurApi(400, 'Ton adresse est déjà vérifiée : connecte-toi.');
  // Compte inconnu ou aucun code en cours : même message, on ne révèle pas quels comptes existent
  if (!utilisateur?.codeVerificationHash) {
    throw new ErreurApi(400, 'Code incorrect ou expiré. Demande un nouveau code.', { code: 'Code incorrect ou expiré.' });
  }
  if (utilisateur.codeTentatives >= ESSAIS_MAX) {
    throw new ErreurApi(429, 'Trop d’essais avec ce code. Demande un nouveau code.', { code: 'Demande un nouveau code.' });
  }
  if (utilisateur.codeExpireLe < new Date()) {
    throw new ErreurApi(400, 'Ce code a expiré. Demande un nouveau code.', { code: 'Code expiré.' });
  }

  if (!memeCode(hacherCode(code), utilisateur.codeVerificationHash)) {
    const { codeTentatives } = await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { codeTentatives: { increment: 1 } }, // incrément fait par la base : fiable même avec des requêtes simultanées
    });
    const restants = ESSAIS_MAX - codeTentatives;
    if (restants <= 0) throw new ErreurApi(429, 'Trop d’essais avec ce code. Demande un nouveau code.', { code: 'Demande un nouveau code.' });
    throw new ErreurApi(400, `Code incorrect. Il te reste ${restants} essai${restants > 1 ? 's' : ''}.`, { code: 'Code incorrect.' });
  }

  // Bon code : compte vérifié, le code ne pourra plus resservir
  const verifie = await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { emailVerifie: true, codeVerificationHash: null, codeExpireLe: null, codeTentatives: 0 },
  });
  return { token: creerJeton(verifie), user: versUtilisateur(verifie) };
}

/** Renvoie un code. Réponse identique dans tous les cas : on ne révèle pas si l'adresse a un compte */
export async function renvoyerCode({ email }) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (utilisateur && !utilisateur.emailVerifie) await envoyerNouveauCode(utilisateur);
  return { message: 'Si un compte attend une vérification avec cette adresse, un nouveau code vient d’être envoyé.' };
}

/** Vérifie e-mail + mot de passe et renvoie { token, user } (seulement si l'adresse est vérifiée) */
export async function connecter({ email, password }) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  const ok = utilisateur && (await bcrypt.compare(String(password), utilisateur.motDePasseHash));
  // Même message que l'e-mail existe ou non : on ne révèle pas quels comptes existent
  if (!ok) throw new ErreurApi(401, 'E-mail ou mot de passe incorrect.');

  if (!utilisateur.emailVerifie) {
    // Bon mot de passe mais adresse pas encore vérifiée : on (r)envoie un code et le client affiche l'écran du code
    await envoyerNouveauCode(utilisateur);
    throw new ErreurApi(403, 'Ton adresse e-mail n’est pas encore vérifiée : saisis le code reçu par e-mail.', undefined, 'EMAIL_NON_VERIFIE');
  }
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
  if (!utilisateur || !utilisateur.emailVerifie) throw new ErreurApi(401, 'Utilisateur introuvable.');
  return versUtilisateur(utilisateur);
}
