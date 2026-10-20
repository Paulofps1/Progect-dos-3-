import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import { proofUrl, type ProofKind } from '@/lib/desafio/proofs';

// Miniaturas das fotos de prova (treino/cardio) de alguém num dia. Toque amplia.
export function ProofThumbs({ userId, date, treino, cardio }: { userId: string; date: string; treino: boolean; cardio: boolean }) {
  const [urls, setUrls] = useState<Partial<Record<ProofKind, string>>>({});
  const [big, setBig] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const kinds = ([treino && 'treino', cardio && 'cardio'].filter(Boolean) as ProofKind[]);
    Promise.all(kinds.map(async (k) => [k, await proofUrl(userId, date, k)] as const)).then((pairs) => {
      if (alive) setUrls(Object.fromEntries(pairs.filter(([, u]) => u)));
    });
    return () => {
      alive = false;
    };
  }, [userId, date, treino, cardio]);

  if (!treino && !cardio) return <p className="text-[11px] text-muted-foreground">Sem fotos de prova hoje.</p>;
  return (
    <div className="flex gap-2">
      {(['treino', 'cardio'] as ProofKind[]).map((k) =>
        (k === 'treino' ? treino : cardio) ? (
          <button key={k} onClick={() => urls[k] && setBig(urls[k]!)} className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary">
            {urls[k] && <img src={urls[k]} alt={`Prova de ${k}`} className="w-full h-full object-cover" />}
            <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] py-0.5 flex items-center justify-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> {k === 'treino' ? 'Treino' : 'Cardio'}
            </span>
          </button>
        ) : null,
      )}
      {big &&
        createPortal(
          <button onClick={() => setBig(null)} aria-label="Fechar foto" className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4">
            <img src={big} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          </button>,
          document.body,
        )}
    </div>
  );
}
