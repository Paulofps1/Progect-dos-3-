import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImageIcon, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shrinkPhoto } from '@/lib/desafio/localStore';
import type { ProofKind } from '@/lib/desafio/proofs';
import { toast } from 'sonner';

// Foto de prova do treino/cardio. Os outros participantes conseguem ver.

const COPY: Record<ProofKind, { title: string; hint: string }> = {
  treino: { title: 'Prova do treino', hint: 'Foto na academia, do equipamento ou do app do relógio.' },
  cardio: { title: 'Prova do cardio', hint: 'Print do Strava ou do app Saúde/Fitness mostrando distância ou tempo do dia.' },
};

type Props = { kind: ProofKind | null; onClose: () => void; onSend: (kind: ProofKind, photo: Blob) => Promise<boolean> };

export function ProofSheet({ kind, onClose, onSend }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const url = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  useEffect(() => setPhoto(null), [kind]);

  const pick = async (f?: File) => {
    if (!f) return;
    try {
      setPhoto(await shrinkPhoto(f, 1200));
    } catch {
      toast.error('Não consegui ler essa foto');
    }
  };

  const send = async () => {
    if (!kind || !photo) return;
    setBusy(true);
    const ok = await onSend(kind, photo);
    setBusy(false);
    if (ok) {
      toast.success(kind === 'treino' ? 'Treino marcado com prova' : 'Cardio marcado com prova');
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {kind && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-end justify-center"
          onClick={() => !busy && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-8 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> {COPY[kind].title}
              </h3>
              <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{COPY[kind].hint} Os outros participantes podem ver.</p>

            <div className="mt-4">
              {url ? (
                <div className="relative">
                  <img src={url} alt="" className="w-full max-h-[50vh] object-contain rounded-2xl bg-secondary" />
                  <button
                    onClick={() => setPhoto(null)}
                    aria-label="Trocar foto"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => camera.current?.click()} className="aspect-[4/3] rounded-2xl bg-primary/15 flex flex-col items-center justify-center gap-2 font-medium text-foreground">
                    <Camera className="w-7 h-7" /> Tirar foto
                  </button>
                  <button onClick={() => gallery.current?.click()} className="aspect-[4/3] rounded-2xl bg-secondary flex flex-col items-center justify-center gap-2 font-medium text-foreground">
                    <ImageIcon className="w-7 h-7" /> Print / galeria
                  </button>
                </div>
              )}
            </div>

            <Button onClick={send} disabled={!photo || busy} className="w-full h-12 rounded-2xl font-semibold mt-4">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar e marcar'}
            </Button>

            <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
