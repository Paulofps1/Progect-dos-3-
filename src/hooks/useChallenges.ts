import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { localDesafio } from '@/lib/desafio/localStore';
import { allIn, type Challenge, type Metric } from '@/lib/desafio/challenges';
import { PLAYERS, type Player } from '@/lib/desafio/rules';

const IS_DEMO = import.meta.env.MODE === 'demo';

// Desafios entre os 3. Hoje ficam no aparelho; com o banco, cada um aceita do
// próprio celular. Na demonstração, Arthur e Rafaela aceitam sozinhos.
export function useChallenges(me: Player | null) {
  const [list, setList] = useState<Challenge[]>([]);

  useEffect(() => {
    setList(localDesafio.getChallenges());
  }, []);

  const save = useCallback((next: Challenge[]) => {
    setList(next);
    localDesafio.setChallenges(next);
  }, []);

  const update = useCallback(
    (id: string, fn: (c: Challenge) => Challenge) => {
      const next = localDesafio.getChallenges().map((c) => (c.id === id ? fn(c) : c));
      save(next);
      return next.find((c) => c.id === id);
    },
    [save],
  );

  const create = useCallback(
    (metric: Metric, days: number, start: string) => {
      if (!me) return;
      const c: Challenge = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        metric,
        days,
        start,
        createdBy: me,
        accepted: [me],
        createdAt: new Date().toISOString(),
      };
      save([c, ...localDesafio.getChallenges()]);
      if (IS_DEMO) {
        // simulação: os outros dois aceitam em seguida
        PLAYERS.filter((p) => p !== me).forEach((p, i) =>
          setTimeout(() => {
            const after = update(c.id, (x) => (x.declinedBy || x.accepted.includes(p) ? x : { ...x, accepted: [...x.accepted, p] }));
            toast.success(`${p} aceitou o desafio`);
            if (after && allIn(after)) toast.success('Os 3 aceitaram: desafio valendo!');
          }, 1500 + i * 1500),
        );
      }
    },
    [me, save, update],
  );

  const accept = useCallback(
    (id: string) => {
      if (!me) return;
      const after = update(id, (c) => (c.accepted.includes(me) ? c : { ...c, accepted: [...c.accepted, me] }));
      if (after && allIn(after)) toast.success('Os 3 aceitaram: desafio valendo!');
      else toast.success('Você aceitou. Falta o outro aceitar.');
    },
    [me, update],
  );

  const decline = useCallback(
    (id: string) => {
      if (!me) return;
      update(id, (c) => ({ ...c, declinedBy: me }));
      toast('Desafio recusado e cancelado para os 3');
    },
    [me, update],
  );

  const remove = useCallback((id: string) => save(localDesafio.getChallenges().filter((c) => c.id !== id)), [save]);

  return { list, create, accept, decline, remove };
}
