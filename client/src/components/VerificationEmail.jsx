import { useEffect, useState } from 'react';
import { ArrowLeft, MailCheck, RotateCw } from 'lucide-react';
import { Field } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { VERIFICATION } from '../data/constants';

/**
 * Écran "Vérifie ton e-mail" : saisie du code à 6 chiffres reçu par e-mail.
 * onVerifie(user) est appelé quand le code est bon (l'utilisateur est alors connecté).
 */
export default function VerificationEmail({ email, onModifier, onVerifie }) {
  const { verifierEmail } = useAuth();
  const { notify } = useToast();
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  // Compte à rebours avant de pouvoir redemander un code (même délai que le serveur)
  const [attente, setAttente] = useState(VERIFICATION.delaiRenvoiSecondes);

  useEffect(() => {
    if (attente <= 0) return undefined;
    const minuteur = setTimeout(() => setAttente((a) => a - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [attente]);

  // On ne garde que les 6 premiers chiffres (le code peut être collé avec des espaces : "482 913").
  // Pas de maxLength sur le champ : il couperait le texte collé AVANT qu'on retire les espaces.
  const changerCode = (e) => {
    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
    setErreur('');
  };

  const valider = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErreur('Saisis le code à 6 chiffres.');
      return;
    }
    setEnvoi(true);
    try {
      const user = await verifierEmail(email, code);
      onVerifie(user);
    } catch (err) {
      setErreur(err.message);
      notify(err.message, 'error');
      setEnvoi(false);
    }
  };

  const renvoyer = async () => {
    try {
      await api.renvoyerCode(email);
      notify(`Un nouveau code a été envoyé à ${email}.`, 'info');
      setCode('');
      setErreur('');
      setAttente(VERIFICATION.delaiRenvoiSecondes);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-glace">
        <MailCheck className="h-7 w-7 text-tech" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-2xl font-bold">Vérifie ton adresse e-mail</h2>
      <p className="mt-2 text-sm text-slate-600">
        On t’a envoyé un code à 6 chiffres à <strong className="text-navy">{email}</strong>. Il est valable {VERIFICATION.dureeMinutes} minutes.
        Pense à regarder dans les spams.
      </p>

      <form onSubmit={valider} className="mt-6 space-y-4" noValidate>
        <Field label="Code de vérification" id="code" error={erreur}>
          <input
            id="code"
            name="code"
            className="input text-center font-display text-2xl font-semibold tracking-[0.5em]"
            value={code}
            onChange={changerCode}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            autoFocus
            aria-invalid={Boolean(erreur)}
            aria-describedby={erreur ? 'code-error' : undefined}
          />
        </Field>
        <button type="submit" className="btn btn-primary w-full py-3" disabled={envoi}>
          {envoi ? 'Vérification…' : 'Vérifier et me connecter'}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" onClick={onModifier} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-navy">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Modifier l’adresse
        </button>
        <button type="button" onClick={renvoyer} disabled={attente > 0} className="inline-flex items-center gap-1 font-semibold text-tech hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {attente > 0 ? `Renvoyer le code (${attente} s)` : 'Renvoyer le code'}
        </button>
      </div>
    </div>
  );
}
