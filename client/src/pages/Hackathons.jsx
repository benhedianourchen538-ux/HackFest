import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import HackathonCard from '../components/HackathonCard';
import { EmptyState, ErrorMessage, PageHeader, Spinner } from '../components/ui';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DOMAINES, FORMATS, REGIONS, STATUTS, TRIS, TYPES_ORGANISATEUR, labelOf } from '../data/constants';

// Filtres à choix multiples (stockés dans l'URL : ?domaine=sante,fintech)
const GROUPES = [
  { key: 'organisateur', titre: 'Organisé par', options: TYPES_ORGANISATEUR },
  { key: 'domaine', titre: 'Domaine', options: DOMAINES },
  { key: 'statut', titre: 'Statut', options: STATUTS },
  { key: 'format', titre: 'Format', options: FORMATS },
];

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Hackathons() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [hackathons, setHackathons] = useState([]);
  const [mesIds, setMesIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [recherche, setRecherche] = useState(params.get('q') || '');
  const q = useDebounce(recherche);

  const getList = useCallback((key) => (params.get(key) ? params.get(key).split(',') : []), [params]);

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      if (!value || (Array.isArray(value) && !value.length)) next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(',') : value);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const toggle = (key, value) => {
    const list = getList(key);
    setParam(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // La recherche texte est synchronisée avec l'URL après un court délai
  useEffect(() => {
    if ((params.get('q') || '') !== q) setParam('q', q);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const charger = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .getHackathons(query)
      .then((data) => setHackathons(data.hackathons))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(charger, [charger]);

  // Pour afficher le badge "Inscrit(e)" sur les cartes
  useEffect(() => {
    if (!user) {
      setMesIds(new Set());
      return;
    }
    api
      .getMesInscriptions()
      .then(({ inscriptions }) => setMesIds(new Set(inscriptions.map((i) => i.hackathonId))))
      .catch(() => {});
  }, [user]);

  // Liste des filtres actifs, affichés en "chips" supprimables
  const actifs = [
    ...GROUPES.flatMap((g) => getList(g.key).map((v) => ({ key: g.key, value: v, label: labelOf(g.options, v) }))),
    ...(params.get('region') ? [{ key: 'region', value: params.get('region'), label: params.get('region') }] : []),
  ];

  const retirer = (filtre) => {
    if (filtre.key === 'region') setParam('region', '');
    else toggle(filtre.key, filtre.value);
  };

  const toutEffacer = () => {
    setRecherche('');
    setParams({}, { replace: true });
  };

  const panneauFiltres = (
    <div className="space-y-6">
      <div>
        <label htmlFor="filtre-region" className="label">
          Région
        </label>
        <select id="filtre-region" className="input" value={params.get('region') || ''} onChange={(e) => setParam('region', e.target.value)}>
          <option value="">Toutes les régions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {GROUPES.map((groupe) => (
        <fieldset key={groupe.key}>
          <legend className="label">{groupe.titre}</legend>
          <div className="space-y-2">
            {groupe.options.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-tech"
                  checked={getList(groupe.key).includes(opt.value)}
                  onChange={() => toggle(groupe.key, opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {actifs.length > 0 && (
        <button type="button" onClick={toutEffacer} className="text-sm font-medium text-sup hover:underline">
          Effacer tous les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader title="Hackathons" subtitle="Trouve le hackathon qui te correspond : filtre par organisateur, région ou domaine.">
        <div className="relative mt-6 max-w-xl">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="recherche" className="sr-only">
            Rechercher un hackathon
          </label>
          <input
            id="recherche"
            type="search"
            className="input rounded-full py-3 pl-12"
            placeholder="Rechercher un hackathon, un organisateur, une ville…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </PageHeader>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        {/* Filtres : colonne sur ordinateur */}
        <aside className="hidden lg:block" aria-label="Filtres">
          <div className="card sticky top-24 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtres
            </h2>
            {panneauFiltres}
          </div>
        </aside>

        <section aria-label="Résultats">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              {loading ? 'Recherche…' : `${hackathons.length} hackathon${hackathons.length > 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFiltresOuverts(true)} className="btn btn-outline px-4 py-2 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtres {actifs.length > 0 && `(${actifs.length})`}
              </button>
              <label htmlFor="tri" className="sr-only">
                Trier par
              </label>
              <select id="tri" className="input w-auto py-2" value={params.get('tri') || 'date'} onChange={(e) => setParam('tri', e.target.value === 'date' ? '' : e.target.value)}>
                {TRIS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {actifs.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Filtres actifs">
              {actifs.map((f) => (
                <li key={`${f.key}-${f.value}`}>
                  <button type="button" onClick={() => retirer(f)} className="badge bg-navy text-white hover:bg-tech" aria-label={`Retirer le filtre ${f.label}`}>
                    {f.label} <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            {loading ? (
              <Spinner />
            ) : error ? (
              <ErrorMessage message={error} onRetry={charger} />
            ) : hackathons.length === 0 ? (
              <EmptyState icon={SearchX} title="Aucun hackathon trouvé" text="Essaie d’autres mots-clés ou retire quelques filtres." actionLabel="Effacer les filtres" onAction={toutEffacer} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {hackathons.map((h) => (
                  <HackathonCard key={h.id} hackathon={h} inscrit={mesIds.has(h.id)} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Filtres : panneau plein écran sur mobile */}
      {filtresOuverts && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtres</h2>
              <button type="button" onClick={() => setFiltresOuverts(false)} aria-label="Fermer les filtres" className="rounded-full p-2 hover:bg-glace">
                <X className="h-5 w-5" />
              </button>
            </div>
            {panneauFiltres}
            <button type="button" onClick={() => setFiltresOuverts(false)} className="btn btn-primary mt-6 w-full">
              Voir {hackathons.length} résultat{hackathons.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
