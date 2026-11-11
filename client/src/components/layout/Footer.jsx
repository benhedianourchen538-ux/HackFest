import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { Logo } from './Navbar';

export default function Footer() {
  return (
    <footer className="bg-network mt-auto text-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-white/75">
            La plateforme qui réunit les hackathons étudiants de Tunisie : découvre, inscris-toi, publie. Coder • Innover • Collaborer.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Navigation</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link to="/hackathons" className="hover:text-white">Hackathons</Link></li>
            <li><Link to="/publier" className="hover:text-white">Publier un hackathon</Link></li>
            <li><Link to="/#a-propos" className="hover:text-white">À propos</Link></li>
            <li><Link to="/#faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden="true" /> contact@hackfest.tn
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Tunis, Tunisie
            </li>
            <li><Link to="/#contact" className="hover:text-white">Nous écrire</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="container-page py-5 text-xs text-white/60">© {new Date().getFullYear()} HackFest · Projet Web, SUP'COM</p>
      </div>
    </footer>
  );
}
