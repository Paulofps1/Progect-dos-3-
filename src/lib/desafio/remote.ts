// Dados do desafio no banco, para os 3 verem uns dos outros no Placar e nos Desafios.
// Tabelas criadas em supabase/migrations/20261017140000_desafio_dos_3.sql.
// Se o banco ainda não tiver as tabelas (ou estiver fora), tudo continua funcionando
// só com o aparelho (localStore) e volta a sincronizar quando der.

import { supabase } from '@/integrations/supabase/client';
import type { Challenge } from './challenges';
import type { DayRecord, Player } from './rules';

export const IS_DEMO = import.meta.env.MODE === 'demo';

export type Kind = 'checks' | 'weights' | 'injections' | 'next_injection' | 'days' | 'sleep';
type Row = { user_id: string; tipo: Kind; jogador: Player | null; valor: unknown };

// as tabelas novas ainda não estão nos tipos gerados do Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

/** Tudo que este usuário guardou no banco, por tipo. null = banco indisponível. */
export async function loadMine(userId: string): Promise<Partial<Record<Kind, unknown>> | null> {
  if (IS_DEMO) return null;
  const { data, error } = await db.from('desafio_dados').select('tipo, valor').eq('user_id', userId);
  if (error) return null;
  return Object.fromEntries((data as Row[]).map((r) => [r.tipo, r.valor]));
}

export async function saveMine(userId: string, player: Player | null, tipo: Kind, valor: unknown) {
  if (IS_DEMO) return false;
  const { error } = await db
    .from('desafio_dados')
    .upsert({ user_id: userId, tipo, jogador: player, valor, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id,tipo' });
  return !error;
}

export type Shared = { days: Record<string, DayRecord>; weights: { date: string; kg: number }[] };

/** Dias e pesagens dos 3 (o que o banco deixa cada um ver dos outros). */
export async function loadEveryone(): Promise<Partial<Record<Player, Shared>> | null> {
  if (IS_DEMO) return null;
  const { data, error } = await db.from('desafio_dados').select('jogador, tipo, valor, atualizado_em').in('tipo', ['days', 'weights']);
  if (error) return null;
  const out: Partial<Record<Player, Shared>> = {};
  // se alguém trocou de conta, vale o registro mais recente de cada jogador
  const rows = [...(data as (Row & { atualizado_em: string })[])].sort((a, b) => (a.atualizado_em < b.atualizado_em ? -1 : 1));
  for (const r of rows) {
    if (!r.jogador) continue;
    const cur = (out[r.jogador] ??= { days: {}, weights: [] });
    if (r.tipo === 'days') cur.days = (r.valor as Shared['days']) || {};
    else cur.weights = (r.valor as Shared['weights']) || [];
  }
  return out;
}

// ---------- desafios entre os 3 ----------

export async function loadChallenges(): Promise<Challenge[] | null> {
  if (IS_DEMO) return null;
  const { data, error } = await db.from('desafio_desafios').select('dados').order('criado_em', { ascending: false });
  if (error) return null;
  return (data as { dados: Challenge }[]).map((r) => r.dados);
}

export async function createChallenge(c: Challenge) {
  if (IS_DEMO) return false;
  const { error } = await db.from('desafio_desafios').insert({ id: c.id, dados: c });
  return !error;
}

export async function updateChallenge(c: Challenge) {
  if (IS_DEMO) return false;
  const { error } = await db
    .from('desafio_desafios')
    .update({ dados: c, atualizado_em: new Date().toISOString() })
    .eq('id', c.id);
  return !error;
}

export async function getChallenge(id: string): Promise<Challenge | null> {
  if (IS_DEMO) return null;
  const { data } = await db.from('desafio_desafios').select('dados').eq('id', id).maybeSingle();
  return (data as { dados: Challenge } | null)?.dados ?? null;
}

export async function deleteChallenge(id: string) {
  if (IS_DEMO) return false;
  const { error } = await db.from('desafio_desafios').delete().eq('id', id);
  return !error;
}
