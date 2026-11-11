import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, Copy, User, UserPlus, Users } from 'lucide-react';
import { ErrorMessage, Field, Spinner, Stepper } from '../components/ui';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPeriode, inscriptionsOuvertes } from '../utils/format';

const ETAPES = ['Tes informations', 'Participation', 'Confirmation'];

const MODES = [
  { value: 'solo', icon: User, titre: 'En solo', texte: 'Tu participes seul(e) ou tu trouveras une équipe sur place.' },
  { value: 'creer', icon: UserPlus, titre: 'Créer une équipe', texte: 'Tu reçois un code à partager avec tes coéquipiers.' },
  { value: 'rejoindre', icon: Users, titre: 'Rejoindre une équipe', texte: 'Tu as reçu un code d’un coéquipier.' },
];

export default function Inscription() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notify } = useToast();
  const [hackathon, setHackathon] = useState(null);
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState({ motivation: '', mode: 'solo', nomEquipe: '', codeEquipe: '', accepte: false });
  const [errors, setErrors] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    Promise.all([api.getHackathon(id), api.getMesInscriptions()])
      .then(([h, mes]) => {
        setHackathon(h.hackathon);
        setDejaInscrit(mes.inscriptions.some((i) => i.hackathonId === id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const validerEtape = () => {
    const errs = {};
    if (etape === 1) {
      if (form.mode === 'creer' && form.nomEquipe.trim().length < 2) errs.nomEquipe = 'Donne un nom à ton équipe.';
      if (form.mode === 'rejoindre' && !/^HF-[A-Z0-9]{5}$/i.test(form.codeEquipe.trim())) errs.codeEquipe = 'Le code ressemble à HF-AB12C.';
    }
    if (etape === 2 && !form.accepte) errs.accepte = 'Tu dois accepter le règlement.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const suivant = () => {
    if (validerEtape()) setEtape((e) => e + 1);
  };

  const envoyer = async (e) => {
    e.preventDefault();
    if (etape < ETAPES.length - 1) return suivant();
    if (!validerEtape()) return undefined;

    setEnvoi(true);
    try {
      const { inscription } = await api.sInscrire(id, {
        mode: form.mode,
        nomEquipe: form.nomEquipe,
        codeEquipe: form.codeEquipe,
        motivation: form.motivation,
      });
      setResultat(inscription);
      notify('Inscription confirmée !');
    } catch (err) {
      notify(err.message, 'error');
      if (err.errors) {
        setErrors(err.errors);
        setEtape(1);
      }
    } finally {
      setEnvoi(false);
    }
    return undefined;
  };

  const copierCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify('Code copié dans le presse-papiers.', 'info');
    } catch {
      notify('Copie impossible, note le code manuellement.', 'error');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="container-page py-16"><ErrorMessage message={error} /></div>;

  const retour = (
    <Link to={`/hackathons/${id}`} className="inline-flex items-center gap-1 text-sm text-tech hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au hackathon
    </Link>
  );

  if (resultat) {
    return (
      <div className="container-page max-w-xl py-16">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CircleCheck className="h-9 w-9 text-menthe" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">C’est confirmé !</h1>
          <p className="mt-2 text-slate-600">
            Tu es inscrit(e) à <strong className="text-navy">{hackathon.titre}</strong> ({formatPeriode(hackathon.dateDebut, hackathon.dateFin)}).
          </p>
          {resultat.equipe && (
            <div className="mt-6 rounded-xl bg-glace p-5">
              <p className="text-sm text-slate-600">Équipe « {resultat.equipe.nom} » · code à partager :</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-display text-2xl font-bold tracking-widest text-navy">{resultat.equipe.code}</span>
                <button type="button" onClick={() => copierCode(resultat.equipe.code)} className="rounded-lg p-2 text-tech hover:bg-white" aria-label="Copier le code">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/mes-evenements" className="btn btn-primary">
              Voir mes événements
            </Link>
            <Link to="/hackathons" className="btn btn-outline">
              Autres hackathons
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (dejaInscrit || !inscriptionsOuvertes(hackathon)) {
    return (
      <div className="container-page max-w-xl py-16">
        {retour}
        <div className="card mt-6 p-8 text-center">
          <h1 className="text-xl font-bold">{dejaInscrit ? 'Tu es déjà inscrit(e) à ce hackathon' : 'Les inscriptions sont fermées'}</h1>
          <Link to={dejaInscrit ? '/mes-evenements' : '/hackathons'} className="btn btn-primary mt-6">
            {dejaInscrit ? 'Voir mes événements' : 'Voir les autres hackathons'}
          </Link>
        </div>
      </div>
    );
  }

  const modeChoisi = MODES.find((m) => m.value === form.mode);

  return (
    <div className="container-page max-w-2xl py-10">
      {retour}
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Inscription</h1>
      <p className="mt-1 text-slate-600">
        {hackathon.titre} · {formatPeriode(hackathon.dateDebut, hackathon.dateFin)}
      </p>

      <div className="mt-8">
        <Stepper steps={ETAPES} current={etape} />
      </div>

      <form onSubmit={envoyer} className="card mt-8 space-y-5 p-6 sm:p-8" noValidate>
        {etape === 0 && (
          <>
            <h2 className="text-lg font-semibold">Tes informations</h2>
            <dl className="grid gap-4 rounded-xl bg-clair p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Nom</dt>
                <dd className="font-medium text-navy">{user.nom}</dd>
              </div>
              <div>
                <dt className="text-slate-500">E-mail</dt>
                <dd className="font-medium break-all text-navy">{user.email}</dd>
              </div>
              {user.universite && (
                <div>
                  <dt className="text-slate-500">Université</dt>
                  <dd className="font-medium text-navy">{user.universite}</dd>
                </div>
              )}
            </dl>
            <Field label="Pourquoi veux-tu participer ? (facultatif)" id="motivation" hint="Aide les organisateurs à mieux te connaître.">
              <textarea id="motivation" name="motivation" rows={4} className="input" value={form.motivation} onChange={update} maxLength={500} />
            </Field>
          </>
        )}

        {etape === 1 && (
          <>
            <h2 className="text-lg font-semibold">Comment veux-tu participer ?</h2>
            <fieldset>
              <legend className="sr-only">Mode de participation</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {MODES.map((m) => (
                  <label
                    key={m.value}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition ${form.mode === m.value ? 'border-tech bg-glace' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input type="radio" name="mode" value={m.value} checked={form.mode === m.value} onChange={update} className="sr-only" />
                    <m.icon className="h-6 w-6 text-tech" aria-hidden="true" />
                    <span className="mt-2 block font-semibold text-navy">{m.titre}</span>
                    <span className="mt-1 block text-xs text-slate-500">{m.texte}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {form.mode === 'creer' && (
              <Field label="Nom de l’équipe" id="nomEquipe" error={errors.nomEquipe}>
                <input id="nomEquipe" name="nomEquipe" className="input" value={form.nomEquipe} onChange={update} />
              </Field>
            )}
            {form.mode === 'rejoindre' && (
              <Field label="Code de l’équipe" id="codeEquipe" error={errors.codeEquipe} hint={hackathon.tailleEquipeMax ? `Équipes de ${hackathon.tailleEquipeMax} personnes maximum.` : undefined}>
                <input id="codeEquipe" name="codeEquipe" className="input uppercase" placeholder="HF-AB12C" value={form.codeEquipe} onChange={update} />
              </Field>
            )}
          </>
        )}

        {etape === 2 && (
          <>
            <h2 className="text-lg font-semibold">Vérifie et confirme</h2>
            <dl className="divide-y divide-slate-100 rounded-xl bg-clair px-4 text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-slate-500">Hackathon</dt>
                <dd className="text-right font-medium text-navy">{hackathon.titre}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-slate-500">Participant</dt>
                <dd className="text-right font-medium text-navy">{user.nom}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-slate-500">Participation</dt>
                <dd className="text-right font-medium text-navy">
                  {modeChoisi.titre}
                  {form.mode === 'creer' && ` · ${form.nomEquipe}`}
                  {form.mode === 'rejoindre' && ` · ${form.codeEquipe.toUpperCase()}`}
                </dd>
              </div>
            </dl>
            {hackathon.reglement && <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">{hackathon.reglement}</p>}
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="accepte" checked={form.accepte} onChange={update} className="mt-0.5 h-4 w-4 accent-tech" />
                J’ai lu et j’accepte le règlement du hackathon.
              </label>
              {errors.accepte && <p className="error-text">{errors.accepte}</p>}
            </div>
          </>
        )}

        <div className="flex justify-between gap-3 border-t border-slate-100 pt-5">
          {etape > 0 ? (
            <button type="button" onClick={() => setEtape((e) => e - 1)} className="btn btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
            </button>
          ) : (
            <span />
          )}
          {etape < ETAPES.length - 1 ? (
            <button type="submit" className="btn btn-secondary">
              Continuer <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              {envoi ? 'Envoi…' : 'Confirmer mon inscription'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
