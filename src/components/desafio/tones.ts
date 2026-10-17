import { Beef, CandyOff, Droplets, Dumbbell, Footprints, HeartPulse, Salad, Syringe, Ticket, type LucideIcon } from 'lucide-react';
import type { HabitKey } from '@/lib/desafio/rules';

// Ícone e cor de cada hábito, iguais em Hoje, Resumo e Placar.
export type Tone = { icon: LucideIcon; label: string; bg: string; fg: string; bar: string };
export const TONES: Record<HabitKey, Tone> = {
  agua: { icon: Droplets, label: 'Água', bg: 'bg-sky-500/15', fg: 'text-sky-500', bar: 'bg-sky-500' },
  treino: { icon: Dumbbell, label: 'Treinou', bg: 'bg-violet-500/15', fg: 'text-violet-500', bar: 'bg-violet-500' },
  comida: { icon: Salad, label: 'Comeu direito', bg: 'bg-emerald-500/15', fg: 'text-emerald-600', bar: 'bg-emerald-500' },
  doce: { icon: CandyOff, label: 'Zero doce', bg: 'bg-rose-500/15', fg: 'text-rose-500', bar: 'bg-rose-500' },
  cardio: { icon: HeartPulse, label: 'Cardio', bg: 'bg-orange-500/15', fg: 'text-orange-500', bar: 'bg-orange-500' },
  proteina: { icon: Beef, label: 'Proteína', bg: 'bg-red-500/15', fg: 'text-red-500', bar: 'bg-red-500' },
  passos: { icon: Footprints, label: 'Passos', bg: 'bg-teal-500/15', fg: 'text-teal-600', bar: 'bg-teal-500' },
  inj: { icon: Syringe, label: 'Injeção', bg: 'bg-indigo-500/15', fg: 'text-indigo-500', bar: 'bg-indigo-500' },
  coringa: { icon: Ticket, label: 'Coringa', bg: 'bg-amber-500/15', fg: 'text-amber-600', bar: 'bg-amber-500' },
};
