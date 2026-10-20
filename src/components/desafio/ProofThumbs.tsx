import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import { proofUrls, type ProofKind } from '@/lib/desafio/proofs';

// Miniaturas das fotos de prova de alguém num dia (caminhada; antes também treino e
// cardio). Uma prova pode ter várias fotos. Toque amplia.

const LABEL: Record<ProofKind, string> = { passos: 'Caminhada', treino: 'Treino', cardio: 'Cardio' };

export function ProofThumbs({ userId, date, kinds }: { userId: string; date: string; kinds: ProofKind[] }) {
  const [items, setItems] = useState<{ kind: ProofKind; url: string }[]>([]);
  const [big, setBig] = useState<string | null>(null);
  const key = kinds.join(',');

  useEffect(() => {
    let alive = true;
    Promise.all(key ? key.split(',').map(async (k) => (await proofUrls(userId, date, k as ProofKind)).map((url) => ({ kind: k as ProofKind, url }))) : []).then(
      (lists) => alive && setItems(lists.flat()),
    );
    return () => {
      alive = false;
    };
  }, [userId, date, key]);

  if (!kinds.length) return <p className="text-[11px] text-muted-foreground">Sem fotos de prova hoje.</p>;
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map(({ kind, url }) => (
        <button key={url} onClick={() => setBig(url)} className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary">
          <img src={url} alt={`Prova de ${LABEL[kind]}`} className="w-full h-full object-cover" />
          <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] py-0.5 flex items-center justify-center gap-0.5">
            <ShieldCheck className="w-3 h-3" /> {LABEL[kind]}
          </span>
        </button>
      ))}
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
