import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmptyState, Spinner } from './ui';

/**
 * Redirige vers /connexion si l'utilisateur n'est pas connecté, puis le ramène ici après connexion.
 * roles (facultatif) : rôles autorisés ; les autres voient une explication (le serveur refuse aussi avec une 403).
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Page réservée aux organisateurs"
          text="Ton compte est un compte participant : tu peux t’inscrire aux hackathons, mais pas en publier. Pour publier, crée un compte organisateur."
          actionLabel="Voir les hackathons"
          actionTo="/hackathons"
        />
      </div>
    );
  }
  return children;
}
