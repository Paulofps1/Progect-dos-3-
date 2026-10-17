// Regras do Desafio dos 3. Funções puras: sem React, sem banco.

export const PLAYERS = ['Paulo', 'Arthur', 'Rafaela'] as const;
export type Player = (typeof PLAYERS)[number];

export const START = '2026-10-19';
export const END = '2026-12-20';
export const PRIZE = 'R$ 300';
export const JOKERS = 2;
export const DEFAULT_WATER_GOAL_ML = 3000;
// Paulo ainda vai decidir se os bônus ficam. Desligar aqui zera os bônus no placar.
export const BONUS_ENABLED = true;

export const INITIAL_WEIGHTS: Record<Player, number> = { Paulo: 94.4, Arthur: 84.1, Rafaela: 84.4 };

/** Itens marcados à mão no checklist (água e treino vêm dos próprios registros). */
export type CheckKey = 'comida' | 'doce' | 'inj' | 'coringa' | 'cardio' | 'proteina' | 'passos';
export type HabitKey = 'agua' | 'treino' | CheckKey;

export const HABITS: { key: HabitKey; label: string; emoji: string; auto?: boolean }[] = [
  { key: 'agua', label: 'Água', emoji: '💧', auto: true },
  { key: 'treino', label: 'Treinou', emoji: '🏋️' },
  { key: 'comida', label: 'Comeu direito', emoji: '🍽️' },
  { key: 'doce', label: 'Zero doce', emoji: '🚫' },
  { key: 'inj', label: 'Injeção', emoji: '💉' },
  { key: 'coringa', label: 'Coringa', emoji: '🃏' },
  { key: 'cardio', label: 'Cardio', emoji: '🏃' },
  { key: 'proteina', label: 'Proteína', emoji: '🥩' },
  { key: 'passos', label: 'Passos', emoji: '🚶' },
];
export const CORE: HabitKey[] = ['agua', 'treino', 'comida', 'doce'];
export const BONUS: HabitKey[] = ['cardio', 'proteina', 'passos'];

export type DayRecord = {
  date: string;
  waterMl: number;
  waterGoalMl: number;
  treino: boolean;
} & Partial<Record<CheckKey, boolean>>;

export type Weight = { date: string; kg: number };

/** Uma aplicação registrada. Só registro: o app não sugere dose nem intervalo. */
export type Injection = { date: string; ml?: number; site?: string; note?: string };
/** Sono registrado na página Noite. Opcional, não vale ponto (tem quem tenha insônia). */
export type Sleep = { id: string; date: string; hours: number; nap?: boolean };

export const INJECTION_SITES = ['Abdômen', 'Coxa esq.', 'Coxa dir.', 'Braço esq.', 'Braço dir.'];

// ---------- datas ("YYYY-MM-DD" no fuso do aparelho) ----------
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => {
  const [a, b, c] = s.split('-').map(Number);
  return new Date(a, b - 1, c);
};
export const todayStr = () => ymd(new Date());
export const isSunday = (s: string) => parseYmd(s).getDay() === 0;
export const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 864e5);
export const fmtDay = (s: string) => `${s.slice(8)}/${s.slice(5, 7)}`;
export const monthDays = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
};
export const shiftMonth = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  const t = new Date(y, m - 1 + by, 1);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}`;
};

/** Dias que contam no desafio, de START até hoje (ou END). */
export function challengeDays(today: string) {
  const out: string[] = [];
  const d = parseYmd(START);
  const end = parseYmd(today < END ? today : END);
  while (d <= end) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ---------- pontuação ----------
export const habitDone = (k: HabitKey, r?: DayRecord) =>
  !!r && (k === 'agua' ? r.waterMl >= r.waterGoalMl : !!r[k as 'treino' | CheckKey]);

export const isPerfect = (r?: DayRecord) => !!r && (!!r.coringa || CORE.every((k) => habitDone(k, r)));

/** % do dia: água + treino + comida + doce, 25% cada. */
export const dayPercent = (r?: DayRecord) => (r ? CORE.filter((k) => habitDone(k, r)).length * 25 : 0);

export const jokersLeftOf = (used: number) => Math.max(0, JOKERS - used);

export const dayPoints = (r?: DayRecord) => {
  if (!isPerfect(r)) return 0;
  const bonus = BONUS_ENABLED ? Math.min(1, 0.5 * BONUS.filter((k) => habitDone(k, r)).length) : 0;
  return 1 + bonus;
};

export function stats(days: Record<string, DayRecord>, today: string, player: Player, weights: Weight[]) {
  let pts = 0;
  let run = 0;
  let perfect = 0;
  for (const d of challengeDays(today)) {
    if (isSunday(d)) continue; // domingo livre: não conta nem quebra sequência
    const r = days[d];
    if (isPerfect(r)) {
      pts += dayPoints(r);
      perfect++;
      run++;
      if (run % 7 === 0) pts++; // 7 perfeitos seguidos
    } else if (d !== today) run = 0; // hoje ainda pode virar perfeito
  }
  const used = Object.values(days).filter((r) => r.coringa).length;
  const first = INITIAL_WEIGHTS[player];
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = sorted.length ? sorted[sorted.length - 1].kg : first;
  return { pts, run, perfect, used, first, last, pct: ((first - last) / first) * 100 };
}

export const num = (n: number, digits = 1) =>
  (Number.isInteger(n) ? String(n) : n.toFixed(digits)).replace('.', ',');

/** Liga o nome do perfil a um dos 3 jogadores (sem acento, só o primeiro nome). */
export function playerFromName(name?: string | null): Player | null {
  const first = (name || '').trim().split(/\s+/)[0]?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return PLAYERS.find((p) => p.toLowerCase() === first) ?? null;
}
