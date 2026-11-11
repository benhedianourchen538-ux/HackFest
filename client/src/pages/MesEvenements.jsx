import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CalendarX, MapPin, Users } from 'lucide-react';
import Cover from '../components/Cover';
import { EmptyState, ErrorMessage, PageHeader, Spinner } from '../components/ui';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { domaineOf } from '../data/constants';
import { formatPeriode, joursAvant } from '../utils/format';

const ONGLETS = [
  { value: 'a-venir', label: 'À venir' },
  { value: 'passes', label: 'Passés' },
];

function EvenementItem({ inscription, onAnnuler }) {
  const [confirmer, setConfirmer] = useState(false);
  const h = inscription.hackathon;
  const jours = joursAvant(h.dateDebut);
  const aVenir = h.statut === 'a-venir';

  return (
    <li className="card flex flex-col overflow-hidden sm:flex-row">
      <Cover domaine={h.domaine} className="h-28 sm:h-auto sm:w-40" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${domaineOf(h.domaine).color}`}>{domaineOf(h.domaine).label}</span>
          <span className="badge bg-emerald-50 text-emerald-700">Confirmé</span>
          {aVenir && <span className="badge bg-red-50 text-sup">{jours === 0 ? 'Aujourd’hui' : `Dans ${jours} jour${jours > 1 ? 's' : ''}`}</span>}
          {h.statut === 'en-cours' && <span className="badge bg-emerald-50 text-emerald-700">En cours</span>}
        </div>
        <h3 className="text-lg font-semibold">
          <Link to={`/hackathons/${h.id}`} className="hover:text-sup">
            {h.titre}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          <li className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-tech" aria-hidden="true" />
            {formatPeriode(h.dateDebut, h.dateFin)}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-tech" aria-hidden="true" />
            {h.lieu}
          </li>
        </ul>
        {inscription.equipe ? (
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            <Users className="h-4 w-4 text-tech" aria-hidden="true" />
            Équipe <strong className="text-navy">{inscription.equipe.nom}</strong>
            <span className="rounded bg-glace px-2 py-0.5 font-mono text-xs text-navy">{inscription.equipe.code}</span>
            <span className="text-slate-500">· {inscription.membres.join(', ')}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">Participation en solo</p>
        )}

        {aVenir && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {confirmer ? (
              <>
                <span className="text-sm text-slate-600">Annuler ton inscription ?</span>
                <button type="button" onClick={() => onAnnuler(inscription.id)} className="btn bg-sup px-4 py-1.5 text-white">
                  Oui, annuler
                </button>
                <button type="button" onClick={() => setConfirmer(false)} className="btn btn-ghost px-4 py-1.5">
                  Non
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmer(true)} className="text-sm font-medium text-sup hover:underline">
                Annuler mon inscription
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function MesEvenements() {
  const { notify } = useToast();
  const [inscriptions, setInscriptions] = useState([]);
  const [onglet, setOnglet] = useState('a-venir');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const charger = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .getMesInscriptions()
      .then((data) => setInscriptions(data.inscriptions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(charger, [charger]);

  const annuler = async (inscriptionId) => {
    try {
      await api.annulerInscription(inscriptionId);
      setInscriptions((list) => list.filter((i) => i.id !== inscriptionId));
      notify('Inscription annulée.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const aVenir = inscriptions.filter((i) => i.hackathon.statut !== 'termine');
  const passes = inscriptions.filter((i) => i.hackathon.statut === 'termine').reverse();
  const liste = onglet === 'a-venir' ? aVenir : passes;

  return (
    <>
      <PageHeader title="Mes événements" subtitle="Retrouve les hackathons auxquels tu es inscrit(e)." />
      <div className="container-page max-w-4xl py-10">
        <div className="flex gap-2 border-b border-slate-200" role="tablist">
          {ONGLETS.map((o) => {
            const count = o.value === 'a-venir' ? aVenir.length : passes.length;
            return (
              <button
                key={o.value}
                type="button"
                role="tab"
                aria-selected={onglet === o.value}
                onClick={() => setOnglet(o.value)}
                className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${onglet === o.value ? 'border-sup text-navy' : 'border-transparent text-slate-500 hover:text-navy'}`}
              >
                {o.label} <span className="ml-1 rounded-full bg-glace px-2 py-0.5 text-xs text-tech">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorMessage message={error} onRetry={charger} />
          ) : liste.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title={onglet === 'a-venir' ? 'Aucune inscription pour l’instant' : 'Aucun hackathon passé'}
              text={onglet === 'a-venir' ? 'Découvre les hackathons ouverts et inscris-toi en quelques clics.' : 'Tes participations terminées apparaîtront ici.'}
              actionLabel={onglet === 'a-venir' ? 'Découvrir les hackathons' : undefined}
              actionTo="/hackathons"
            />
          ) : (
            <ul className="space-y-4">
              {liste.map((i) => (
                <EvenementItem key={i.id} inscription={i} onAnnuler={annuler} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
