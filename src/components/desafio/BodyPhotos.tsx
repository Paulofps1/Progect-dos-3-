import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Camera, ChevronLeft, ChevronRight, ImageIcon, Loader2, Scale, Trash2, X } from 'lucide-react';
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { useDesafio } from '@/hooks/useDesafio';
import { photoError, shrinkPhoto } from '@/lib/desafio/localStore';
import { IS_DEMO } from '@/lib/desafio/remote';
import { INITIAL_WEIGHTS, num, todayStr } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Evolução em fotos do corpo: antes e agora, com o peso de cada foto e quanto mudou.
// Privadas (pasta "refeicoes", subpasta <usuário>/corpo, que só o dono acessa).
// O peso vai no nome do arquivo (<dia>_<n>_w<kg>.jpg); foto sem peso usa a pesagem
// mais próxima até aquele dia (ou o peso inicial do desafio).

type Photo = { name: string; date: string; url: string; kg: number | null };
type D = ReturnType<typeof useDesafio>;

const BUCKET = 'refeicoes';
const demoPhotos: Photo[] = [];
const kgFromName = (name: string) => {
  const m = name.match(/_w(\d+(?:\.\d+)?)\.jpg$/);
  return m ? Number(m[1]) : null;
};
const dayLabel = (d: string) => format(parseISO(d), "dd 'de' MMM", { locale: ptBR });
const longDay = (d: string) => format(parseISO(d), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
const parseKg = (v: string) => parseFloat(v.replace(',', '.'));

export function BodyPhotos({ userId, d }: { userId: string; d: D }) {
  const [raw, setRaw] = useState<Photo[]>(IS_DEMO ? demoPhotos : []);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [range, setRange] = useState<'30' | 'tudo'>('tudo');
  const [viewer, setViewer] = useState<number | null>(null);
  const [draft, setDraft] = useState<Blob | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const dir = `${userId}/corpo`;

  const first = d.player ? INITIAL_WEIGHTS[d.player] : null;
  const sortedWeights = useMemo(() => [...d.weights].sort((a, b) => (a.date < b.date ? -1 : 1)), [d.weights]);
  const currentKg = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].kg : first;
  // peso da foto: o do arquivo; senão a última pesagem até aquele dia; senão o inicial
  const weightOn = useCallback(
    (p: Photo) => p.kg ?? [...sortedWeights].reverse().find((w) => w.date <= p.date)?.kg ?? first,
    [sortedWeights, first],
  );

  const load = useCallback(async () => {
    if (IS_DEMO) return;
    const { data } = await supabase.storage.from(BUCKET).list(dir, { limit: 300 });
    const names = (data || []).filter((f) => f.name.endsWith('.jpg')).map((f) => f.name).sort();
    if (!names.length) {
      setRaw([]);
      setLoading(false);
      return;
    }
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(names.map((n) => `${dir}/${n}`), 3600);
    setRaw(names.map((name, i) => ({ name, date: name.slice(0, 10), kg: kgFromName(name), url: signed?.[i]?.signedUrl ?? '' })).filter((p) => p.url));
    setLoading(false);
  }, [dir]);

  useEffect(() => {
    load();
  }, [load]);

  const pick = async (file?: File) => {
    if (!file) return;
    try {
      setDraft(await shrinkPhoto(file, 1400));
    } catch (e) {
      toast.error(photoError(file, e), { duration: 12000 });
    }
  };

  const save = async (blob: Blob, kg: number | null) => {
    const today = todayStr();
    const name = `${today}_${Date.now()}${kg ? `_w${Math.round(kg * 10) / 10}` : ''}.jpg`;
    if (IS_DEMO) {
      demoPhotos.push({ name, date: today, kg, url: URL.createObjectURL(blob) });
      setRaw([...demoPhotos]);
    } else {
      const { error } = await supabase.storage.from(BUCKET).upload(`${dir}/${name}`, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) {
        const err = error as { message?: string; statusCode?: string | number; error?: string };
        toast.error(`Não salvou a foto: ${[err.statusCode, err.error, err.message].filter(Boolean).join(' · ')}`, { duration: 15000 });
        return false;
      }
      // mostra na hora; a lista do banco vem em seguida
      setRaw((cur) => [...cur, { name, date: today, kg, url: URL.createObjectURL(blob) }].sort((a, b) => (a.name < b.name ? -1 : 1)));
      load();
    }
    // peso novo também vira a pesagem de hoje (Placar e desempate)
    if (kg && kg !== currentKg) d.saveWeight(Math.round(kg * 10) / 10);
    toast.success('Foto adicionada à sua evolução');
    return true;
  };

  const remove = async (p: Photo) => {
    if (!confirm('Apagar esta foto?')) return;
    if (IS_DEMO) {
      demoPhotos.splice(demoPhotos.findIndex((x) => x.name === p.name), 1);
      setRaw([...demoPhotos]);
    } else {
      await supabase.storage.from(BUCKET).remove([`${dir}/${p.name}`]);
      setRaw((cur) => cur.filter((x) => x.name !== p.name));
    }
    setViewer(null);
  };

  const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const shown = range === '30' ? raw.filter((p) => p.date >= since) : raw;
  const firstPhoto = raw[0];
  const before = shown[0];
  const now = shown[shown.length - 1];
  const delta = (p: Photo) => {
    const a = firstPhoto && weightOn(firstPhoto);
    const b = weightOn(p);
    return a && b ? Math.round((b - a) * 10) / 10 : null;
  };
  const daysFromFirst = (p: Photo) => (firstPhoto ? differenceInCalendarDays(parseISO(p.date), parseISO(firstPhoto.date)) : 0);
  const compare =
    before && now && before !== now
      ? { kg: (weightOn(now) ?? 0) - (weightOn(before) ?? 0), days: differenceInCalendarDays(parseISO(now.date), parseISO(before.date)) }
      : null;

  return (
    <div className="space-y-4">
      {/* Antes × Agora */}
      {compare && (
        <section className="bg-card rounded-3xl p-4 border border-border/30 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['Antes', before],
                ['Agora', now],
              ] as const
            ).map(([label, p]) => (
              <button key={label} onClick={() => setViewer(raw.indexOf(p))} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary">
                <img src={p.url} alt={label} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 rounded-full bg-black/55 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1">{label}</span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent text-white text-left px-3 pt-8 pb-2.5">
                  <span className="block text-base font-bold leading-none">{weightOn(p) ? `${num(weightOn(p)!)} kg` : '–'}</span>
                  <span className="block text-[11px] opacity-90 mt-1">{dayLabel(p.date)}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm">
            {compare.kg !== 0 && (compare.kg < 0 ? <ArrowDown className="w-4 h-4 text-primary" /> : <ArrowUp className="w-4 h-4 text-destructive" />)}
            <span className="font-semibold text-foreground">
              {compare.kg === 0 ? 'Mesmo peso' : `${compare.kg < 0 ? '−' : '+'}${num(Math.abs(Math.round(compare.kg * 10) / 10))} kg`}
            </span>
            <span className="text-muted-foreground">
              em {compare.days} {compare.days === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </section>
      )}

      {/* Linha do tempo */}
      <section className="bg-card rounded-3xl p-4 border border-border/30 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Linha do tempo</h3>
            <p className="text-xs text-muted-foreground">
              {raw.length} {raw.length === 1 ? 'foto' : 'fotos'} · só você vê
            </p>
          </div>
          <div className="flex rounded-full bg-secondary p-0.5 text-xs font-semibold">
            {(['30', 'tudo'] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-full ${range === r ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>
                {r === '30' ? '30 dias' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button onClick={() => camera.current?.click()} className="h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" /> Tirar foto
          </button>
          <button onClick={() => gallery.current?.click()} className="h-12 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5" /> Da galeria
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : shown.length ? (
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {[...shown].reverse().map((p) => {
              const kg = weightOn(p);
              const dl = delta(p);
              return (
                <button key={p.name} onClick={() => setViewer(raw.indexOf(p))} className="text-left rounded-2xl overflow-hidden bg-secondary/50 border border-border/40">
                  <div className="aspect-[3/4] bg-secondary">
                    <img src={p.url} alt={dayLabel(p.date)} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-sm font-bold text-foreground leading-tight">{kg ? `${num(kg)} kg` : 'sem peso'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {dayLabel(p.date)}
                      {dl ? (
                        <span className={dl < 0 ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                          {' · '}
                          {dl < 0 ? '−' : '+'}
                          {num(Math.abs(dl))}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Tire a 1ª foto hoje: de frente, mesma roupa, mesmo lugar e mesma luz. Repita no dia de cada pesagem e veja o antes e agora.
          </p>
        )}

        <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      </section>

      <SaveSheet draft={draft} defaultKg={currentKg} onClose={() => setDraft(null)} onSave={save} />

      {viewer !== null && raw[viewer] && (
        <Viewer photos={raw} index={viewer} setIndex={setViewer} weightOn={weightOn} delta={delta} daysFromFirst={daysFromFirst} onDelete={remove} />
      )}
    </div>
  );
}

/** Depois de escolher a foto: confirma o peso daquele dia e salva. */
function SaveSheet({
  draft,
  defaultKg,
  onClose,
  onSave,
}: {
  draft: Blob | null;
  defaultKg: number | null;
  onClose: () => void;
  onSave: (b: Blob, kg: number | null) => Promise<boolean>;
}) {
  const [kg, setKg] = useState('');
  const [busy, setBusy] = useState(false);
  const url = useMemo(() => (draft ? URL.createObjectURL(draft) : null), [draft]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  useEffect(() => {
    if (draft) setKg(defaultKg ? String(defaultKg).replace('.', ',') : '');
  }, [draft, defaultKg]);

  const confirmSave = async () => {
    if (!draft) return;
    const v = parseKg(kg);
    if (kg.trim() && !(v >= 35 && v <= 300)) return toast.error('Peso em kg, ex.: 92,8');
    setBusy(true);
    const ok = await onSave(draft, kg.trim() ? v : null);
    setBusy(false);
    if (ok) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {draft && url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end justify-center"
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
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
            <img src={url} alt="" className="w-full max-h-[48vh] object-contain rounded-2xl bg-secondary" />
            <p className="text-sm font-semibold text-foreground mt-4 first-letter:uppercase">{longDay(todayStr())}</p>
            <label className="flex items-center gap-3 mt-3 rounded-2xl bg-secondary/70 px-4 py-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-xs text-muted-foreground">Peso hoje (kg) · opcional</span>
                <input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" placeholder="92,8" className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none" />
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground mt-2">Se mudar o peso, ele também vira a pesagem de hoje.</p>
            <Button onClick={confirmSave} disabled={busy} className="w-full h-12 rounded-2xl font-semibold mt-4">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar na evolução'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Tela cheia: desliza entre as fotos, com data, peso e quanto mudou. */
function Viewer({
  photos,
  index,
  setIndex,
  weightOn,
  delta,
  daysFromFirst,
  onDelete,
}: {
  photos: Photo[];
  index: number;
  setIndex: (i: number | null) => void;
  weightOn: (p: Photo) => number | null;
  delta: (p: Photo) => number | null;
  daysFromFirst: (p: Photo) => number;
  onDelete: (p: Photo) => void;
}) {
  const p = photos[index];
  const touch = useRef<number | null>(null);
  const go = useCallback(
    (by: number) => {
      const n = index + by;
      if (n >= 0 && n < photos.length) setIndex(n);
    },
    [index, photos.length, setIndex],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') setIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, setIndex]);
  const kg = weightOn(p);
  const dl = delta(p);
  const days = daysFromFirst(p);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black flex flex-col text-white select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setIndex(null)} aria-label="Fechar" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs text-white/70">
          {index + 1} de {photos.length}
        </span>
        <button onClick={() => onDelete(p)} aria-label="Apagar foto" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-rose-300">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-2 min-h-0">
        <img src={p.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        {index > 0 && (
          <button onClick={() => go(-1)} aria-label="Anterior" className="absolute left-2 w-10 h-10 rounded-full bg-black/40 hidden sm:flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {index < photos.length - 1 && (
          <button onClick={() => go(1)} aria-label="Próxima" className="absolute right-2 w-10 h-10 rounded-full bg-black/40 hidden sm:flex items-center justify-center">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="px-5 pt-4 pb-5">
        <p className="text-sm text-white/70 first-letter:uppercase">{longDay(p.date)}</p>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-4xl font-bold leading-none">{kg ? `${num(kg)} kg` : 'sem peso'}</span>
          {dl ? (
            <span className={`mb-0.5 rounded-full px-2.5 py-1 text-sm font-semibold ${dl < 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {dl < 0 ? '−' : '+'}
              {num(Math.abs(dl))} kg
            </span>
          ) : null}
        </div>
        <p className="text-xs text-white/60 mt-2">
          {index === 0 ? 'Primeira foto da sua evolução' : `${days} ${days === 1 ? 'dia' : 'dias'} depois da primeira foto`}
          {photos.length > 1 && ' · deslize para ver as outras'}
        </p>
      </div>
    </div>,
    document.body,
  );
}
