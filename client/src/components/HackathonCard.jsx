import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import Cover from './Cover';
import { domaineOf, labelOf, statutOf, TYPES_ORGANISATEUR } from '../data/constants';
import { formatPeriode } from '../utils/format';

export default function HackathonCard({ hackathon, inscrit = false }) {
  const domaine = domaineOf(hackathon.domaine);
  const statut = statutOf(hackathon.statut);

  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <Cover domaine={hackathon.domaine} className="h-36" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`badge ${domaine.color}`}>{domaine.label}</span>
          {hackathon.statut !== 'a-venir' && <span className={`badge ${statut.color}`}>{statut.label}</span>}
        </div>
        {inscrit && <span className="badge absolute top-3 right-3 bg-menthe text-white">Inscrit(e)</span>}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="truncate">{hackathon.organisateur.nom}</span>
          <span aria-hidden="true">·</span>
          <span>{labelOf(TYPES_ORGANISATEUR, hackathon.organisateur.type)}</span>
        </p>

        <h3 className="text-lg leading-snug font-semibold">
          <Link to={`/hackathons/${hackathon.id}`} className="after:absolute after:inset-0 focus:outline-none">
            {hackathon.titre}
          </Link>
        </h3>

        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-tech" aria-hidden="true" />
            {formatPeriode(hackathon.dateDebut, hackathon.dateFin)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-tech" aria-hidden="true" />
            {hackathon.region}
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-tech" aria-hidden="true" />
            {hackathon.statut === 'termine' ? `${hackathon.inscrits} participants` : `${hackathon.placesRestantes} places restantes`}
          </li>
        </ul>

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-sup">
          Voir les détails
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
