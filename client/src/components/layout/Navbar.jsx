import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutList, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LIENS_VISITEUR = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/hackathons', label: 'Hackathons' },
  { to: '/#a-propos', label: 'À propos', hash: true },
  { to: '/#faq', label: 'FAQ', hash: true },
];

const LIENS_CONNECTE = [
  { to: '/hackathons', label: 'Hackathons' },
  { to: '/mes-evenements', label: 'Mes événements' },
  { to: '/publier', label: 'Publier' },
];

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="HackFest, retour à l'accueil">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sup font-display text-lg font-bold text-white">H</span>
      <span className={`font-display text-xl font-bold ${light ? 'text-white' : 'text-navy'}`}>
        Hack<span className="text-sup">Fest</span>
      </span>
    </Link>
  );
}

function initiales(nom = '') {
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const liens = user ? LIENS_CONNECTE : LIENS_VISITEUR;

  // Ferme les menus quand on change de page
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Ferme le menu profil au clic à l'extérieur
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    notify('Tu es déconnecté(e). À bientôt !', 'info');
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `relative py-2 text-sm font-medium transition hover:text-sup ${isActive ? 'text-navy after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:bg-sup' : 'text-slate-600'}`;

  const renderLink = (lien) =>
    lien.hash ? (
      <Link key={lien.to} to={lien.to} className="py-2 text-sm font-medium text-slate-600 transition hover:text-sup">
        {lien.label}
      </Link>
    ) : (
      <NavLink key={lien.to} to={lien.to} end={lien.end} className={linkClass}>
        {lien.label}
      </NavLink>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Navigation principale">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">{liens.map(renderLink)}</div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-glace"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">{initiales(user.nom)}</span>
                <span className="max-w-32 truncate text-sm font-medium text-navy">{user.nom.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div role="menu" className="card absolute right-0 mt-2 w-60 overflow-hidden py-2">
                  <div className="border-b border-slate-100 px-4 pb-2">
                    <p className="text-sm font-semibold text-navy">{user.nom}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link role="menuitem" to="/mes-publications" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-glace">
                    <LayoutList className="h-4 w-4 text-tech" aria-hidden="true" /> Mes publications
                  </Link>
                  <button role="menuitem" type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-sup hover:bg-red-50">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/connexion" className="btn btn-primary">
              Se connecter
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="menu-mobile"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div id="menu-mobile" className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {liens.map(renderLink)}
            {user ? (
              <>
                <Link to="/mes-publications" className="py-2 text-sm font-medium text-slate-600">
                  Mes publications
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-outline mt-3">
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link to="/connexion" className="btn btn-primary mt-3">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
