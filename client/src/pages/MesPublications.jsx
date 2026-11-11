import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, Eye, Megaphone, Plus, Trash2 } from 'lucide-react';
import { EmptyState, ErrorMessage, PageHeader, Spinner } from '../components/ui';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { domaineOf, statutOf } from '../data/constants';
import { formatDate, formatPeriode } from '../utils/format';

const MODES = { solo: 'Solo', creer: 'Chef d’équipe', rejoindre: 'Membre d’équipe' };

function exporterCsv(hackathon, inscrits) {
  const lignes = [
    ['Nom', 'E-mail', 'Université', 'Participation', 'Équipe', 'Code équipe', 'Date d’inscription'],
    ...inscrits.map((i) => [i.nom, i.email, i.universite || '', MODES[i.mode], i.equipe?.nom || '', i.equipe?.code || '', formatDate(i.createdAt)]),
  ];
  const csv = lignes.map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  // \uFEFF (BOM) : pour qu'Excel affiche correctement les accents
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inscrits-${hackathon.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // On libère l'URL un peu plus tard : la libérer tout de suite peut annuler le téléchargement (Firefox, Safari)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Publication({ hackathon, onSupprimer }) {
  const { notify } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [inscrits, setInscrits] = useState(null);
  const [confirmer, setConfirmer] = useState(false);
  const statut = statutOf(hackathon.statut);

  const basculer = async () => {
    setOuvert((o) => !o);
    if (!inscrits) {
      try {
        const data = await api.getInscrits(hackathon.id);
        setInscrits(data.inscrits);
      } catch (err) {
        notify(err.message, 'error');
        setInscrits([]);
      }
    }
  };

  return (
    <li className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${domaineOf(hackathon.domaine).color}`}>{domaineOf(hackathon.domaine).label}</span>
            <span className={`badge ${statut.color}`}>{statut.label}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{hackathon.titre}</h3>
          <p className="text-sm text-slate-500">
            {formatPeriode(hackathon.dateDebut, hackathon.dateFin)} · {hackathon.region}
          </p>
        </div>
        <div className="text-center sm:px-4">
          <p className="font-display text-2xl font-bold text-navy">
            {hackathon.inscrits}
            <span className="text-base text-slate-400">/{hackathon.places}</span>
          </p>
          <p className="text-xs text-slate-500">inscrits</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/hackathons/${hackathon.id}`} className="btn btn-ghost px-3" aria-label={`Voir ${hackathon.titre}`}>
            <Eye className="h-4 w-4" aria-hidden="true" /> Voir
          </Link>
          <button type="button" onClick={basculer} className="btn btn-outline px-4 py-2" aria-expanded={ouvert}>
            Inscrits <ChevronDown className={`h-4 w-4 transition ${ouvert ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="border-t border-slate-100 bg-clair p-5">
          {!inscrits ? (
            <Spinner />
          ) : inscrits.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun inscrit pour le moment.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Liste des inscrits</caption>
                  <thead className="text-xs text-slate-500 uppercase">
                    <tr>
                      <th scope="col" className="py-2 pr-4">Nom</th>
                      <th scope="col" className="py-2 pr-4">E-mail</th>
                      <th scope="col" className="py-2 pr-4">Participation</th>
                      <th scope="col" className="py-2">Équipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inscrits.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2 pr-4 font-medium text-navy">{i.nom}</td>
                        <td className="py-2 pr-4">{i.email}</td>
                        <td className="py-2 pr-4">{MODES[i.mode]}</td>
                        <td className="py-2">{i.equipe ? `${i.equipe.nom} (${i.equipe.code})` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => exporterCsv(hackathon, inscrits)} className="btn btn-secondary mt-4 px-4 py-2">
                <Download className="h-4 w-4" aria-hidden="true" /> Exporter en CSV
              </button>
            </>
          )}

          <div className="mt-5 border-t border-slate-200 pt-4">
            {confirmer ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>Supprimer définitivement ce hackathon et ses inscriptions ?</span>
                <button type="button" onClick={() => onSupprimer(hackathon.id)} className="btn bg-sup px-4 py-1.5 text-white">
                  Supprimer
                </button>
                <button type="button" onClick={() => setConfirmer(false)} className="btn btn-ghost px-4 py-1.5">
                  Annuler
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmer(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-sup hover:underline">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer ce hackathon
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function MesPublications() {
  const { notify } = useToast();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const charger = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .getMesPublications()
      .then((data) => setHackathons(data.hackathons))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(charger, [charger]);

  const supprimer = async (id) => {
    try {
      await api.supprimerHackathon(id);
      setHackathons((list) => list.filter((h) => h.id !== id));
      notify('Hackathon supprimé.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <>
      <PageHeader title="Mes publications" subtitle="Suis les inscriptions des hackathons que tu as publiés.">
        <Link to="/publier" className="btn btn-primary mt-6">
          <Plus className="h-4 w-4" aria-hidden="true" /> Publier un hackathon
        </Link>
      </PageHeader>
      <div className="container-page max-w-4xl py-10">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={charger} />
        ) : hackathons.length === 0 ? (
          <EmptyState icon={Megaphone} title="Tu n’as encore rien publié" text="Publie ton premier hackathon : il sera visible par tous les étudiants." actionLabel="Publier un hackathon" actionTo="/publier" />
        ) : (
          <ul className="space-y-4">
            {hackathons.map((h) => (
              <Publication key={h.id} hackathon={h} onSupprimer={supprimer} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
