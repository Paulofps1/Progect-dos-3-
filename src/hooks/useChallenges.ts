import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { localDesafio } from '@/lib/desafio/localStore';
import { createChallenge, deleteChallenge, getChallenge, IS_DEMO, loadChallenges, updateChallenge } from '@/lib/desafio/remote';
import { allIn, type Challenge, type Metric } from '@/lib/desafio/challenges';
import { PLAYERS, type Player } from '@/lib/desafio/rules';

// Desafios do grupo, no banco: cada um aceita ou recusa do próprio celular.
// Sem banco (ou na demonstração) ficam no aparelho; na demonstração, Arthur e
// Rafaela aceitam sozinhos.
export function useChallenges(me: Player | null) {
  const [list, setList] = useState<Challenge[]>(() => localDesafio.getChallenges());
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    const remote = await loadChallenges();
    if (remote) {
      if (JSON.stringify(remote) !== JSON.stringify(localDesafio.getChallenges())) setList(remote);
      localDesafio.setChallenges(remote);
      setOnline(true);
    } else {
      setList(localDesafio.getChallenges());
      setOnline(IS_DEMO);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onFocus);
    const t = setInterval(load, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(t);
    };
  }, [load]);

  const saveLocal = useCallback((next: Challenge[]) => {
    setList(next);
    localDesafio.setChallenges(next);
  }, []);

  // aplica a mudança sobre a versão mais nova do banco (os outros podem ter respondido)
  const update = useCallback(
    async (id: string, fn: (c: Challenge) => Challenge) => {
      const base = (online && !IS_DEMO && (await getChallenge(id))) || localDesafio.getChallenges().find((c) => c.id === id);
      if (!base) return undefined;
      const after = fn(base);
      if (!IS_DEMO && !(await updateChallenge(after))) {
        toast.error('Não salvou, confira a internet');
        return undefined;
      }
      saveLocal(localDesafio.getChallenges().map((c) => (c.id === id ? after : c)));
      return after;
    },
    [online, saveLocal],
  );

  const create = useCallback(
    async (metric: Metric, days: number, start: string) => {
      if (!me) return;
      const c: Challenge = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        metric,
        days,
        start,
        createdBy: me,
        accepted: [me],
        players: [...PLAYERS],
        createdAt: new Date().toISOString(),
      };
      if (!IS_DEMO && !(await createChallenge(c))) {
        toast.error('Não criou o desafio, confira a internet');
        return;
      }
      saveLocal([c, ...localDesafio.getChallenges()]);
      if (IS_DEMO) {
        // simulação: os outros aceitam em seguida
        PLAYERS.filter((p) => p !== me).forEach((p, i) =>
          setTimeout(async () => {
            const after = await update(c.id, (x) => (x.declinedBy || x.accepted.includes(p) ? x : { ...x, accepted: [...x.accepted, p] }));
            toast.success(`${p} aceitou o desafio`);
            if (after && allIn(after)) toast.success('Os 3 aceitaram: desafio valendo!');
          }, 1500 + i * 1500),
        );
      }
    },
    [me, saveLocal, update],
  );

  const accept = useCallback(
    async (id: string) => {
      if (!me) return;
      const after = await update(id, (c) => (c.accepted.includes(me) ? c : { ...c, accepted: [...c.accepted, me] }));
      if (!after) return;
      if (after.declinedBy) toast(`${after.declinedBy} já tinha recusado`);
      else if (allIn(after)) toast.success('Os 3 aceitaram: desafio valendo!');
      else toast.success('Você aceitou. Falta o outro aceitar.');
    },
    [me, update],
  );

  const decline = useCallback(
    async (id: string) => {
      if (!me) return;
      if (await update(id, (c) => ({ ...c, declinedBy: c.declinedBy ?? me }))) toast('Desafio recusado e cancelado para todos');
    },
    [me, update],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!IS_DEMO && !(await deleteChallenge(id))) return toast.error('Não apagou, confira a internet');
      saveLocal(localDesafio.getChallenges().filter((c) => c.id !== id));
    },
    [saveLocal],
  );

  return { list, online, create, accept, decline, remove };
}
