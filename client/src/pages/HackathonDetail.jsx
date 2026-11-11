import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, CalendarDays, CircleCheck, ExternalLink, Globe, Lock, MapPin, Trophy, Users } from 'lucide-react';
import Cover from '../components/Cover';
import { ErrorMessage, Spinner } from '../components/ui';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FORMATS, TYPES_ORGANISATEUR, domaineOf, labelOf, statutOf } from '../data/constants';
import { A_CONFIRMER, formatDate, formatPeriode, inscriptionsOuvertes, joursAvant } from '../utils/format';

const SECTIONS = [
  { id: 'presentation', label: 'Présentation' },
  { id: 'programme', label: 'Programme' },
  { id: 'prix', label: 'Prix' },
  { id: 'reglement', label: 'Règlement' },
];

function ActionInscription({ hackathon, dejaInscrit, user }) {
  if (dejaInscrit) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CircleCheck className="h-5 w-5" aria-hidden="true" /> Tu es inscrit(e) à ce hackathon
        </p>
        <Link to="/mes-evenements" className="btn btn-outline w-full">
          Voir mes événements
        </Link>
      </div>
    );
  }
  if (!inscriptionsOuvertes(hackathon)) {
    const raison =
      hackathon.statut === 'termine'
        ? 'Hackathon terminé'
        : hackathon.statut === 'en-cours'
          ? 'Hackathon en cours'
          : hackathon.placesRestantes !== null && hackathon.placesRestantes <= 0
            ? 'Complet'
            : 'Inscriptions fermées';
    return (
      <button type="button" className="btn w-full bg-slate-200 text-slate-500" disabled>
        {raison}
      </button>
    );
  }
  const cible = `/hackathons/${hackathon.id}/inscription`;
  if (!user) {
    return (
      <div className="space-y-2">
        <Link to={`/connexion?redirect=${encodeURIComponent(cible)}`} className="btn btn-primary w-full">
          <Lock className="h-4 w-4" aria-hidden="true" /> Connecte-toi pour t’inscrire
        </Link>
        <p className="text-center text-xs text-slate-500">La création de compte est gratuite.</p>
      </div>
    );
  }
  return (
    <Link to={cible} className="btn btn-primary w-full">
      S’inscrire
    </Link>
  );
}

