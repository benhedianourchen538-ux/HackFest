import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-sup">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-slate-500">La page que tu cherches n’existe pas ou a été déplacée.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn btn-primary">
          Retour à l’accueil
        </Link>
        <Link to="/hackathons" className="btn btn-outline">
          Voir les hackathons
        </Link>
      </div>
    </div>
  );
}
