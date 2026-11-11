import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Compass, Handshake, Lightbulb, Rocket, Send, Target, Trophy, UserPlus } from 'lucide-react';
import HackathonCard from '../components/HackathonCard';
import { Field, Spinner } from '../components/ui';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DOMAINES } from '../data/constants';

const ETAPES = [
  { icon: Compass, titre: 'Découvrir', texte: 'Filtre les hackathons par domaine, région ou organisateur.' },
  { icon: UserPlus, titre: 'S’inscrire', texte: 'Crée ton compte et rejoins un hackathon en solo ou en équipe.' },
  { icon: Trophy, titre: 'Participer', texte: 'Retrouve tes événements à venir et relève les défis.' },
];

const VALEURS = [
  { icon: Lightbulb, titre: 'Innovation', texte: 'Donner à chaque étudiant l’occasion de transformer une idée en prototype.' },
  { icon: Handshake, titre: 'Collaboration', texte: 'Réunir des profils de toutes les facultés et de toutes les régions.' },
  { icon: Target, titre: 'Impact', texte: 'Mettre en avant les défis qui comptent : santé, environnement, éducation…' },
];

const FAQ = [
  { q: 'Faut-il un compte pour voir les hackathons ?', r: 'Non. Tout le monde peut parcourir et filtrer les hackathons. Un compte est demandé uniquement pour s’inscrire ou publier un hackathon.' },
  { q: 'Puis-je participer sans équipe ?', r: 'Oui. Lors de l’inscription, tu choisis de participer en solo, de créer une équipe (tu reçois un code à partager) ou de rejoindre une équipe avec son code.' },
  { q: 'La participation est-elle payante ?', r: 'L’inscription sur HackFest est gratuite. Certains organisateurs peuvent demander une participation : l’information figure alors dans le règlement du hackathon.' },
  { q: 'Qui peut publier un hackathon ?', r: 'Les universités, les clubs étudiants et les organisations. Il suffit de se connecter puis de remplir le formulaire « Publier ».' },
  { q: 'Comment annuler mon inscription ?', r: 'Va dans « Mes événements » et clique sur « Annuler » sur le hackathon concerné.' },
];

