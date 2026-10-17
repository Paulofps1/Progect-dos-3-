import { useCallback, useEffect, useState } from 'react';
import { loadEveryone, type Shared } from '@/lib/desafio/remote';
import type { Player } from '@/lib/desafio/rules';

// Dias e pesagens dos 3, vindos do banco. Atualiza ao voltar para o app e a cada minuto.
// `ready` = falso quando o banco ainda não respondeu (ou não tem as tabelas).
export function useEveryone() {
  const [data, setData] = useState<Partial<Record<Player, Shared>>>({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const r = await loadEveryone();
    if (r) {
      setData(r);
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
