import { useCallback, useEffect, useState } from 'react';
import { loadEveryone, type Shared } from '@/lib/desafio/remote';
import type { Player } from '@/lib/desafio/rules';

// Dias e pesagens dos 3, vindos do banco. Atualiza ao voltar para o app e a cada minuto.
// `ready` = falso quando o banco ainda não respondeu (ou não tem as tabelas).
// Guarda a última resposta para reabrir Placar/Desafios já preenchidos.
let last: Partial<Record<Player, Shared>> | null = null;

export function useEveryone() {
  const [data, setData] = useState<Partial<Record<Player, Shared>>>(() => last ?? {});
  const [ready, setReady] = useState(() => last !== null);

  const load = useCallback(async () => {
    const r = await loadEveryone();
    if (r) {
      // só troca se mudou: evita redesenhar a tela à toa
      if (JSON.stringify(r) !== JSON.stringify(last)) setData(r);
      last = r;
      setReady(true);
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

  return { data, ready, reload: load };
}
