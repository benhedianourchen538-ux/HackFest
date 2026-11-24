// Tests des inscriptions : solo, créer / rejoindre une équipe, règles (places, dates, doublons), annulation.
import { api, creerCompte, dansNJours, prisma, publierHackathon, viderBase } from './aide.js';

let organisateur;
const avec = (compte) => ({ Authorization: `Bearer ${compte.token}` });
const sInscrire = (compte, hackathonId, corps) => api().post(`/api/hackathons/${hackathonId}/inscriptions`).set(avec(compte)).send(corps);

beforeAll(async () => {
  await viderBase();
  organisateur = await creerCompte('organisateur');
});
afterAll(() => prisma.$disconnect());

describe('POST /api/hackathons/:id/inscriptions', () => {
  test('inscription solo (201)', async () => {
    const h = await publierHackathon(organisateur.token);
    const alice = await creerCompte();
    const res = await sInscrire(alice, h.id, { mode: 'solo', motivation: '  J’adore l’IA  ' });

    expect(res.status).toBe(201);
    expect(res.body.inscription).toMatchObject({ mode: 'solo', equipe: null, motivation: 'J’adore l’IA', hackathonId: h.id });
  });

  test('refuse sans connexion (401)', async () => {
    const h = await publierHackathon(organisateur.token);
    const res = await api().post(`/api/hackathons/${h.id}/inscriptions`).send({ mode: 'solo' });

    expect(res.status).toBe(401);
  });

  test('refuse une double inscription (409)', async () => {
    const h = await publierHackathon(organisateur.token);
    const alice = await creerCompte();
    await sInscrire(alice, h.id, { mode: 'solo' });
    const res = await sInscrire(alice, h.id, { mode: 'solo' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Tu es déjà inscrit(e) à ce hackathon.');
  });

  test('refuse un mode inconnu et un nom d’équipe manquant, avec un message précis', async () => {
    const h = await publierHackathon(organisateur.token);
    const alice = await creerCompte();
    const mode = await sInscrire(alice, h.id, { mode: 'vip' });
    const nom = await sInscrire(alice, h.id, { mode: 'creer', nomEquipe: ' ' });

    expect(mode.status).toBe(400);
    expect(nom.status).toBe(400);
    expect(nom.body.message).toBe('Nom d’équipe requis.');
  });

  test('refuse quand il n’y a plus de places', async () => {
    const h = await publierHackathon(organisateur.token, { places: 1 });
    await sInscrire(await creerCompte(), h.id, { mode: 'solo' });
    const res = await sInscrire(await creerCompte(), h.id, { mode: 'solo' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Plus de places disponibles.');
  });

  test('refuse quand la date limite est passée', async () => {
    const h = await publierHackathon(organisateur.token, { dateLimite: dansNJours(-1) });
    const res = await sInscrire(await creerCompte(), h.id, { mode: 'solo' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Les inscriptions sont fermées pour ce hackathon.');
  });

  test('refuse un hackathon inconnu (404)', async () => {
    const res = await sInscrire(await creerCompte(), 'inexistant', { mode: 'solo' });

    expect(res.status).toBe(404);
  });
});

describe('Équipes', () => {
  let h;
  let capitaine;
  let code;

  beforeAll(async () => {
    h = await publierHackathon(organisateur.token, { tailleEquipeMax: 2 });
    capitaine = await creerCompte();
  });

  test('créer une équipe génère un code "HF-XXXXX" et crée la ligne dans la table equipes', async () => {
    const res = await sInscrire(capitaine, h.id, { mode: 'creer', nomEquipe: 'Les Débogueurs' });
    code = res.body.inscription.equipe.code;

    expect(res.status).toBe(201);
    expect(code).toMatch(/^HF-[A-Z2-9]{5}$/);
    const equipe = await prisma.equipe.findUnique({ where: { code } });
    expect(equipe).toMatchObject({ nom: 'Les Débogueurs', hackathonId: h.id });
  });

  test('rejoindre une équipe avec son code (même en minuscules)', async () => {
    const coequipier = await creerCompte();
    const res = await sInscrire(coequipier, h.id, { mode: 'rejoindre', codeEquipe: `  ${code.toLowerCase()} ` });

    expect(res.status).toBe(201);
    expect(res.body.inscription.equipe).toEqual({ nom: 'Les Débogueurs', code });
  });

  test('refuse une équipe complète (taille max. 2)', async () => {
    const res = await sInscrire(await creerCompte(), h.id, { mode: 'rejoindre', codeEquipe: code });

    expect(res.status).toBe(400);
    expect(res.body.errors.codeEquipe).toBe('Équipe complète.');
  });

  test('refuse un code inconnu ou d’un autre hackathon', async () => {
    const autre = await publierHackathon(organisateur.token);
    const inconnu = await sInscrire(await creerCompte(), h.id, { mode: 'rejoindre', codeEquipe: 'HF-ZZZZZ' });
    const ailleurs = await sInscrire(await creerCompte(), autre.id, { mode: 'rejoindre', codeEquipe: code });

    expect(inconnu.status).toBe(400);
    expect(ailleurs.status).toBe(400);
    expect(ailleurs.body.errors.codeEquipe).toBe('Code introuvable.');
  });

  test('« Mes événements » affiche les membres de l’équipe dans l’ordre d’arrivée', async () => {
    const res = await api().get('/api/inscriptions/me').set(avec(capitaine));

    expect(res.status).toBe(200);
    expect(res.body.inscriptions).toHaveLength(1);
    expect(res.body.inscriptions[0].membres).toHaveLength(2);
    expect(res.body.inscriptions[0].membres[0]).toBe(capitaine.user.nom);
    expect(res.body.inscriptions[0].hackathon.id).toBe(h.id);
  });

  test('l’organisateur voit les inscrits avec leur équipe', async () => {
    const res = await api().get(`/api/hackathons/${h.id}/inscrits`).set(avec(organisateur));

    expect(res.body.inscrits).toHaveLength(2);
    expect(res.body.inscrits[0]).toMatchObject({ nom: capitaine.user.nom, mode: 'creer', equipe: { code } });
  });
});

describe('DELETE /api/inscriptions/:id (annuler)', () => {
  test('on peut annuler sa propre inscription (204), pas celle d’un autre (403)', async () => {
    const h = await publierHackathon(organisateur.token);
    const alice = await creerCompte();
    const bob = await creerCompte();
    const { body } = await sInscrire(alice, h.id, { mode: 'solo' });

    expect((await api().delete(`/api/inscriptions/${body.inscription.id}`).set(avec(bob))).status).toBe(403);
    expect((await api().delete(`/api/inscriptions/${body.inscription.id}`).set(avec(alice))).status).toBe(204);
    expect((await api().delete(`/api/inscriptions/${body.inscription.id}`).set(avec(alice))).status).toBe(404);
  });

  test('l’équipe vide est supprimée quand son dernier membre se désinscrit', async () => {
    const h = await publierHackathon(organisateur.token);
    const alice = await creerCompte();
    const { body } = await sInscrire(alice, h.id, { mode: 'creer', nomEquipe: 'Équipe éphémère' });
    await api().delete(`/api/inscriptions/${body.inscription.id}`).set(avec(alice));

    expect(await prisma.equipe.findUnique({ where: { code: body.inscription.equipe.code } })).toBeNull();
  });

  test('supprimer un hackathon supprime ses inscriptions et ses équipes (cascade)', async () => {
    const h = await publierHackathon(organisateur.token);
    await sInscrire(await creerCompte(), h.id, { mode: 'creer', nomEquipe: 'Équipe cascade' });
    await api().delete(`/api/hackathons/${h.id}`).set(avec(organisateur));

    expect(await prisma.inscription.count({ where: { hackathonId: h.id } })).toBe(0);
    expect(await prisma.equipe.count({ where: { hackathonId: h.id } })).toBe(0);
  });
});
