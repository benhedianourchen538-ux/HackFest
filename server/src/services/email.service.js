// Envoi des e-mails (Nodemailer).
// - SMTP_USER + SMTP_PASS dans server/.env : vrai envoi (Gmail par défaut : smtp.gmail.com, port 465).
// - Sinon, en développement : le contenu est affiché dans le terminal de l'API (pratique pour tester).
// - Pendant les tests automatiques (NODE_ENV=test) : rien n'est envoyé, les e-mails sont gardés en mémoire.
import nodemailer from 'nodemailer';
import { ErreurApi } from '../utils/erreurs.js';

const { SMTP_HOST = 'smtp.gmail.com', SMTP_PORT = '465', SMTP_USER, SMTP_PASS, EMAIL_EXPEDITEUR } = process.env;
const enTest = process.env.NODE_ENV === 'test';
const configure = Boolean(SMTP_USER && SMTP_PASS);

/** E-mails "envoyés" pendant les tests (les tests y lisent le code reçu) */
export const boiteDeTest = [];

let transport = null;
function obtenirTransport() {
  if (!transport) {
    transport = enTest
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465, // 465 = connexion chiffrée dès le départ
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
  }
  return transport;
}

async function envoyer({ a, sujet, texte, html }) {
  if (enTest) {
    await obtenirTransport().sendMail({ from: 'test@hackfest.tn', to: a, subject: sujet, text: texte });
    boiteDeTest.push({ a, sujet, texte });
    return;
  }
  if (!configure) {
    if (process.env.NODE_ENV === 'production') throw new ErreurApi(503, 'L’envoi d’e-mails n’est pas configuré sur le serveur.');
    console.log(`\n[e-mail non configuré : affiché ici au lieu d'être envoyé]\nÀ : ${a}\nSujet : ${sujet}\n${texte}\n`);
    return;
  }
  try {
    await obtenirTransport().sendMail({ from: EMAIL_EXPEDITEUR || `HackFest <${SMTP_USER}>`, to: a, subject: sujet, text: texte, html });
  } catch (err) {
    console.error('Échec de l’envoi de l’e-mail :', err.message);
    throw new ErreurApi(502, 'Impossible d’envoyer l’e-mail de vérification pour le moment. Réessaie dans quelques minutes.');
  }
}

/** Le nom vient de l'utilisateur : on neutralise < > & " ' avant de l'insérer dans le HTML de l'e-mail */
const echapperHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** E-mail contenant le code de vérification à 6 chiffres */
export function envoyerCodeVerification({ email, nom, code, minutes }) {
  const prenom = echapperHtml(nom.split(' ')[0]);
  const texte = `Bonjour ${prenom},

Voici ton code pour vérifier ton adresse e-mail sur HackFest :

    ${code}

Il est valable ${minutes} minutes. Si tu n'as pas créé de compte HackFest, ignore simplement cet e-mail.

L'équipe HackFest`;

  // Les e-mails ne lisent pas les classes Tailwind : couleurs de la palette écrites directement (navy, rouge, bleu glacé)
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#263445">
  <h1 style="color:#123B63;font-size:22px">Hack<span style="color:#D92735">Fest</span></h1>
  <p>Bonjour ${prenom},</p>
  <p>Voici ton code pour vérifier ton adresse e-mail :</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#123B63;background:#EAF3FA;padding:16px;text-align:center;border-radius:12px">${code}</p>
  <p>Il est valable <strong>${minutes} minutes</strong>.</p>
  <p style="font-size:13px;color:#64748b">Si tu n’as pas créé de compte HackFest, ignore simplement cet e-mail.</p>
</div>`;

  return envoyer({ a: email, sujet: `${code} : ton code de vérification HackFest`, texte, html });
}
