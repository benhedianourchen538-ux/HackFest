// Petits composants d'interface réutilisés sur plusieurs pages.
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';

export function Spinner({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-tech" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, actionLabel, actionTo, onAction }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-glace p-4">
          <Icon className="h-8 w-8 text-tech" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm text-slate-500">{text}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-outline mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="card border-sup/30 bg-red-50 p-6 text-center" role="alert">
      <p className="text-sm text-sup">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline mt-4">
          Réessayer
        </button>
      )}
    </div>
  );
}

/** Indicateur d'étapes pour les formulaires (inscription, publication) */
export function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Étapes du formulaire">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                done ? 'bg-menthe text-white' : active ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`hidden text-sm sm:inline ${active ? 'font-semibold text-navy' : 'text-slate-500'}`}>{step}</span>
            {index < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${done ? 'bg-menthe' : 'bg-slate-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

/** Champ de formulaire avec label et message d'erreur */
export function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <section className="bg-network text-white">
      <div className="container-page py-12 sm:py-14">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-white/80">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
