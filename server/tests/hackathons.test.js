// Tests des hackathons : liste, filtres, détail, publication (rôles + Zod), suppression, bannière.
import { api, creerCompte, dansNJours, donneesHackathon, prisma, publierHackathon, viderBase } from './aide.js';

// Plus petite image PNG valide (1 pixel)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let organisateur;
let autreOrganisateur;
let participant;
let admin;

beforeAll(async () => {
  await viderBase();
  organisateur = await creerCompte('organisateur');
  autreOrganisateur = await creerCompte('organisateur');
  participant = await creerCompte('participant');
  admin = await creerCompte('admin');
});
afterAll(() => prisma.$disconnect());

const avec = (compte) => ({ Authorization: `Bearer ${compte.token}` });

describe('GET /api/hackathons', () => {
  beforeAll(async () => {
    await publierHackathon(organisateur.token, { titre: 'Hackathon Santé Sousse', domaine: 'sante', region: 'Sousse' });
    await publierHackathon(organisateur.token, { titre: 'Hackathon Fintech', domaine: 'fintech' });
  });

  test('liste les hackathons avec les champs calculés (statut, places restantes, inscrits)', async () => {
    const res = await api().get('/api/hackathons');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(res.body.hackathons.length);
    expect(res.body.hackathons[0]).toMatchObject({ statut: 'a-venir', inscrits: 0, placesRestantes: 10 });
    expect(res.body.hackathons[0].dateDebut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('filtre par domaine et par région (avec accents et plusieurs valeurs)', async () => {
    const sante = await api().get('/api/hackathons').query({ domaine: 'sante' });
    const plusieurs = await api().get('/api/hackathons').query({ domaine: 'sante,fintech', region: 'Sousse,Tunis,Gabès' });

    expect(sante.body.hackathons.map((h) => h.titre)).toEqual(['Hackathon Santé Sousse']);
    expect(plusieurs.body.total).toBe(2);
  });

  test('recherche dans le texte sans tenir compte des accents', async () => {
    const res = await api().get('/api/hackathons').query({ q: 'sante' });

    expect(res.body.hackathons.map((h) => h.titre)).toContain('Hackathon Santé Sousse');
  });

  test('refuse un filtre inconnu (400, validation Zod)', async () => {
    const res = await api().get('/api/hackathons').query({ domaine: 'piratage', tri: 'n-importe' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('domaine');
    expect(res.body.errors).toHaveProperty('tri');
  });
});

describe('GET /api/hackathons/:id', () => {
  test('renvoie le détail d’un hackathon', async () => {
    const h = await publierHackathon(organisateur.token, { titre: 'Détail test' });
    const res = await api().get(`/api/hackathons/${h.id}`);

    expect(res.status).toBe(200);
    expect(res.body.hackathon).toMatchObject({ id: h.id, titre: 'Détail test', organisateur: { nom: 'Club Test', type: 'club' } });
  });

  test('renvoie 404 pour un hackathon inconnu', async () => {
    const res = await api().get('/api/hackathons/inexistant');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Hackathon introuvable.');
  });
});

describe('POST /api/hackathons (publier)', () => {
  test('un organisateur peut publier (201) ; il en devient l’auteur', async () => {
    const res = await api().post('/api/hackathons').set(avec(organisateur)).send(donneesHackathon());

    expect(res.status).toBe(201);
    expect(res.body.hackathon.createdBy).toBe(organisateur.user.id);
  });

  test('un participant ne peut pas publier (403, requireRole)', async () => {
    const res = await api().post('/api/hackathons').set(avec(participant)).send(donneesHackathon());

    expect(res.status).toBe(403);
  });

  test('un visiteur non connecté ne peut pas publier (401)', async () => {
    const res = await api().post('/api/hackathons').send(donneesHackathon());

    expect(res.status).toBe(401);
  });

  test('renvoie les erreurs avec les noms de champs du formulaire', async () => {
    const res = await api().post('/api/hackathons').set(avec(organisateur)).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.objectContaining({
        titre: expect.any(String),
        organisateurNom: expect.any(String),
        organisateurType: expect.any(String),
        dateDebut: expect.any(String),
        places: expect.any(String),
      }),
    );
  });

  test('refuse des dates incohérentes ou inexistantes', async () => {
    const res = await api()
      .post('/api/hackathons')
      .set(avec(organisateur))
      .send(donneesHackathon({ dateDebut: dansNJours(30), dateFin: dansNJours(10), dateLimite: dansNJours(40) }));
    const fevrier = await api().post('/api/hackathons').set(avec(organisateur)).send(donneesHackathon({ dateDebut: '2031-02-31' }));

    expect(res.body.errors).toMatchObject({ dateFin: 'La fin doit être après le début.', dateLimite: 'Doit être avant le début.' });
    expect(fevrier.body.errors.dateDebut).toBe('Cette date n’existe pas.');
  });

  test('nettoie les données : espaces retirés, nombres convertis, champs inconnus ignorés', async () => {
    const res = await api()
      .post('/api/hackathons')
      .set(avec(organisateur))
      .send(donneesHackathon({ titre: '   Titre propre   ', places: '25', prix: ['', '1er prix'], creePar: autreOrganisateur.user.id, id: 'id-force' }));

    expect(res.status).toBe(201);
    expect(res.body.hackathon).toMatchObject({ titre: 'Titre propre', places: 25, prix: ['1er prix'], createdBy: organisateur.user.id });
    expect(res.body.hackathon.id).not.toBe('id-force');
  });
});

describe('DELETE /api/hackathons/:id', () => {
  test('l’auteur peut supprimer son hackathon (204)', async () => {
    const h = await publierHackathon(organisateur.token);
    const res = await api().delete(`/api/hackathons/${h.id}`).set(avec(organisateur));

    expect(res.status).toBe(204);
    expect(await prisma.hackathon.findUnique({ where: { id: h.id } })).toBeNull();
  });

  test('un autre organisateur ne peut pas le supprimer (403)', async () => {
    const h = await publierHackathon(organisateur.token);
    const res = await api().delete(`/api/hackathons/${h.id}`).set(avec(autreOrganisateur));

    expect(res.status).toBe(403);
  });

  test('un admin peut supprimer n’importe quel hackathon (modération)', async () => {
    const h = await publierHackathon(organisateur.token);
    const res = await api().delete(`/api/hackathons/${h.id}`).set(avec(admin));

    expect(res.status).toBe(204);
  });
});

describe('GET /api/hackathons/mine et /:id/inscrits', () => {
  test('« Mes publications » ne renvoie que les hackathons de l’utilisateur', async () => {
    await publierHackathon(autreOrganisateur.token, { titre: 'Publication de l’autre' });
    const res = await api().get('/api/hackathons/mine').set(avec(autreOrganisateur));

    expect(res.status).toBe(200);
    expect(res.body.hackathons.every((h) => h.createdBy === autreOrganisateur.user.id)).toBe(true);
  });

  test('la liste des inscrits est réservée à l’auteur et aux admins', async () => {
    const h = await publierHackathon(organisateur.token);

    expect((await api().get(`/api/hackathons/${h.id}/inscrits`).set(avec(organisateur))).status).toBe(200);
    expect((await api().get(`/api/hackathons/${h.id}/inscrits`).set(avec(admin))).status).toBe(200);
    expect((await api().get(`/api/hackathons/${h.id}/inscrits`).set(avec(participant))).status).toBe(403);
  });
});

describe('PUT /api/hackathons/:id/banniere (Multer)', () => {
  let h;
  beforeAll(async () => {
    h = await publierHackathon(organisateur.token);
  });
  afterAll(async () => {
    // Supprimer le hackathon supprime aussi sa bannière sur le disque
    await api().delete(`/api/hackathons/${h.id}`).set(avec(organisateur));
  });

  test('accepte une vraie image PNG et lui donne un nom aléatoire', async () => {
    const res = await api().put(`/api/hackathons/${h.id}/banniere`).set(avec(organisateur)).attach('banniere', PNG, { filename: '../../piege.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.hackathon.banniere).toMatch(/^\/uploads\/bannieres\/[0-9a-f-]{36}\.png$/);
    const image = await api().get(res.body.hackathon.banniere);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/png');
  });

  test('refuse un texte déguisé en PNG (signature du fichier vérifiée)', async () => {
    const res = await api()
      .put(`/api/hackathons/${h.id}/banniere`)
      .set(avec(organisateur))
      .attach('banniere', Buffer.from('<script>alert(1)</script>'), { filename: 'faux.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/vraie image/);
  });

  test('refuse un format non autorisé et une image de plus de 2 Mo', async () => {
    const gif = await api().put(`/api/hackathons/${h.id}/banniere`).set(avec(organisateur)).attach('banniere', Buffer.from('GIF89a'), { filename: 'a.gif', contentType: 'image/gif' });
    const lourde = await api()
      .put(`/api/hackathons/${h.id}/banniere`)
      .set(avec(organisateur))
      .attach('banniere', Buffer.concat([PNG, Buffer.alloc(2.1 * 1024 * 1024)]), { filename: 'lourde.png', contentType: 'image/png' });

    expect(gif.status).toBe(400);
    expect(lourde.status).toBe(413);
  });

  test('refuse l’envoi par un autre organisateur (403)', async () => {
    const res = await api().put(`/api/hackathons/${h.id}/banniere`).set(avec(autreOrganisateur)).attach('banniere', PNG, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
  });
});

describe('Erreurs générales', () => {
  test('JSON mal formé : 400 et pas une erreur serveur', async () => {
    const res = await api().post('/api/contact').set('Content-Type', 'application/json').send('{pas du json');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Données JSON invalides.');
  });

  test('route inconnue : 404 en JSON', async () => {
    const res = await api().get('/api/nexiste-pas');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route introuvable.');
  });

  test('en-têtes de sécurité helmet présents', async () => {
    const res = await api().get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
