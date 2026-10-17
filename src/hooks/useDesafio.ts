import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { localDesafio } from '@/lib/desafio/localStore';
import {
  DEFAULT_WATER_GOAL_ML,
  JOKERS,
  PLAYERS,
  playerFromName,
  stats,
  todayStr,
  type CheckKey,
  type DayRecord,
  type HabitKey,
  type Injection,
  type Player,
  type Weight,
} from '@/lib/desafio/rules';
import { toast } from 'sonner';

// quem a pessoa escolheu na tela de entrada deste aparelho
function lastLoginPlayer(): Player | null {
  try {
    const v = JSON.parse(localStorage.getItem('desafio:ultimo-login') || '{}');
    return PLAYERS.includes(v.who) ? v.who : null;
  } catch {
    return null;
  }
}

// Junta, por dia, o que vem do banco (água e treino) com o checklist guardado no
// aparelho. Água e treino continuam sendo registrados nas próprias telas.
export function useDesafio() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const today = todayStr();
  const waterGoalMl = profile?.water_goal_ml || DEFAULT_WATER_GOAL_ML;

  const [water, setWater] = useState<Record<string, number>>({});
  const [trained, setTrained] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState<ReturnType<typeof localDesafio.getChecks>>({});
  const [weights, setWeights] = useState<Weight[]>([]);
  const [injections, setInjections] = useState<Injection[]>([]);
  const [nextInjection, setNextInj] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setChecks(localDesafio.getChecks(userId));
    setWeights(localDesafio.getWeights(userId));
    setInjections(localDesafio.getInjections(userId));
    setNextInj(localDesafio.getNextInjection(userId));
    setChosen(localDesafio.getPlayer(userId));
    const since = format(subDays(new Date(), 120), 'yyyy-MM-dd');
    const [w, s] = await Promise.all([
      supabase.from('water_consumption').select('date, amount_ml').eq('user_id', userId).gte('date', since),
      supabase.from('workout_sessions').select('date').eq('user_id', userId).gte('date', since),
    ]);
    const byDay: Record<string, number> = {};
    for (const r of w.data || []) byDay[r.date] = (byDay[r.date] || 0) + (r.amount_ml || 0);
    setWater(byDay);
    setTrained(new Set((s.data || []).map((r) => r.date)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const player = chosen ?? playerFromName(profile?.full_name) ?? lastLoginPlayer();

  const days = useMemo(() => {
    const out: Record<string, DayRecord> = {};
    const injected = new Set(injections.map((i) => i.date));
    const dates = new Set([...Object.keys(water), ...trained, ...Object.keys(checks), ...injected]);
    for (const d of dates) {
      // injeção vem da lista de aplicações (página Injeção), não do checklist
      out[d] = { date: d, waterMl: water[d] || 0, waterGoalMl: waterGoalMl, treino: trained.has(d), ...checks[d], inj: injected.has(d) };
    }
    return out;
  }, [water, trained, checks, injections, waterGoalMl]);

  const record = useCallback(
    (d: string): DayRecord => days[d] ?? { date: d, waterMl: 0, waterGoalMl, treino: false },
    [days, waterGoalMl],
  );

  const saveInjections = useCallback(
    (list: Injection[]) => {
      if (!userId) return;
      const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
      setInjections(sorted);
      localDesafio.setInjections(userId, sorted);
    },
    [userId],
  );

  const addInjection = useCallback(
    (inj: Injection) => saveInjections([...injections.filter((i) => i.date !== inj.date), inj]),
    [injections, saveInjections],
  );
  const removeInjection = useCallback(
    (date: string) => saveInjections(injections.filter((i) => i.date !== date)),
    [injections, saveInjections],
  );
  const setNextInjection = useCallback(
    (d: string | null) => {
      if (!userId) return;
      setNextInj(d);
      localDesafio.setNextInjection(userId, d);
    },
    [userId],
  );

  const toggle = useCallback(
    async (date: string, key: HabitKey) => {
      if (!userId || key === 'agua' || date > today) return;
      if (key === 'treino') {
        // treino é registro de verdade (tabela workout_sessions), igual à tela Treinos
        if (trained.has(date)) {
          const { error } = await supabase.from('workout_sessions').delete().eq('user_id', userId).eq('date', date);
          if (error) return toast.error('Não desmarcou o treino');
        } else {
          const { error } = await supabase
            .from('workout_sessions')
            .insert({ user_id: userId, date, modality: 'academia', finished_at: new Date().toISOString() });
          if (error) return toast.error('Não registrou o treino');
        }
        setTrained((s) => {
          const n = new Set(s);
          if (n.has(date)) n.delete(date);
          else n.add(date);
          return n;
        });
        return;
      }
      if (key === 'inj') {
        const has = injections.some((i) => i.date === date);
        saveInjections(has ? injections.filter((i) => i.date !== date) : [...injections, { date }]);
        return;
      }
      const k = key as CheckKey;
      const cur = checks[date]?.[k];
      if (k === 'coringa' && !cur && Object.values(checks).filter((c) => c.coringa).length >= JOKERS) {
        return toast.error('Os coringas acabaram');
      }
      const next = { ...checks, [date]: { ...checks[date], [k]: !cur } };
      setChecks(next);
      localDesafio.setChecks(userId, next);
    },
    [userId, today, trained, checks, injections, saveInjections],
  );

  const saveWeight = useCallback(
    (kg: number) => {
      if (!userId) return;
      const next = [...weights.filter((w) => w.date !== today), { date: today, kg }];
      setWeights(next);
      localDesafio.setWeights(userId, next);
    },
    [userId, weights, today],
  );

  const removeWeight = useCallback(
    (date: string) => {
      if (!userId) return;
      const next = weights.filter((w) => w.date !== date);
      setWeights(next);
      localDesafio.setWeights(userId, next);
    },
    [userId, weights],
  );

  const choosePlayer = useCallback(
    (p: Player) => {
      if (!userId) return;
      setChosen(p);
      localDesafio.setPlayer(userId, p);
    },
    [userId],
  );

  const myStats = player ? stats(days, today, player, weights) : null;

  return {
    loading, today, player, choosePlayer, days, record, toggle, weights, saveWeight, removeWeight, myStats, reload: load,
    injections, addInjection, removeInjection, nextInjection, setNextInjection,
  };
}
