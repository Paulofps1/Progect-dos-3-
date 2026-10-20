// Mini-desafios entre os 3. Regra principal: só começa quando OS TRÊS aceitam;
// se alguém recusa, o desafio é cancelado. Funções puras, sem React.

import { PLAYERS, daysBetween, habitDone, isPerfect, parseYmd, ymd, type DayRecord, type Player } from './rules';

export type Metric = 'doce' | 'agua' | 'treino' | 'perfeito' | 'passos' | 'cardio';

export type Template = { id: Metric; title: string; desc: string; unit: string };

export const TEMPLATES: Template[] = [
  { id: 'doce', title: 'Semana sem doce', desc: 'Quem fica mais dias com zero doce', unit: 'dias sem doce' },
  { id: 'agua', title: 'Rei da água', desc: 'Quem bate a meta de água mais dias', unit: 'dias na meta' },
  { id: 'treino', title: 'Rato de academia', desc: 'Quem treina mais dias', unit: 'treinos' },
  { id: 'perfeito', title: 'Dias perfeitos', desc: 'Quem fecha mais dias perfeitos', unit: 'dias perfeitos' },
  { id: 'passos', title: 'Bora caminhar', desc: 'Quem bate a meta de passos mais dias', unit: 'dias de passos' },
  { id: 'cardio', title: 'Cardio todo dia', desc: 'Quem faz cardio mais dias', unit: 'dias de cardio' },
];
export const DURATIONS = [3, 7, 14];

export type Challenge = {
  id: string;
  metric: Metric;
  days: number;
  start: string; // YYYY-MM-DD
  createdBy: Player;
  accepted: Player[];
  declinedBy?: Player;
  createdAt: string;
};

export type Status = 'convite' | 'aguardando' | 'agendado' | 'ativo' | 'encerrado' | 'cancelado';

export const templateOf = (m: Metric) => TEMPLATES.find((t) => t.id === m)!;

export const endOf = (c: Challenge) => {
  const d = parseYmd(c.start);
  d.setDate(d.getDate() + c.days - 1);
  return ymd(d);
};

export const allIn = (c: Challenge) => PLAYERS.every((p) => c.accepted.includes(p));

/** Situação do desafio do ponto de vista de quem está olhando. */
export function statusOf(c: Challenge, me: Player | null, today: string): Status {
  if (c.declinedBy) return 'cancelado';
  if (!allIn(c)) {
    // começou o prazo e ninguém fechou os 3: não vale
    if (today > endOf(c)) return 'cancelado';
    return me && !c.accepted.includes(me) ? 'convite' : 'aguardando';
  }
  if (today < c.start) return 'agendado';
  if (today > endOf(c)) return 'encerrado';
  return 'ativo';
}

const METRIC_DONE: Record<Metric, (r?: DayRecord) => boolean> = {
  doce: (r) => habitDone('doce', r),
  agua: (r) => habitDone('agua', r),
  treino: (r) => habitDone('treino', r),
  perfeito: (r) => isPerfect(r),
  passos: (r) => habitDone('passos', r),
  cardio: (r) => habitDone('cardio', r),
};

/** Dias do desafio que já passaram (até hoje). */
export function elapsedDays(c: Challenge, today: string) {
  const out: string[] = [];
  const last = today < endOf(c) ? today : endOf(c);
  const d = parseYmd(c.start);
  while (ymd(d) <= last) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export type Score = { player: Player; value: number | null; place: number };

/**
 * Placar do desafio. `recordOf` devolve o dia de cada jogador; quando não há
 * como saber (os dados do outro ainda não chegam sem o banco), devolve null.
 */
export function scores(c: Challenge, today: string, recordOf: (p: Player, date: string) => DayRecord | null | undefined): Score[] {
  const days = elapsedDays(c, today);
  const raw = PLAYERS.map((player) => {
    const recs = days.map((d) => recordOf(player, d));
    const known = recs.some((r) => r !== null);
    return { player, value: known ? recs.filter((r) => r && METRIC_DONE[c.metric](r)).length : null };
  });
  const sorted = [...raw].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return sorted.map((s) => ({ ...s, place: s.value == null ? 0 : sorted.filter((o) => (o.value ?? -1) > s.value!).length + 1 }));
}

export const dayIndex = (c: Challenge, today: string) => Math.min(c.days, daysBetween(c.start, today) + 1);

// usado na demonstração para inventar o dia de Arthur e Rafaela (sempre igual para a mesma data)
export function fakeRecord(player: Player, date: string, waterGoalMl = 3000): DayRecord {
  // sorteio estável por jogador + dia + hábito
  const bit = (key: number, pct: number) => {
    let h = 2166136261;
    for (const ch of `${player}|${date}|${key}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return h % 100 < pct;
  };
  const strong = player === 'Arthur' ? 70 : 60;
  const r: DayRecord = {
    date,
    waterMl: bit(1, strong) ? waterGoalMl : Math.round(waterGoalMl * 0.6),
    waterGoalMl,
    treino: bit(3, strong),
    comida: bit(5, strong + 5),
    doce: bit(7, strong - 5),
    cardio: bit(9, 40),
    proteina: bit(11, 50),
    passos: bit(13, 45),
  };
  return r;
}


/**
 * Pontos dos desafios do grupo para o placar principal: enquanto um desafio está
 * valendo (os 3 aceitaram), cada dia cumprido vale +1. Não cumpriu, não ganha.
 */
export function challengePoints(list: Challenge[], player: Player, recordOf: (date: string) => DayRecord | undefined, today: string) {
  let pts = 0;
  for (const c of list) {
    if (c.declinedBy || !allIn(c) || today < c.start) continue;
    for (const d of elapsedDays(c, today)) if (METRIC_DONE[c.metric](recordOf(d))) pts++;
  }
  return pts;
}
