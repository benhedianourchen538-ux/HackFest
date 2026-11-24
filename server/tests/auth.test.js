// Tests de l'authentification : inscription (mot de passe fort), vérification de l'e-mail par code,
// connexion, jeton, rôles, limites de tentatives.
import { MOT_DE_PASSE, api, boiteDeTest, creerCompte, dernierCode, prisma, viderBase } from './aide.js';

beforeAll(viderBase);
afterAll(() => prisma.$disconnect());

let numero = 0;
/** Inscrit une nouvelle adresse (sans la vérifier) et renvoie { email, res } */
async function inscrire(changements = {}) {
  numero += 1;
  const email = `inscrit-${numero}-${Date.now()}@test.tn`;
  const res = await api().post('/api/auth/register').send({ nom: 'Amira Ben Ali', email, password: MOT_DE_PASSE, ...changements });
  return { email, res };
}
const verifier = (email, code) => api().post('/api/auth/verifier-email').send({ email, code });

describe('POST /api/auth/register : règles du mot de passe', () => {
  test.each([
    ['court1!A', null], // 8 caractères avec tout : accepté
    ['motdepasse', 'une majuscule, un chiffre, un symbole'],
    ['MOTDEPASSE1!', 'une minuscule'],
    ['Motdepasse!', 'un chiffre'],
    ['Motdepasse1', 'un symbole'],
    ['Ab1!', '8 caractères minimum'],
  ])('mot de passe « %s »', async (password, manque) => {
    const { res } = await inscrire({ password });

    if (manque === null) {
      expect(res.status).toBe(201);
    } else {
      expect(res.status).toBe(400);
      expect(res.body.errors.password).toContain(manque);
    }
  });

  test('refuse un mot de passe de plus de 72 caractères (limite de bcrypt)', async () => {
    const { res } = await inscrire({ password: `Aa1!${'x'.repeat(70)}` });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBe('72 caractères maximum.');
  });
});

describe('POST /api/auth/register : création du compte', () => {
  test('crée un compte NON vérifié, ne donne pas de jeton et envoie un code à 6 chiffres', async () => {
    const avant = boiteDeTest.length;
    const { email, res } = await inscrire();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email, verificationRequise: true });
    expect(res.body.token).toBeUndefined();
    expect(boiteDeTest.length).toBe(avant + 1);
    expect(dernierCode(email)).toMatch(/^\d{6}$/);
    const enBase = await prisma.utilisateur.findUnique({ where: { email } });
    expect(enBase.emailVerifie).toBe(false);
  });

  test('stocke le mot de passe haché avec bcrypt et le code haché (jamais en clair)', async () => {
    const { email } = await inscrire();
    const enBase = await prisma.utilisateur.findUnique({ where: { email } });

    expect(enBase.motDePasseHash).toMatch(/^\$2[aby]\$10\$/);
    expect(enBase.codeVerificationHash).toMatch(/^[0-9a-f]{64}$/);
    expect(enBase.codeVerificationHash).not.toContain(dernierCode(email));
  });

  test('normalise l’e-mail et refuse un compte admin', async () => {
    const majuscules = await api().post('/api/auth/register').send({ nom: 'Sami Test', email: ' Sami@Test.TN ', password: MOT_DE_PASSE });
    const admin = await inscrire({ role: 'admin' });

    expect(majuscules.body.email).toBe('sami@test.tn');
    expect(admin.res.status).toBe(400);
    expect(admin.res.body.errors.role).toBeDefined();
  });

  test('refuse un e-mail déjà utilisé par un compte vérifié (409)', async () => {
    const { email } = await creerCompte();
    const res = await api().post('/api/auth/register').send({ nom: 'Autre', email, password: MOT_DE_PASSE });

    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBe('E-mail déjà utilisé.');
  });

  test('une adresse jamais vérifiée peut se réinscrire (nouveau nom, nouveau code)', async () => {
    const { email } = await inscrire();
    await prisma.utilisateur.update({ where: { email }, data: { codeEnvoyeLe: new Date(Date.now() - 120_000) } });
    const res = await api().post('/api/auth/register').send({ nom: 'Nouveau Nom', email, password: MOT_DE_PASSE });

    expect(res.status).toBe(201);
    expect((await prisma.utilisateur.findUnique({ where: { email } })).nom).toBe('Nouveau Nom');
  });

  test('permet de choisir le rôle organisateur', async () => {
    const { email } = await inscrire({ role: 'organisateur' });
    const res = await verifier(email, dernierCode(email));

    expect(res.body.user.role).toBe('organisateur');
  });
});

