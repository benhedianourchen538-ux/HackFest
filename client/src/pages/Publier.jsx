import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Save, Trash2 } from 'lucide-react';
import HackathonCard from '../components/HackathonCard';
import { Field, PageHeader, Stepper } from '../components/ui';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { DOMAINES, FORMATS, REGIONS, TYPES_ORGANISATEUR, labelOf } from '../data/constants';
import { formatDate, formatPeriode } from '../utils/format';

const ETAPES = ['Infos', 'Dates & lieu', 'Programme & prix', 'Règlement', 'Aperçu'];
const BROUILLON_KEY = 'hackfest_brouillon';

const VIDE = {
  titre: '',
  description: '',
  organisateurNom: '',
  organisateurType: 'club',
  domaine: 'tech-ia',
  format: 'presentiel',
  region: 'Tunis',
  lieu: '',
  dateDebut: '',
  dateFin: '',
  dateLimite: '',
  programme: [{ moment: '', titre: '' }],
  prix: [''],
  places: 50,
  tailleEquipeMax: 4,
  reglement: '',
};

function lireBrouillon() {
  try {
    return JSON.parse(localStorage.getItem(BROUILLON_KEY)) || null;
  } catch {
    return null;
  }
}

// Correspondance entre les erreurs renvoyées par l'API et l'étape du formulaire
const ETAPE_DU_CHAMP = {
  titre: 0, description: 0, organisateurNom: 0, organisateurType: 0, domaine: 0,
  format: 1, region: 1, lieu: 1, dateDebut: 1, dateFin: 1, dateLimite: 1,
  places: 3,
};

