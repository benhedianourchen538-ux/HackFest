import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Logo } from '../components/layout/Navbar';
import { Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIDE = { nom: '', email: '', universite: '', password: '', confirmation: '' };

export default function Connexion() {
  const { user, login, register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'inscription' ? 'inscription' : 'connexion');
  const [form, setForm] = useState(VIDE);
  const [errors, setErrors] = useState({});
  const [voirMdp, setVoirMdp] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  // On ne garde que les redirections internes (sécurité)
  const redirectParam = params.get('redirect') || '';
  const redirect = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/hackathons';

  if (user && !envoi) return <Navigate to={redirect} replace />;

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  const changerMode = (m) => {
    setMode(m);
    setErrors({});
  };

  const valider = () => {
    const errs = {};
    if (mode === 'inscription' && form.nom.trim().length < 2) errs.nom = 'Indique ton nom complet.';
    if (!EMAIL_RE.test(form.email)) errs.email = 'Adresse e-mail invalide.';
    if (mode === 'inscription') {
      if (form.password.length < 8) errs.password = 'Au moins 8 caractères.';
      if (form.confirmation !== form.password) errs.confirmation = 'Les mots de passe ne correspondent pas.';
    } else if (!form.password) {
      errs.password = 'Mot de passe requis.';
    }
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = valider();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setEnvoi(true);
    try {
      const u =
        mode === 'connexion'
          ? await login(form.email, form.password)
          : await register({ nom: form.nom, email: form.email, universite: form.universite, password: form.password });
      notify(mode === 'connexion' ? `Bon retour, ${u.nom.split(' ')[0]} !` : 'Compte créé, bienvenue sur HackFest !');
      navigate(redirect, { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
      setEnvoi(false);
    }
  };

  const remplirDemo = () => {
    setMode('connexion');
    setErrors({});
    setForm({ ...VIDE, email: 'demo@hackfest.tn', password: 'demo1234' });
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Panneau visuel */}
      <div className="bg-network hidden flex-col justify-between p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h1 className="text-4xl leading-tight font-bold text-white">
            Rejoins la communauté des <span className="text-corail">innovateurs</span>
          </h1>
          <p className="mt-4 max-w-md text-white/80">Inscris-toi aux hackathons en un clic, forme ton équipe et publie tes propres événements.</p>
        </div>
        <p className="text-sm text-white/60">Coder • Innover • Collaborer</p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold">{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</h2>
          {redirectParam && <p className="mt-2 text-sm text-slate-500">Connecte-toi pour continuer.</p>}

          <div className="mt-6 grid grid-cols-2 rounded-full bg-white p-1 ring-1 ring-slate-200" role="tablist">
            {[
              ['connexion', 'Connexion'],
              ['inscription', 'Inscription'],
            ].map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => changerMode(m)}
                className={`rounded-full py-2 text-sm font-semibold transition ${mode === m ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'inscription' && (
              <>
                <Field label="Nom complet" id="nom" error={errors.nom}>
                  <input id="nom" name="nom" className="input" value={form.nom} onChange={update} autoComplete="name" />
                </Field>
                <Field label="Université / école (facultatif)" id="universite">
                  <input id="universite" name="universite" className="input" value={form.universite} onChange={update} placeholder="Ex. SUP'COM" />
                </Field>
              </>
            )}
            <Field label="E-mail" id="email" error={errors.email}>
              <input id="email" name="email" type="email" className="input" value={form.email} onChange={update} autoComplete="email" />
            </Field>
            <Field label="Mot de passe" id="password" error={errors.password} hint={mode === 'inscription' ? '8 caractères minimum.' : undefined}>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={voirMdp ? 'text' : 'password'}
                  className="input pr-11"
                  value={form.password}
                  onChange={update}
                  autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setVoirMdp((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-navy"
                  aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {voirMdp ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            {mode === 'inscription' && (
              <Field label="Confirmer le mot de passe" id="confirmation" error={errors.confirmation}>
                <input id="confirmation" name="confirmation" type={voirMdp ? 'text' : 'password'} className="input" value={form.confirmation} onChange={update} autoComplete="new-password" />
              </Field>
            )}

            <button type="submit" className="btn btn-primary w-full py-3" disabled={envoi}>
              {envoi ? 'Patiente…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          {mode === 'connexion' && (
            <div className="mt-6 rounded-xl bg-glace p-4 text-sm text-navy">
              <p className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-tech" aria-hidden="true" /> Compte de démonstration
              </p>
              <p className="mt-1 text-slate-600">demo@hackfest.tn · demo1234</p>
              <button type="button" onClick={remplirDemo} className="mt-2 font-semibold text-tech hover:underline">
                Remplir automatiquement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