describe('POST /api/auth/verifier-email', () => {
  test('le bon code active le compte et connecte l’utilisateur', async () => {
    const { email } = await inscrire();
    const res = await verifier(email, dernierCode(email));

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
    expect((await prisma.utilisateur.findUnique({ where: { email } })).emailVerifie).toBe(true);
  });

  test('accepte le code avec des espaces (« 123 456 ») et ne peut pas resservir', async () => {
    const { email } = await inscrire();
    const code = dernierCode(email);
    const res = await verifier(email, `${code.slice(0, 3)} ${code.slice(3)}`);
    const encore = await verifier(email, code);

    expect(res.status).toBe(200);
    expect(encore.status).toBe(400);
    expect(encore.body.message).toMatch(/déjà vérifiée/);
  });

  test('un mauvais code indique le nombre d’essais restants', async () => {
    const { email } = await inscrire();
    const faux = dernierCode(email) === '000000' ? '111111' : '000000';
    const res = await verifier(email, faux);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Code incorrect. Il te reste 4 essais.');
  });

  test('après 5 mauvais codes, même le bon code est refusé (429)', async () => {
    const { email } = await inscrire();
    const bon = dernierCode(email);
    const faux = bon === '000000' ? '111111' : '000000';
    const statuts = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      statuts.push((await verifier(email, faux)).status);
    }
    const res = await verifier(email, bon);

    expect(statuts).toEqual([400, 400, 400, 400, 429]);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/nouveau code/);
  });

  test('un code expiré (plus de 15 minutes) est refusé', async () => {
    const { email } = await inscrire();
    await prisma.utilisateur.update({ where: { email }, data: { codeExpireLe: new Date(Date.now() - 1000) } });
    const res = await verifier(email, dernierCode(email));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expiré/);
  });

  test('refuse un code mal formé et une adresse inconnue, sans révéler si le compte existe', async () => {
    const malForme = await verifier('qui@test.tn', '12ab');
    const inconnu = await verifier('personne@test.tn', '123456');

    expect(malForme.status).toBe(400);
    expect(malForme.body.message).toBe('Saisis le code à 6 chiffres.');
    expect(inconnu.status).toBe(400);
    expect(inconnu.body.message).toMatch(/incorrect ou expiré/);
  });
});

describe('POST /api/auth/renvoyer-code', () => {
  test('réponse identique que l’adresse existe ou non', async () => {
    const { email } = await inscrire();
    const existe = await api().post('/api/auth/renvoyer-code').send({ email });
    const inconnu = await api().post('/api/auth/renvoyer-code').send({ email: 'personne@test.tn' });

    expect(existe.status).toBe(200);
    expect(existe.body.message).toBe(inconnu.body.message);
  });

  test('pas de nouvel envoi avant 60 secondes ; ensuite un nouveau code remplace l’ancien', async () => {
    const { email } = await inscrire();
    const ancien = dernierCode(email);
    const avant = boiteDeTest.length;
    await api().post('/api/auth/renvoyer-code').send({ email });
    expect(boiteDeTest.length).toBe(avant); // trop tôt : rien n'est envoyé

    await prisma.utilisateur.update({ where: { email }, data: { codeEnvoyeLe: new Date(Date.now() - 61_000) } });
    await api().post('/api/auth/renvoyer-code').send({ email });
    const nouveau = dernierCode(email);
    expect(boiteDeTest.length).toBe(avant + 1);

    if (nouveau !== ancien) expect((await verifier(email, ancien)).status).toBe(400);
    expect((await verifier(email, nouveau)).status).toBe(200);
  });
});

describe('POST /api/auth/login', () => {
  let compte;
  beforeAll(async () => {
    compte = await creerCompte();
  });

  test('connecte un compte vérifié (e-mail sans tenir compte des majuscules)', async () => {
    const res = await api().post('/api/auth/login').send({ email: compte.email.toUpperCase(), password: MOT_DE_PASSE });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toMatch(/motDePasseHash|codeVerificationHash|Hackfest#2026/);
  });

  test('refuse un compte non vérifié avec le code EMAIL_NON_VERIFIE (403) et renvoie un code', async () => {
    const { email } = await inscrire();
    await prisma.utilisateur.update({ where: { email }, data: { codeEnvoyeLe: new Date(Date.now() - 61_000) } });
    const avant = boiteDeTest.length;
    const res = await api().post('/api/auth/login').send({ email, password: MOT_DE_PASSE });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NON_VERIFIE');
    expect(res.body.token).toBeUndefined();
    expect(boiteDeTest.length).toBe(avant + 1);
  });

  test('compte non vérifié + mauvais mot de passe : 401, sans rien révéler', async () => {
    const { email } = await inscrire();
    const res = await api().post('/api/auth/login').send({ email, password: 'Mauvais#123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBeUndefined();
  });

  test('même message d’erreur que le compte existe ou non', async () => {
    const mauvais = await api().post('/api/auth/login').send({ email: compte.email, password: 'mauvais' });
    const inconnu = await api().post('/api/auth/login').send({ email: 'inconnu@test.tn', password: 'mauvais' });

    expect(mauvais.status).toBe(401);
    expect(mauvais.body.message).toBe(inconnu.body.message);
  });

  test('bloque après 5 échecs en 15 minutes (429), même avec le bon mot de passe ensuite', async () => {
    const { email } = await creerCompte();
    const statuts = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      statuts.push((await api().post('/api/auth/login').send({ email, password: 'mauvais' })).status);
    }
    const bloque = await api().post('/api/auth/login').send({ email, password: MOT_DE_PASSE });

    expect(statuts).toEqual([401, 401, 401, 401, 401]);
    expect(bloque.status).toBe(429);
    expect(bloque.body.message).toMatch(/15 minutes/);
  });

  test('ne compte pas les connexions réussies dans la limite', async () => {
    const { email } = await creerCompte();
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect((await api().post('/api/auth/login').send({ email, password: MOT_DE_PASSE })).status).toBe(200);
    }
  });
});

describe('GET /api/auth/me et requireAuth', () => {
  test('renvoie le compte connecté avec un jeton valide', async () => {
    const { token, email } = await creerCompte('organisateur');
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, role: 'organisateur' });
  });

  test('refuse sans jeton (401) et avec un jeton falsifié (401)', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set('Authorization', 'Bearer faux.jeton.signe')).status).toBe(401);
  });

  test('relit le rôle en base : un changement de rôle s’applique sans se reconnecter', async () => {
    const { token, email } = await creerCompte('participant');
    await prisma.utilisateur.update({ where: { email }, data: { role: 'organisateur' } });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.body.user.role).toBe('organisateur');
  });
});