export default function Publier() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState(() => lireBrouillon() || VIDE);
  const [etape, setEtape] = useState(0);
  const [errors, setErrors] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const update = (e) => set(e.target.name, e.target.value);

  const changerFormat = (e) => {
    const format = e.target.value;
    setForm((f) => ({
      ...f,
      format,
      region: format === 'en-ligne' ? 'En ligne' : f.region === 'En ligne' ? 'Tunis' : f.region,
      lieu: format === 'en-ligne' && !f.lieu ? 'En ligne' : f.lieu,
    }));
  };

  // Listes dynamiques (programme, prix)
  const majListe = (name, index, value) => set(name, form[name].map((item, i) => (i === index ? value : item)));
  const ajouter = (name, vide) => set(name, [...form[name], vide]);
  const retirer = (name, index) => set(name, form[name].filter((_, i) => i !== index));

  const validerEtape = (n) => {
    const errs = {};
    const today = new Date().toISOString().slice(0, 10);
    if (n === 0) {
      if (form.titre.trim().length < 5) errs.titre = 'Titre trop court (5 caractères min.).';
      if (form.description.trim().length < 30) errs.description = `Encore ${30 - form.description.trim().length} caractères minimum.`;
      if (!form.organisateurNom.trim()) errs.organisateurNom = 'Indique le nom de l’organisateur.';
    }
    if (n === 1) {
      if (!form.lieu.trim()) errs.lieu = 'Indique le lieu.';
      if (!form.dateDebut) errs.dateDebut = 'Date requise.';
      else if (form.dateDebut <= today) errs.dateDebut = 'Choisis une date future.';
      if (!form.dateFin) errs.dateFin = 'Date requise.';
      else if (form.dateDebut && form.dateFin < form.dateDebut) errs.dateFin = 'La fin doit être après le début.';
      if (!form.dateLimite) errs.dateLimite = 'Date requise.';
      else if (form.dateDebut && form.dateLimite > form.dateDebut) errs.dateLimite = 'Doit être avant le début.';
    }
    if (n === 3) {
      if (!(Number(form.places) >= 1)) errs.places = 'Au moins 1 place.';
      if (!(Number(form.tailleEquipeMax) >= 1)) errs.tailleEquipeMax = 'Au moins 1 personne.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const suivant = () => validerEtape(etape) && setEtape((e) => e + 1);

  const enregistrerBrouillon = () => {
    localStorage.setItem(BROUILLON_KEY, JSON.stringify(form));
    notify('Brouillon enregistré sur cet appareil.', 'info');
  };

  const payload = {
    titre: form.titre,
    description: form.description,
    organisateur: { nom: form.organisateurNom, type: form.organisateurType },
    domaine: form.domaine,
    format: form.format,
    region: form.region,
    lieu: form.lieu,
    dateDebut: form.dateDebut,
    dateFin: form.dateFin,
    dateLimite: form.dateLimite,
    places: Number(form.places),
    tailleEquipeMax: Number(form.tailleEquipeMax),
    prix: form.prix.map((p) => p.trim()).filter(Boolean),
    programme: form.programme.filter((p) => p.titre.trim()),
    reglement: form.reglement,
  };

  const publier = async () => {
    setEnvoi(true);
    try {
      const { hackathon } = await api.publierHackathon(payload);
      localStorage.removeItem(BROUILLON_KEY);
      notify('Ton hackathon est publié !');
      navigate(`/hackathons/${hackathon.id}`);
    } catch (err) {
      notify(err.message, 'error');
      if (err.errors) {
        setErrors(err.errors);
        const premiere = Math.min(...Object.keys(err.errors).map((k) => ETAPE_DU_CHAMP[k] ?? 0));
        setEtape(premiere);
      }
      setEnvoi(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (etape < ETAPES.length - 1) suivant();
    else publier();
  };

  // Aperçu tel qu'il apparaîtra dans la liste
  const apercu = {
    id: 'apercu',
    ...payload,
    statut: 'a-venir',
    inscrits: 0,
    placesRestantes: payload.places,
  };

  return (
    <>
      <PageHeader title="Publier un hackathon" subtitle="Remplis les étapes : ton hackathon sera visible immédiatement par tous les étudiants." />
      <div className="container-page max-w-3xl py-10">
        <Stepper steps={ETAPES} current={etape} />

        <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6 sm:p-8" noValidate>
          {etape === 0 && (
            <>
              <h2 className="text-lg font-semibold">Informations générales</h2>
              <Field label="Titre du hackathon" id="titre" error={errors.titre}>
                <input id="titre" name="titre" className="input" value={form.titre} onChange={update} placeholder="Ex. AI for Campus Hackathon" />
              </Field>
              <Field label="Description" id="description" error={errors.description} hint="Le thème, les défis, le public visé (30 caractères min.).">
                <textarea id="description" name="description" rows={5} className="input" value={form.description} onChange={update} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom de l’organisateur" id="organisateurNom" error={errors.organisateurNom}>
                  <input id="organisateurNom" name="organisateurNom" className="input" value={form.organisateurNom} onChange={update} placeholder="Ex. Club IA SUP'COM" />
                </Field>
                <Field label="Type d’organisateur" id="organisateurType">
                  <select id="organisateurType" name="organisateurType" className="input" value={form.organisateurType} onChange={update}>
                    {TYPES_ORGANISATEUR.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Domaine" id="domaine">
                <select id="domaine" name="domaine" className="input" value={form.domaine} onChange={update}>
                  {DOMAINES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {etape === 1 && (
            <>
              <h2 className="text-lg font-semibold">Dates et lieu</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Format" id="format">
                  <select id="format" name="format" className="input" value={form.format} onChange={changerFormat}>
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Région" id="region">
                  <select id="region" name="region" className="input" value={form.region} onChange={update} disabled={form.format === 'en-ligne'}>
                    {REGIONS.filter((r) => form.format === 'en-ligne' || r !== 'En ligne').map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Lieu précis" id="lieu" error={errors.lieu}>
                <input id="lieu" name="lieu" className="input" value={form.lieu} onChange={update} placeholder="Ex. Campus SUP'COM, Ariana" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Début" id="dateDebut" error={errors.dateDebut}>
                  <input id="dateDebut" name="dateDebut" type="date" className="input" value={form.dateDebut} onChange={update} />
                </Field>
                <Field label="Fin" id="dateFin" error={errors.dateFin}>
                  <input id="dateFin" name="dateFin" type="date" className="input" value={form.dateFin} onChange={update} min={form.dateDebut || undefined} />
                </Field>
                <Field label="Limite d’inscription" id="dateLimite" error={errors.dateLimite}>
                  <input id="dateLimite" name="dateLimite" type="date" className="input" value={form.dateLimite} onChange={update} max={form.dateDebut || undefined} />
                </Field>
              </div>
            </>
          )}

          {etape === 2 && (
            <>
              <h2 className="text-lg font-semibold">Programme</h2>
              <div className="space-y-3">
                {form.programme.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <label className="sr-only" htmlFor={`moment-${i}`}>Moment</label>
                    <input id={`moment-${i}`} className="input w-36 sm:w-44" placeholder="Samedi 9h00" value={p.moment} onChange={(e) => majListe('programme', i, { ...p, moment: e.target.value })} />
                    <label className="sr-only" htmlFor={`activite-${i}`}>Activité</label>
                    <input id={`activite-${i}`} className="input" placeholder="Accueil des participants" value={p.titre} onChange={(e) => majListe('programme', i, { ...p, titre: e.target.value })} />
                    <button type="button" onClick={() => retirer('programme', i)} className="rounded-lg px-2 text-slate-400 hover:text-sup" aria-label="Supprimer cette étape" disabled={form.programme.length === 1}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => ajouter('programme', { moment: '', titre: '' })} className="btn btn-ghost px-3">
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une étape
              </button>

              <h2 className="pt-2 text-lg font-semibold">Prix</h2>
              <div className="space-y-3">
                {form.prix.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <label className="sr-only" htmlFor={`prix-${i}`}>Prix {i + 1}</label>
                    <input id={`prix-${i}`} className="input" placeholder="1er prix : 2 000 DT" value={p} onChange={(e) => majListe('prix', i, e.target.value)} />
                    <button type="button" onClick={() => retirer('prix', i)} className="rounded-lg px-2 text-slate-400 hover:text-sup" aria-label="Supprimer ce prix" disabled={form.prix.length === 1}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => ajouter('prix', '')} className="btn btn-ghost px-3">
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter un prix
              </button>
            </>
          )}

          {etape === 3 && (
            <>
              <h2 className="text-lg font-semibold">Règlement et places</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de places" id="places" error={errors.places}>
                  <input id="places" name="places" type="number" min={1} className="input" value={form.places} onChange={update} />
                </Field>
                <Field label="Taille max. d’une équipe" id="tailleEquipeMax" error={errors.tailleEquipeMax}>
                  <input id="tailleEquipeMax" name="tailleEquipeMax" type="number" min={1} max={10} className="input" value={form.tailleEquipeMax} onChange={update} />
                </Field>
              </div>
              <Field label="Règlement (facultatif)" id="reglement">
                <textarea id="reglement" name="reglement" rows={5} className="input" value={form.reglement} onChange={update} placeholder="Conditions de participation, critères du jury…" />
              </Field>
            </>
          )}

          {etape === 4 && (
            <>
              <h2 className="text-lg font-semibold">Aperçu avant publication</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="pointer-events-none">
                  <HackathonCard hackathon={apercu} />
                </div>
                <dl className="space-y-3 text-sm">
                  {[
                    ['Organisateur', `${form.organisateurNom} (${labelOf(TYPES_ORGANISATEUR, form.organisateurType)})`],
                    ['Dates', formatPeriode(form.dateDebut, form.dateFin)],
                    ['Inscriptions jusqu’au', formatDate(form.dateLimite)],
                    ['Lieu', `${form.lieu} · ${labelOf(FORMATS, form.format)}`],
                    ['Places', `${form.places} (équipes de ${form.tailleEquipeMax} max.)`],
                    ['Programme', `${payload.programme.length} étape(s)`],
                    ['Prix', `${payload.prix.length} prix`],
                  ].map(([dt, dd]) => (
                    <div key={dt}>
                      <dt className="text-slate-500">{dt}</dt>
                      <dd className="font-medium text-navy">{dd}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex gap-2">
              {etape > 0 && (
                <button type="button" onClick={() => setEtape((e) => e - 1)} className="btn btn-ghost">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
                </button>
              )}
              <button type="button" onClick={enregistrerBrouillon} className="btn btn-ghost">
                <Save className="h-4 w-4" aria-hidden="true" /> Brouillon
              </button>
            </div>
            {etape < ETAPES.length - 1 ? (
              <button type="submit" className="btn btn-secondary">
                Continuer <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={envoi}>
                {envoi ? 'Publication…' : 'Publier le hackathon'}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
