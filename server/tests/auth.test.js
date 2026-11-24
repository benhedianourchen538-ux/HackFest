// Tests de l'authentification : création de compte, connexion, jeton, rôles, limite de tentatives.
import { api, creerCompte, prisma, viderBase } from './aide.js';

beforeAll(viderBase);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  test('crée un compte participant par défaut et renvoie un jeton', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'Amira Ben Ali', email: 'Amira@Test.TN ', password: 'motdepasse1' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ nom: 'Amira Ben Ali', email: 'amira@test.tn', role: 'participant' });
  });

  test('ne renvoie jamais le mot de passe ni son hash', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'Sami Test', email: 'sami@test.tn', password: 'motdepasse1' });

    expect(JSON.stringify(res.body)).not.toMatch(/motdepasse1|motDePasseHash|passwordHash/);
  });

  test('stocke le mot de passe haché avec bcrypt (jamais en clair)', async () => {
    const enBase = await prisma.utilisateur.findUnique({ where: { email: 'sami@test.tn' } });

    expect(enBase.motDePasseHash).not.toBe('motdepasse1');
    expect(enBase.motDePasseHash).toMatch(/^\$2[aby]\$10\$/); // format d'un hash bcrypt
  });

  test('permet de choisir le rôle organisateur', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'Club IA', email: 'club@test.tn', password: 'motdepasse1', role: 'organisateur' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('organisateur');
  });

  test('refuse de créer un compte admin', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'Pirate', email: 'pirate@test.tn', password: 'motdepasse1', role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.errors.role).toBeDefined();
  });

  test('refuse un e-mail déjà utilisé (409)', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'Autre Amira', email: 'amira@test.tn', password: 'motdepasse1' });

    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBe('E-mail déjà utilisé.');
  });

  test('renvoie une erreur par champ invalide (400)', async () => {
    const res = await api().post('/api/auth/register').send({ nom: 'A', email: 'pas-un-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Formulaire invalide.');
    expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'nom', 'password']);
  });
});

describe('POST /api/auth/login', () => {
  test('connecte avec le bon mot de passe (e-mail sans tenir compte des majuscules)', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'AMIRA@test.tn', password: 'motdepasse1' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('amira@test.tn');
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('refuse un mauvais mot de passe (401) avec un message qui ne dit pas si le compte existe', async () => {
    const mauvais = await api().post('/api/auth/login').send({ email: 'amira@test.tn', password: 'mauvais' });
    const inconnu = await api().post('/api/auth/login').send({ email: 'inconnu@test.tn', password: 'mauvais' });

    expect(mauvais.status).toBe(401);
    expect(inconnu.status).toBe(401);
    expect(mauvais.body.message).toBe(inconnu.body.message);
  });

  test('bloque après 5 échecs en 15 minutes (429), même avec le bon mot de passe ensuite', async () => {
    const { email } = await creerCompte();
    const statuts = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      statuts.push((await api().post('/api/auth/login').send({ email, password: 'mauvais' })).status);
    }
    const bloque = await api().post('/api/auth/login').send({ email, password: 'motdepasse1' });

    expect(statuts).toEqual([401, 401, 401, 401, 401]);
    expect(bloque.status).toBe(429);
    expect(bloque.body.message).toMatch(/15 minutes/);
  });

  test('ne compte pas les connexions réussies dans la limite', async () => {
    const { email } = await creerCompte();
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect((await api().post('/api/auth/login').send({ email, password: 'motdepasse1' })).status).toBe(200);
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

  test('refuse sans jeton (401)', async () => {
    const res = await api().get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Connexion requise.');
  });

  test('refuse un jeton falsifié (401)', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', 'Bearer faux.jeton.signe');

    expect(res.status).toBe(401);
  });

  test('relit le rôle en base : un changement de rôle s’applique sans se reconnecter', async () => {
    const { token, email } = await creerCompte('participant');
    await prisma.utilisateur.update({ where: { email }, data: { role: 'organisateur' } });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.body.user.role).toBe('organisateur');
  });
});
