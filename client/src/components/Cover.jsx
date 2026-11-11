import { Code, Cpu, GraduationCap, HandHeart, HeartPulse, Leaf, ShieldCheck, Wallet } from 'lucide-react';

// Visuel généré (pas d'image à télécharger = chargement rapide)
const ICONS = {
  'tech-ia': Cpu,
  environnement: Leaf,
  sante: HeartPulse,
  fintech: Wallet,
  education: GraduationCap,
  'impact-social': HandHeart,
  cybersecurite: ShieldCheck,
  programmation: Code,
};

export default function Cover({ domaine, className = '', size = 'md' }) {
  const Icon = ICONS[domaine] ?? Cpu;
  const iconSize = size === 'lg' ? 'h-16 w-16' : 'h-10 w-10';
  return (
    <div className={`bg-network relative flex items-center justify-center overflow-hidden ${className}`} aria-hidden="true">
      <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
        <Icon className={`${iconSize} text-white`} strokeWidth={1.5} />
      </div>
    </div>
  );
}
