import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { localDesafio, type ProfileData } from '@/lib/desafio/localStore';
import { challengePoints } from '@/lib/desafio/challenges';
import { removeProofs, uploadProofs, type ProofKind } from '@/lib/desafio/proofs';
import { IS_DEMO, loadMine, saveMine, type Kind } from '@/lib/desafio/remote';
import {
  DEFAULT_WATER_GOAL_ML,
  FIRST_DOSE,
  FOUNDERS,
  slug,
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
  type Sleep,
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

// Junta, por dia, água e treino (tabelas do app) com o checklist do desafio.
// Checklist, pesagens e injeções ficam no banco (desafio_dados) com cópia no
// aparelho; o resumo dos dias também vai para o banco, para o Placar de todos.
export function useDesafio() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const email = user?.email;
  const today = todayStr();

  // começa com o que já está no aparelho (inclusive água/treino da última vez):
  // assim a tela não aparece vazia e depois enche (piscava ao trocar de página)
  const [water, setWater] = useState<Record<string, number>>(() => (userId ? localDesafio.getDbCache(userId).water : {}));
  const [trained, setTrained] = useState<Set<string>>(() => new Set(userId ? localDesafio.getDbCache(userId).trained : []));
  const [checks, setChecks] = useState(() => (userId ? localDesafio.getChecks(userId) : {}));
  const [weights, setWeights] = useState<Weight[]>(() => (userId ? localDesafio.getWeights(userId) : []));
  const [injections, setInjections] = useState<Injection[]>(() => (userId ? localDesafio.getInjections(userId) : []));
  const [nextInjection, setNextInj] = useState<string | null>(() => (userId ? localDesafio.getNextInjection(userId) : null));
  const [sleep, setSleep] = useState<Sleep[]>(() => (userId ? localDesafio.getSleep(userId) : []));
  const [chosen, setChosen] = useState<Player | null>(() => (userId ? localDesafio.getPlayer(userId) : null));
  const [mealPhotos, setMealPhotos] = useState<Record<string, number>>(() => (userId ? localDesafio.getDbCache(userId).meals ?? {} : {}));
  const [profileData, setProfileData] = useState<ProfileData>(() => (userId ? localDesafio.getProfile(userId) : {}));
  const [loading, setLoading] = useState(() => !userId || !localDesafio.hasDbCache(userId));
  // meta de água: a do perfil do desafio (salva no banco) vale mais que a antiga do app
  const waterGoalMl = profileData.waterGoalMl || profile?.water_goal_ml || DEFAULT_WATER_GOAL_ML;

  const load = useCallback(async () => {
    if (!userId) return;
    setChecks(localDesafio.getChecks(userId));
    setWeights(localDesafio.getWeights(userId));
    setInjections(localDesafio.getInjections(userId));
    setNextInj(localDesafio.getNextInjection(userId));
    setChosen(localDesafio.getPlayer(userId));
    setSleep(localDesafio.getSleep(userId));
    setProfileData(localDesafio.getProfile(userId));
    const since = format(subDays(new Date(), 120), 'yyyy-MM-dd');
    const [w, s, m, mine] = await Promise.all([
      supabase.from('water_consumption').select('date, amount_ml').eq('user_id', userId).gte('date', since),
      supabase.from('workout_sessions').select('date').eq('user_id', userId).gte('date', since),
      supabase.from('meals').select('date, meal_items').eq('user_id', userId).gte('date', since),
      loadMine(userId),
    ]);
    if (mine) {
      // o banco manda, exceto no que mudou aqui e ainda não subiu (ou nunca subiu)
      const pending = localDesafio.getPending(userId);
      const sync = <T,>(kind: Kind, local: T, empty: (v: T) => boolean, apply: (v: T) => void, store: (v: T) => void) => {
        if (kind in mine && !pending.includes(kind)) {
          const v = mine[kind] as T;
          apply(v);
          store(v);
        } else if (!empty(local) || pending.includes(kind)) {
          saveMine(userId, localDesafio.getPlayer(userId), kind, local).then((ok) => ok && localDesafio.setPending(userId, kind, false));
        }
      };
      sync('checks', localDesafio.getChecks(userId), (v) => !Object.keys(v).length, (v) => setChecks(v), (v) => localDesafio.setChecks(userId, v));
      sync('weights', localDesafio.getWeights(userId), (v) => !v.length, (v) => setWeights(v), (v) => localDesafio.setWeights(userId, v));
      sync('injections', localDesafio.getInjections(userId), (v) => !v.length, (v) => setInjections(v), (v) => localDesafio.setInjections(userId, v));
      sync('sleep', localDesafio.getSleep(userId), (v) => !v.length, (v) => setSleep(v), (v) => localDesafio.setSleep(userId, v));
      sync('profile', localDesafio.getProfile(userId), (v) => !Object.keys(v).length, (v) => setProfileData(v), (v) => localDesafio.setProfile(userId, v));
      sync('next_injection', localDesafio.getNextInjection(userId), (v) => !v, (v) => setNextInj(v), (v) => localDesafio.setNextInjection(userId, v));
    }
    // 1ª dose de Paulo, Arthur e Rafaela (16/10): registra uma vez só; se apagar, não volta
    const seedKey = `desafio:${userId}:1a-dose`;
    const founder = IS_DEMO || FOUNDERS.some((p) => email?.startsWith(`${slug(p)}@`));
    // (só depois de ler o banco, para não sobrescrever o que já está lá)
    if ((mine || IS_DEMO) && founder && !localStorage.getItem(seedKey)) {
      const list = localDesafio.getInjections(userId);
      if (!list.some((i) => i.date === FIRST_DOSE.date)) {
        const next = [...list, FIRST_DOSE].sort((a, b) => (a.date < b.date ? 1 : -1));
        setInjections(next);
        localDesafio.setInjections(userId, next);
        localDesafio.setPending(userId, 'injections', true);
        saveMine(userId, localDesafio.getPlayer(userId), 'injections', next).then((ok) => ok && localDesafio.setPending(userId, 'injections', false));
      }
      try {
        localStorage.setItem(seedKey, '1');
      } catch {
        /* tenta de novo na próxima */
      }
    }
    const byDay: Record<string, number> = {};
    for (const r of w.data || []) byDay[r.date] = (byDay[r.date] || 0) + (r.amount_ml || 0);
    const trainedDays = (s.data || []).map((r) => r.date);
    // refeições com foto por dia (a página Refeições grava meal_items = [{ fotos: n }])
    const meals: Record<string, number> = {};
    for (const r of m.data || []) {
      const items = Array.isArray(r.meal_items) ? (r.meal_items as { fotos?: number }[]) : [];
      if (r.date && items.some((i) => (i?.fotos ?? 0) > 0)) meals[r.date] = (meals[r.date] || 0) + 1;
    }
    setWater(byDay);
    setTrained(new Set(trainedDays));
    setMealPhotos(meals);
    if (!w.error && !s.error && !m.error) localDesafio.setDbCache(userId, { water: byDay, trained: trainedDays, meals });
    setLoading(false);
  }, [userId, email]);

  useEffect(() => {
    load();
  }, [load]);

  const player = chosen ?? playerFromName(profile?.full_name) ?? lastLoginPlayer();

  // guarda no aparelho na hora e manda para o banco; se falhar, sobe na próxima abertura
  const push = useCallback(
    (kind: Kind, value: unknown) => {
      if (!userId) return;
      localDesafio.setPending(userId, kind, true);
      saveMine(userId, player, kind, value).then((ok) => ok && localDesafio.setPending(userId, kind, false));
    },
    [userId, player],
  );

  const days = useMemo(() => {
    const out: Record<string, DayRecord> = {};
    const injected = new Set(injections.map((i) => i.date));
    const dates = new Set([...Object.keys(water), ...trained, ...Object.keys(checks), ...injected, ...Object.keys(mealPhotos)]);
    for (const d of dates) {
      // injeção vem da lista de aplicações (página Injeção), não do checklist
      out[d] = {
        date: d, waterMl: water[d] || 0, waterGoalMl: waterGoalMl, treino: trained.has(d), ...checks[d],
        inj: injected.has(d), mealPhotos: mealPhotos[d] || 0,
      };
    }
    return out;
  }, [water, trained, checks, injections, waterGoalMl, mealPhotos]);

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
      push('injections', sorted);
    },
    [userId, push],
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
      push('next_injection', d);
    },
    [userId, push],
  );

  const toggle = useCallback(
    async (date: string, key: HabitKey) => {
      if (!userId || key === 'agua' || date > today) return;
      if (key === 'treino') {
        // treino é registro de verdade (tabela workout_sessions), igual à tela Treinos
        if (trained.has(date)) {
          const { error } = await supabase.from('workout_sessions').delete().eq('user_id', userId).eq('date', date);
          if (error) return toast.error('Não desmarcou o treino');
          if (checks[date]?.provaTreino) {
            removeProofs(userId, date, 'treino');
            const next = { ...checks, [date]: { ...checks[date], provaTreino: false } };
            setChecks(next);
            localDesafio.setChecks(userId, next);
            push('checks', next);
          }
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
      // desmarcar cardio/caminhada apaga também as fotos de prova daquele dia
      const proofFlag = k === 'cardio' ? 'provaCardio' : k === 'passos' ? 'provaPassos' : null;
      const next = { ...checks, [date]: { ...checks[date], [k]: !cur, ...(proofFlag && cur ? { [proofFlag]: false } : {}) } };
      if (proofFlag && cur && checks[date]?.[proofFlag]) removeProofs(userId, date, k as ProofKind);
      setChecks(next);
      localDesafio.setChecks(userId, next);
      push('checks', next);
    },
    [userId, today, trained, checks, injections, saveInjections, push],
  );

  // marca já com as fotos de prova (a caminhada exige a partir de RULES_V2)
  const markWithProof = useCallback(
    async (date: string, kind: ProofKind, photos: Blob[]) => {
      if (!userId || date > today || !photos.length) return false;
      if (!(await uploadProofs(userId, date, kind, photos))) {
        toast.error('Não enviou a prova, confira a internet');
        return false;
      }
      if (kind === 'treino' && !trained.has(date)) {
        const { error } = await supabase
          .from('workout_sessions')
          .insert({ user_id: userId, date, modality: 'academia', finished_at: new Date().toISOString() });
        if (error) {
          toast.error('Não registrou o treino');
          return false;
        }
        setTrained((s) => new Set(s).add(date));
      }
      const flag = kind === 'treino' ? 'provaTreino' : kind === 'cardio' ? 'provaCardio' : 'provaPassos';
      const next = { ...checks, [date]: { ...checks[date], [flag]: true, ...(kind === 'treino' ? {} : { [kind]: true }) } };
      setChecks(next);
      localDesafio.setChecks(userId, next);
      push('checks', next);
      return true;
    },
    [userId, today, trained, checks, push],
  );

  // água de um dia que passou (marcar pelo Resumo): completa até a meta daquele dia
  const fillWater = useCallback(
    async (date: string) => {
      if (!userId || date > today) return;
      const missing = waterGoalMl - (water[date] || 0);
      if (missing <= 0) return;
      const { error } = await supabase.from('water_consumption').insert({ user_id: userId, amount_ml: missing, date });
      if (error) return toast.error('Não registrou a água');
      setWater((w) => ({ ...w, [date]: (w[date] || 0) + missing }));
    },
    [userId, today, water, waterGoalMl],
  );

  const saveProfileData = useCallback(
    (patch: ProfileData) => {
      if (!userId) return;
      const next = { ...localDesafio.getProfile(userId), ...patch };
      setProfileData(next);
      localDesafio.setProfile(userId, next);
      push('profile', next);
    },
    [userId, push],
  );

  const saveWeight = useCallback(
    (kg: number) => {
      if (!userId) return;
      const next = [...weights.filter((w) => w.date !== today), { date: today, kg }];
      setWeights(next);
      localDesafio.setWeights(userId, next);
      push('weights', next);
    },
    [userId, weights, today, push],
  );

  const removeWeight = useCallback(
    (date: string) => {
      if (!userId) return;
      const next = weights.filter((w) => w.date !== date);
      setWeights(next);
      localDesafio.setWeights(userId, next);
      push('weights', next);
    },
    [userId, weights, push],
  );

  const saveSleep = useCallback(
    (list: Sleep[]) => {
      if (!userId) return;
      const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
      setSleep(sorted);
      localDesafio.setSleep(userId, sorted);
      push('sleep', sorted);
    },
    [userId, push],
  );
  // um registro de sono por dia (o dia em que acordou): registrar de novo substitui
  const addSleep = useCallback(
    (s: Omit<Sleep, 'id'>) => saveSleep([...sleep.filter((x) => x.date !== s.date || x.nap), { ...s, id: Date.now().toString(36) }]),
    [sleep, saveSleep],
  );
  const removeSleep = useCallback((id: string) => saveSleep(sleep.filter((s) => s.id !== id)), [sleep, saveSleep]);

  const choosePlayer = useCallback(
    (p: Player) => {
      if (!userId) return;
      setChosen(p);
      localDesafio.setPlayer(userId, p);
    },
    [userId],
  );

  // resumo dos dias no banco: é o que os outros enxergam no Placar e nos Desafios
  const sentDays = useRef('');
  useEffect(() => {
    if (!userId || !player || loading) return;
    const t = setTimeout(() => {
      const json = JSON.stringify([player, days, weights]);
      if (json === sentDays.current) return;
      sentDays.current = json;
      saveMine(userId, player, 'days', days);
      saveMine(userId, player, 'weights', weights);
    }, 800);
    return () => clearTimeout(t);
  }, [userId, player, loading, days, weights]);

  // desafios do grupo valem +1 por dia cumprido (lista local, mantida em dia por useChallenges)
  const myStats = player ? stats(days, today, player, weights, challengePoints(localDesafio.getChallenges(), player, (d) => days[d], today)) : null;

  return {
    loading, today, player, choosePlayer, days, record, toggle, weights, saveWeight, removeWeight, myStats, reload: load,
    injections, addInjection, removeInjection, nextInjection, setNextInjection,
    sleep, addSleep, removeSleep, markWithProof, profileData, saveProfileData, waterGoalMl, fillWater,
  };
}