export default function HackathonDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState(null);
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const charger = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .getHackathon(id)
      .then((data) => setHackathon(data.hackathon))
      .catch((err) => setError(err.status === 404 ? 'Ce hackathon n’existe pas ou a été supprimé.' : err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(charger, [charger]);

  useEffect(() => {
    if (!user) {
      setDejaInscrit(false);
      return;
    }
    api
      .getMesInscriptions()
      .then(({ inscriptions }) => setDejaInscrit(inscriptions.some((i) => i.hackathonId === id)))
      .catch(() => {});
  }, [user, id]);

  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="container-page py-16">
        <ErrorMessage message={error} />
        <Link to="/hackathons" className="btn btn-ghost mt-6">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux hackathons
        </Link>
      </div>
    );

  const h = hackathon;
  const domaine = domaineOf(h.domaine);
  const statut = statutOf(h.statut);
  // places / dateLimite à null : information non communiquée
  const remplissage = h.places ? Math.min(100, Math.round((h.inscrits / h.places) * 100)) : 0;
  const jours = h.dateLimite ? joursAvant(h.dateLimite) : null;

  return (
    <article>
      <div className="relative">
        <Cover domaine={h.domaine} size="lg" className="h-56 sm:h-72" />
      </div>

      <div className="container-page">
        <div className="card relative -mt-16 p-6 sm:p-8">
          <Link to="/hackathons" className="inline-flex items-center gap-1 text-sm text-tech hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Tous les hackathons
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`badge ${domaine.color}`}>{domaine.label}</span>
            <span className={`badge ${statut.color}`}>{statut.label}</span>
            <span className="badge bg-clair text-slate-600">{labelOf(FORMATS, h.format)}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{h.titre}</h1>
          <p className="mt-2 flex items-center gap-2 text-slate-600">
            <Building2 className="h-4 w-4 text-tech" aria-hidden="true" />
            {h.organisateur.nom} · {labelOf(TYPES_ORGANISATEUR, h.organisateur.type)}
          </p>
        </div>

        {/* Navigation par ancres */}
        <nav className="sticky top-16 z-30 -mx-4 mt-6 overflow-x-auto border-b border-slate-200 bg-clair/95 px-4 backdrop-blur" aria-label="Sections du hackathon">
          <ul className="flex gap-6">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block py-3 text-sm font-medium whitespace-nowrap text-slate-600 hover:text-sup">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section id="presentation" className="card scroll-mt-32 p-6">
              <h2 className="text-xl font-semibold">Présentation</h2>
              <p className="mt-3 leading-relaxed text-slate-700">{h.description}</p>
            </section>

            <section id="programme" className="card scroll-mt-32 p-6">
              <h2 className="text-xl font-semibold">Programme</h2>
              {h.programme?.length ? (
                <ol className="mt-4 space-y-4 border-l-2 border-glace pl-6">
                  {h.programme.map((etape, i) => (
                    <li key={i} className="relative">
                      <span className="absolute top-1.5 -left-[31px] h-3 w-3 rounded-full bg-sup ring-4 ring-white" aria-hidden="true" />
                      <p className="text-xs font-semibold text-tech">{etape.moment}</p>
                      <p className="text-slate-700">{etape.titre}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Programme non communiqué pour l’instant.</p>
              )}
            </section>

            <section id="prix" className="card scroll-mt-32 p-6">
              <h2 className="text-xl font-semibold">Prix</h2>
              {h.prix?.length ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {h.prix.map((p) => (
                    <li key={p} className="flex items-start gap-3 rounded-xl bg-glace p-4 text-sm text-navy">
                      <Trophy className="h-5 w-5 shrink-0 text-sup" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Prix non communiqués pour l’instant.</p>
              )}
            </section>

            <section id="reglement" className="card scroll-mt-32 p-6">
              <h2 className="text-xl font-semibold">Règlement</h2>
              <p className="mt-3 text-slate-700">{h.reglement || 'Aucun règlement particulier.'}</p>
              <p className="mt-2 text-sm text-slate-500">Taille maximale d’une équipe : {h.tailleEquipeMax ? `${h.tailleEquipeMax} personnes` : A_CONFIRMER.toLowerCase()}.</p>
            </section>
          </div>

          {/* Carte d'inscription (reste visible au défilement) */}
          <aside>
            <div className="card sticky top-32 space-y-5 p-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-tech" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-navy">Dates</span>
                    {formatPeriode(h.dateDebut, h.dateFin)}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {h.format === 'en-ligne' ? <Globe className="h-5 w-5 text-tech" aria-hidden="true" /> : <MapPin className="h-5 w-5 text-tech" aria-hidden="true" />}
                  <span>
                    <span className="block font-medium text-navy">Lieu</span>
                    {h.lieu}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CalendarClock className="h-5 w-5 text-tech" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-navy">Inscriptions jusqu’au</span>
                    {h.dateLimite ? formatDate(h.dateLimite) : A_CONFIRMER}
                    {h.statut === 'a-venir' && jours !== null && jours >= 0 && <span className="text-sup"> · J-{jours}</span>}
                  </span>
                </li>
              </ul>

              {h.places ? (
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <Users className="h-4 w-4 text-tech" aria-hidden="true" /> Places
                    </span>
                    <span className="text-slate-600">
                      {h.inscrits} / {h.places}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-glace" role="progressbar" aria-valuenow={remplissage} aria-valuemin={0} aria-valuemax={100} aria-label="Taux de remplissage">
                    <div className="h-full rounded-full bg-tech" style={{ width: `${remplissage}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{h.placesRestantes} places restantes</p>
                </div>
              ) : (
                <p className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-navy">
                    <Users className="h-4 w-4 text-tech" aria-hidden="true" /> Places
                  </span>
                  <span className="text-slate-600">{A_CONFIRMER}</span>
                </p>
              )}

              <ActionInscription hackathon={h} dejaInscrit={dejaInscrit} user={user} />

              {h.lien && (
                <a href={h.lien} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                  Site officiel <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {h.source && (
                <p className="text-center text-xs text-slate-500">
                  Source :{' '}
                  <a href={h.source} target="_blank" rel="noopener noreferrer" className="text-tech underline-offset-2 hover:underline">
                    {new URL(h.source).hostname.replace(/^www\./, '')}
                  </a>
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
