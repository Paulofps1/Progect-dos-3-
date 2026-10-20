import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImageIcon, Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shrinkPhoto } from '@/lib/desafio/localStore';
import type { ProofKind } from '@/lib/desafio/proofs';
import { toast } from 'sonner';

// Fotos de prova (print do Strava / app Saúde). Pode mandar mais de uma, por exemplo
// a ida e a volta da academia. Os outros participantes conseguem ver.

const MAX = 6;
const COPY: Record<ProofKind, { title: string; hint: string; done: string }> = {
  passos: {
    title: 'Prova da caminhada',
    hint: 'Print do Strava ou do app Saúde/Fitness mostrando a distância. Somando tudo tem que dar 4 km ou mais: pode mandar mais de um (ida e volta).',
    done: 'Caminhada marcada com prova',
  },
  treino: { title: 'Prova do treino', hint: 'Foto na academia, do equipamento ou do app do relógio.', done: 'Treino marcado com prova' },
  cardio: { title: 'Prova do cardio', hint: 'Print do Strava ou do app Saúde/Fitness mostrando distância ou tempo do dia.', done: 'Cardio marcado com prova' },
};

type Props = { kind: ProofKind | null; onClose: () => void; onSend: (kind: ProofKind, photos: Blob[]) => Promise<boolean> };

export function ProofSheet({ kind, onClose, onSend }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [busy, setBusy] = useState(false);
  const urls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  useEffect(() => setPhotos([]), [kind]);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].slice(0, MAX - photos.length);
    try {
      const shrunk = await Promise.all(list.map((f) => shrinkPhoto(f, 1200)));
      setPhotos((cur) => [...cur, ...shrunk]);
    } catch {
      toast.error('Não consegui ler essa foto');
    }
  };

  const send = async () => {
    if (!kind || !photos.length) return;
    setBusy(true);
    const ok = await onSend(kind, photos);
    setBusy(false);
    if (ok) {
      toast.success(COPY[kind].done);
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
            className="w-full max-w-lg bg-card rounded-t-3xl p-5 border-t border-border max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
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

            {photos.length ? (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {urls.map((u, i) => (
                  <div key={u} className="relative">
                    <img src={u} alt="" className="w-full aspect-[3/4] object-cover rounded-xl bg-secondary" />
                    <button
                      onClick={() => setPhotos((cur) => cur.filter((_, j) => j !== i))}
                      aria-label="Tirar foto"
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX && (
                  <button
                    onClick={() => gallery.current?.click()}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-border text-muted-foreground flex flex-col items-center justify-center gap-1 text-xs"
                  >
                    <Plus className="w-5 h-5" /> Mais uma
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => gallery.current?.click()} className="aspect-[4/3] rounded-2xl bg-primary/15 flex flex-col items-center justify-center gap-2 font-medium text-foreground">
                  <ImageIcon className="w-7 h-7" /> Print / galeria
                </button>
                <button onClick={() => camera.current?.click()} className="aspect-[4/3] rounded-2xl bg-secondary flex flex-col items-center justify-center gap-2 font-medium text-foreground">
                  <Camera className="w-7 h-7" /> Tirar foto
                </button>
              </div>
            )}

            <Button onClick={send} disabled={!photos.length || busy} className="w-full h-12 rounded-2xl font-semibold mt-4">
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : photos.length > 1 ? (
                `Enviar ${photos.length} fotos e marcar`
              ) : (
                'Enviar e marcar'
              )}
            </Button>

            <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
            <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