function FaqItem({ item, open, onToggle, index }) {
  return (
    <div className="card overflow-hidden">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-base font-semibold text-navy"
          aria-expanded={open}
          aria-controls={`faq-${index}`}
        >
          {item.q}
          <ChevronDown className={`h-5 w-5 shrink-0 text-tech transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <p id={`faq-${index}`} className="px-5 pb-5 text-sm text-slate-600">
          {item.r}
        </p>
      )}
    </div>
  );
}

function ContactForm() {
  const { notify } = useToast();
  const [form, setForm] = useState({ nom: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Indique ton nom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail invalide.';
    if (form.message.trim().length < 10) errs.message = 'Message trop court (10 caractères min.).';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await api.envoyerMessage(form);
      notify('Message envoyé, nous te répondrons rapidement.');
      setForm({ nom: '', email: '', message: '' });
    } catch (err) {
      setErrors(err.errors || {});
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" id="contact-nom" error={errors.nom}>
          <input id="contact-nom" name="nom" className="input" value={form.nom} onChange={update} autoComplete="name" />
        </Field>
        <Field label="E-mail" id="contact-email" error={errors.email}>
          <input id="contact-email" name="email" type="email" className="input" value={form.email} onChange={update} autoComplete="email" />
        </Field>
      </div>
      <Field label="Message" id="contact-message" error={errors.message}>
        <textarea id="contact-message" name="message" rows={4} className="input" value={form.message} onChange={update} />
      </Field>
      <button type="submit" className="btn btn-secondary" disabled={sending}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {sending ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}

export default function Accueil() {
  const { user } = useAuth();
  const [prochains, setProchains] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(0);

  useEffect(() => {
    api
      .getHackathons()
      .then(({ hackathons }) => {
        const ouverts = hackathons.filter((h) => h.statut === 'a-venir');
        setProchains(ouverts.slice(0, 3));
        setStats({
          hackathons: ouverts.length,
          organisateurs: new Set(hackathons.map((h) => h.organisateur.nom)).size,
          regions: new Set(hackathons.map((h) => h.region)).size,
        });
      })
      .catch(() => setProchains([]))
      .finally(() => setLoading(false));
  }, []);

  const prochain = prochains[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-network text-white">
        <div className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="badge bg-white/10 text-white ring-1 ring-white/20">Hackathons étudiants en Tunisie</p>
            <h1 className="mt-5 text-4xl leading-tight font-bold text-white sm:text-5xl">
              Hackathon <br />
              Student <span className="text-corail">Innovation</span>
            </h1>
            <p className="mt-4 text-lg text-white/85">Coder • Innover • Collaborer</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/hackathons" className="btn btn-primary">
                Explorer les hackathons <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {user ? (
                <Link to="/publier" className="btn border-2 border-white text-white hover:bg-white hover:text-navy">
                  Publier un hackathon
                </Link>
              ) : (
                <Link to="/connexion" className="btn border-2 border-white text-white hover:bg-white hover:text-navy">
                  Se connecter
                </Link>
              )}
            </div>
          </div>

          {prochain && (
            <Link to={`/hackathons/${prochain.id}`} className="card block p-6 text-texte transition hover:shadow-lg lg:col-span-2">
              <p className="text-xs font-semibold tracking-wide text-sup uppercase">Prochain hackathon</p>
              <p className="mt-2 font-display text-xl font-semibold text-navy">{prochain.titre}</p>
              <p className="mt-1 text-sm text-slate-500">
                {prochain.region} · {prochain.organisateur.nom}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sup">
                En savoir plus <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Chiffres clés */}
      {stats && (
        <section className="container-page -mt-8 relative z-10">
          <dl className="card grid grid-cols-3 divide-x divide-slate-200 py-5 text-center">
            {[
              [stats.hackathons, 'hackathons à venir'],
              [stats.organisateurs, 'organisateurs'],
              [stats.regions, 'régions'],
            ].map(([valeur, label]) => (
              <div key={label} className="px-2">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold text-navy sm:text-3xl">{valeur}</dd>
                <dd className="text-xs text-slate-500 sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Prochains hackathons */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Prochains hackathons</h2>
            <p className="mt-2 text-slate-500">Les inscriptions sont ouvertes, ne les rate pas.</p>
          </div>
          <Link to="/hackathons" className="btn btn-outline">
            Voir tous les hackathons
          </Link>
        </div>
        {loading ? (
          <Spinner />
        ) : prochains.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prochains.map((h) => (
              <HackathonCard key={h.id} hackathon={h} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-slate-500">Aucun hackathon à afficher pour l’instant (l’API est-elle lancée ?).</p>
        )}

        <div className="mt-10 flex flex-wrap gap-2">
          <span className="mr-2 self-center text-sm font-medium text-navy">Par domaine :</span>
          {DOMAINES.map((d) => (
            <Link key={d.value} to={`/hackathons?domaine=${d.value}`} className={`badge ${d.color} hover:ring-2 hover:ring-tech/30`}>
              {d.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-glace py-16">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Comment ça marche ?</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white">
                  <e.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-4 text-xs font-semibold text-sup">Étape {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{e.titre}</h3>
                <p className="mt-2 text-sm text-slate-600">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Qui sommes-nous */}
      <section id="a-propos" className="container-page scroll-mt-20 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-sup">Qui sommes-nous ?</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Innovons ensemble pour <span className="text-sup">un impact durable</span>
            </h2>
            <p className="mt-4 text-slate-600">
              HackFest est né d’un constat simple : les hackathons étudiants sont nombreux mais dispersés sur les réseaux sociaux. Nous les réunissons sur une
              seule plateforme pour que chaque étudiant, quelle que soit sa faculté ou sa région, trouve le défi qui lui correspond.
            </p>
            <p className="mt-3 text-slate-600">
              Les universités, clubs et organisations y publient leurs événements et gèrent leurs inscriptions simplement.
            </p>
          </div>
          <ul className="grid gap-4">
            {VALEURS.map((v) => (
              <li key={v.titre} className="card flex gap-4 p-5">
                <div className="rounded-xl bg-glace p-3">
                  <v.icon className="h-6 w-6 text-tech" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">{v.titre}</h3>
                  <p className="mt-1 text-sm text-slate-600">{v.texte}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-glace py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} item={item} index={i} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? -1 : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact + CTA */}
      <section id="contact" className="container-page scroll-mt-20 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Une question ? Écris-nous</h2>
            <p className="mt-3 text-slate-600">Tu organises un hackathon ou tu as une suggestion ? Nous te répondrons rapidement.</p>
            <div className="card mt-8 flex items-center gap-4 bg-navy p-6 text-white">
              <Rocket className="h-10 w-10 shrink-0 text-corail" aria-hidden="true" />
              <div>
                <p className="font-display text-lg font-semibold">Tu organises un hackathon ?</p>
                <Link to="/publier" className="mt-1 inline-flex items-center gap-1 text-sm text-white/85 underline-offset-4 hover:underline">
                  Publie-le gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
