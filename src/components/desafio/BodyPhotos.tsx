import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { shrinkPhoto } from '@/lib/desafio/localStore';
import { IS_DEMO } from '@/lib/desafio/remote';
import { todayStr } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Evolução em fotos do corpo: para o antes e depois. Privadas (pasta "refeicoes",
// subpasta <usuário>/corpo, que só o dono acessa).

type Photo = { name: string; date: string; url: string };
const BUCKET = 'refeicoes';
const demoPhotos: Photo[] = [];

export function BodyPhotos({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Photo[]>(IS_DEMO ? demoPhotos : []);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState<'30' | 'tudo'>('30');
  const [big, setBig] = useState<Photo | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const dir = `${userId}/corpo`;

  const load = useCallback(async () => {
    if (IS_DEMO) return;
    const { data } = await supabase.storage.from(BUCKET).list(dir, { limit: 200 });
    const names = (data || []).filter((f) => f.name.endsWith('.jpg')).map((f) => f.name).sort();
    if (!names.length) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(names.map((n) => `${dir}/${n}`), 3600);
    setPhotos(names.map((name, i) => ({ name, date: name.slice(0, 10), url: signed?.[i]?.signedUrl ?? '' })).filter((p) => p.url));
    setLoading(false);
  }, [dir]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await shrinkPhoto(file, 1200);
      const name = `${todayStr()}_${Date.now()}.jpg`;
      if (IS_DEMO) {
        demoPhotos.push({ name, date: todayStr(), url: URL.createObjectURL(blob) });
        setPhotos([...demoPhotos]);
      } else {
        const { error } = await supabase.storage.from(BUCKET).upload(`${dir}/${name}`, blob, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        // mostra na hora com a própria foto; a lista do banco vem em seguida
        setPhotos((cur) => [...cur, { name, date: todayStr(), url: URL.createObjectURL(blob) }]);
        load();
      }
      toast.success('Foto adicionada à sua evolução');
    } catch (e) {
      // mostra o motivo de verdade (ajuda a descobrir quando não salva)
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message;
      toast.error(`Não salvou a foto${msg ? `: ${msg}` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Photo) => {
    if (!confirm('Apagar esta foto?')) return;
    if (IS_DEMO) {
      demoPhotos.splice(demoPhotos.findIndex((x) => x.name === p.name), 1);
      setPhotos([...demoPhotos]);
    } else {
      await supabase.storage.from(BUCKET).remove([`${dir}/${p.name}`]);
      await load();
    }
    setBig(null);
  };

  const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const shown = range === '30' ? photos.filter((p) => p.date >= since) : photos;
  const before = shown[0];
  const now = shown[shown.length - 1];
  const fmt = (d: string) => format(parseISO(d), "dd 'de' MMM", { locale: ptBR });

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Evolução em fotos</h3>
          <p className="text-xs text-muted-foreground">Seu antes e depois · só você vê</p>
        </div>
        <div className="flex rounded-full bg-secondary p-0.5 text-xs font-semibold">
          {(['30', 'tudo'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full ${range === r ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>
              {r === '30' ? '30 dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {before && now && before !== now && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                ['Antes', before],
                ['Agora', now],
              ].map(([label, p]) => (
                <button key={label as string} onClick={() => setBig(p as Photo)} className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary">
                  <img src={(p as Photo).url} alt={label as string} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5">{label as string}</span>
                  <span className="absolute bottom-2 left-2 text-white text-[11px] drop-shadow">{fmt((p as Photo).date)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {shown.map((p) => (
              <button key={p.name} onClick={() => setBig(p)} className="aspect-square rounded-xl overflow-hidden bg-secondary">
                <img src={p.url} alt={fmt(p.date)} className="w-full h-full object-cover" />
              </button>
            ))}
            <button
              onClick={() => camera.current?.click()}
              disabled={busy}
              className="aspect-square rounded-xl border-2 border-dashed border-border text-muted-foreground flex flex-col items-center justify-center gap-1 text-[10px]"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              Foto
            </button>
            <button
              onClick={() => gallery.current?.click()}
              disabled={busy}
              className="aspect-square rounded-xl border-2 border-dashed border-border text-muted-foreground flex flex-col items-center justify-center gap-1 text-[10px]"
            >
              <ImageIcon className="w-5 h-5" />
              Galeria
            </button>
          </div>
          {!shown.length && <p className="text-xs text-muted-foreground mt-3">Tire uma foto no dia da pesagem, sempre no mesmo lugar e na mesma luz.</p>}
        </>
      )}

      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => { add(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => { add(e.target.files?.[0]); e.target.value = ''; }} />

      {big &&
        createPortal(
          <div className="fixed inset-0 z-[90] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setBig(null)}>
            <img src={big.url} alt="" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            <div className="flex items-center gap-4 mt-4 text-white text-sm" onClick={(e) => e.stopPropagation()}>
              <span>{fmt(big.date)}</span>
              <button onClick={() => remove(big)} className="flex items-center gap-1 text-rose-300">
                <Trash2 className="w-4 h-4" /> Apagar
              </button>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
