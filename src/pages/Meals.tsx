import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Coffee, Sun, Moon, Cookie, Utensils, X, Check, Camera, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/app/AppLayout';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { photoError, shrinkPhotos } from '@/lib/desafio/localStore';
import { getMealPhotos, removeMealPhotos, retryPendingPhotos, saveMealPhotos } from '@/lib/desafio/mealCloud';

// Refeições: diário de fotos do que comeu, com uma anotação opcional.
// Não conta calorias. Cada refeição precisa de foto; 2 por dia fecham o
// "Pratos com foto" do desafio (meal_items guarda quantas fotos tem). Fotos são privadas.

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  date: string;
  time: string | null;
  created_at: string;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MAX_PHOTOS = 4;

const mealTypes = [
  { id: 'breakfast', label: 'Café da manhã', icon: Coffee, color: 'from-amber-500 to-orange-500', time: '07:00' },
  { id: 'lunch', label: 'Almoço', icon: Sun, color: 'from-orange-500 to-red-500', time: '12:00' },
  { id: 'snack', label: 'Lanche', icon: Cookie, color: 'from-pink-500 to-rose-500', time: '15:00' },
  { id: 'dinner', label: 'Jantar', icon: Moon, color: 'from-indigo-500 to-purple-500', time: '19:00' },
  { id: 'supper', label: 'Ceia', icon: Utensils, color: 'from-slate-500 to-zinc-500', time: '21:00' },
];
const typeOf = (id: string) => mealTypes.find((m) => m.id === id);

// sugestão pelo horário, para o "Registrar" já abrir no tipo certo
const typeByHour = () => {
  const h = new Date().getHours();
  return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : h < 21 ? 'dinner' : 'supper';
};

// última lista vista: voltar para Refeições não mostra "carregando" de novo
let lastSeen: { date: string; meals: Meal[]; counts: Record<string, number> } | null = null;
// fotos já abertas nesta sessão (por refeição), para não sumirem e voltarem
const photoUrls = new Map<string, string[]>();
const cachedPhotos = (list: Meal[]) => Object.fromEntries(list.filter((m) => photoUrls.has(m.id)).map((m) => [m.id, photoUrls.get(m.id)!]));

const Meals = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  // ?dia=AAAA-MM-DD abre direto naquele dia (vindo do Resumo)
  const [date, setDate] = useState(() => {
    const dia = new URLSearchParams(location.search || location.hash.split('?')[1] || '').get('dia');
    return dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && dia <= today ? dia : today;
  });
  const cached = lastSeen?.date === today ? lastSeen : null;
  const [loading, setLoading] = useState(!cached);
  const [meals, setMeals] = useState<Meal[]>(cached?.meals ?? []);
  const [countByDay, setCountByDay] = useState<Record<string, number>>(cached?.counts ?? {});
  const [photos, setPhotos] = useState<Record<string, string[]>>(() => cachedPhotos(cached?.meals ?? []));
  const [viewer, setViewer] = useState<string | null>(null);

  const [form, setForm] = useState(false);
  const [mealType, setMealType] = useState(typeByHour);
  const [note, setNote] = useState('');
  const [draftPhotos, setDraftPhotos] = useState<Blob[]>([]);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')), []);

  const loadPhotos = useCallback(
    async (list: Meal[]) => {
      if (!user) return;
      setPhotos(cachedPhotos(list));
      for (const m of list) {
        if (photoUrls.has(m.id)) continue;
        const blobs = await getMealPhotos(user.id, m.id).catch(() => []);
        if (!blobs.length) continue;
        photoUrls.set(m.id, blobs.map((b) => URL.createObjectURL(b)));
        setPhotos(cachedPhotos(list));
      }
    },
    [user],
  );

  const loadedDate = useRef<string | null>(cached ? today : null);
  const loadData = useCallback(async () => {
    if (!user) return;
    // carregando só ao trocar de dia; recarregar o mesmo dia não apaga a lista (piscava)
    if (loadedDate.current !== date) setLoading(true);
    loadedDate.current = date;
    const [dayMeals, recent] = await Promise.all([
      supabase.from('meals').select('id, name, meal_type, date, time, created_at').eq('user_id', user.id).eq('date', date).order('time', { ascending: true }),
      supabase.from('meals').select('date').eq('user_id', user.id).gte('date', days[days.length - 1]),
    ]);
    const list = (dayMeals.data || []) as Meal[];
    setMeals(list);
    const counts: Record<string, number> = {};
    for (const r of recent.data || []) if (r.date) counts[r.date] = (counts[r.date] || 0) + 1;
    setCountByDay(counts);
    setLoading(false);
    if (date === today) lastSeen = { date, meals: list, counts };
    loadPhotos(list);
  }, [user, date, today, days, loadPhotos]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) retryPendingPhotos(user.id);
  }, [user]);

  const openForm = () => {
    setMealType(typeByHour());
    setNote('');
    setDraftPhotos([]);
    setForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!draftPhotos.length) return toast.error('Coloque a foto do prato');
    setSaving(true);
    const t = typeOf(mealType)!;
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: note.trim() || t.label,
        meal_type: mealType,
        date,
        time: date === today ? format(new Date(), 'HH:mm') : t.time,
        meal_items: [{ fotos: draftPhotos.length }],
      })
      .select('id')
      .single();
    if (error || !data) {
      setSaving(false);
      return toast.error('Não salvou, confira a internet');
    }
    await saveMealPhotos(user.id, data.id, draftPhotos);
    setSaving(false);
    setForm(false);
    toast.success(`${t.label} registrado`);
    loadData();
  };

  const handleDelete = async (meal: Meal) => {
    if (!user || !confirm(`Apagar ${typeOf(meal.meal_type)?.label ?? meal.name}?`)) return;
    const { error } = await supabase.from('meals').delete().eq('id', meal.id);
    if (error) return toast.error('Não apagou');
    await removeMealPhotos(user.id, meal.id).catch(() => undefined);
    photoUrls.get(meal.id)?.forEach((u) => URL.revokeObjectURL(u));
    photoUrls.delete(meal.id);
    toast.success('Refeição apagada');
    loadData();
  };

  const isToday = date === today;

  return (
    <AppLayout activeNav="meals" showNav={!form}>
      <div className="min-h-screen pb-28 lg:pb-8">
        {/* Cabeçalho */}
        <div className="px-4 pt-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Refeições</h1>
            <p className="text-muted-foreground text-sm first-letter:uppercase">
              {isToday ? 'hoje, ' : ''}
              {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={openForm} className="rounded-2xl h-11 px-4 font-semibold flex-shrink-0">
            <Camera className="w-4 h-4 mr-1.5" /> Registrar
          </Button>
        </div>

        {/* Dias */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar" role="tablist" aria-label="Dia">
          {days.map((d) => {
            const on = d === date;
            const n = countByDay[d] || 0;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={on}
                onClick={() => setDate(d)}
                className={`flex-shrink-0 w-14 rounded-2xl border py-2 text-center transition-colors ${
                  on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'
                }`}
              >
                <span className={`block text-[10px] uppercase ${on ? '' : 'text-muted-foreground'}`}>
                  {d === today ? 'hoje' : WEEKDAYS[parseISO(d).getDay()]}
                </span>
                <span className="block text-lg font-bold leading-tight">{d.slice(8)}</span>
                <span className="flex justify-center gap-0.5 h-2 mt-0.5">
                  {Array.from({ length: Math.min(n, 5) }, (_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${on ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="px-4 mt-5">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : meals.length === 0 ? (
            <button onClick={openForm} className="w-full text-center py-12 rounded-3xl border-2 border-dashed border-border">
              <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground text-sm font-medium">Nada registrado {isToday ? 'hoje' : 'neste dia'}</p>
              <p className="text-muted-foreground text-xs mt-1">Toque para tirar a foto do prato</p>
            </button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-start">
              {meals.map((meal) => {
                const info = typeOf(meal.meal_type);
                const Icon = info?.icon || Utensils;
                const pics = photos[meal.id] || [];
                const hasNote = meal.name && meal.name !== info?.label;
                return (
                  <div key={meal.id} className="rounded-3xl bg-card border border-border overflow-hidden">
                    {pics.length > 0 && (
                      <div className={`grid gap-0.5 ${pics.length > 1 ? 'grid-cols-2' : ''}`}>
                        {pics.map((u, i) => {
                          const wide = pics.length === 3 && i === 0;
                          return (
                            <button key={u} onClick={() => setViewer(u)} className={wide ? 'col-span-2' : ''} aria-label="Ampliar foto">
                              <img
                                src={u}
                                alt={`Foto de ${info?.label ?? meal.name}`}
                                className={`w-full object-cover ${pics.length === 1 ? 'aspect-[4/3]' : wide ? 'aspect-[2/1]' : 'aspect-square'}`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold">
                          {info?.label ?? meal.name}
                          {meal.time && <span className="text-muted-foreground font-normal text-sm"> · {meal.time.slice(0, 5)}</span>}
                        </p>
                        {hasNote && <p className="text-sm text-muted-foreground break-words">{meal.name}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(meal)}
                        aria-label="Apagar refeição"
                        className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-4 text-center">No mínimo 2 refeições com foto por dia para fechar o dia. Só você vê suas fotos.</p>
        </div>

        {/* Registrar (portal: fica por cima do menu de baixo) */}
        {createPortal(
          <AnimatePresence>
            {form && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-end justify-center"
                onClick={() => !saving && setForm(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30 }}
                  className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-8 border-t border-border max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground font-semibold text-lg">
                      Registrar {!isToday && <span className="text-muted-foreground font-normal text-sm">· {format(parseISO(date), 'dd/MM')}</span>}
                    </h3>
                    <button onClick={() => setForm(false)} aria-label="Fechar" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <PhotoPicker photos={draftPhotos} onChange={setDraftPhotos} />

                  <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-1 px-1">
                    {mealTypes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setMealType(t.id)}
                        className={`flex-shrink-0 h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                          mealType === t.id ? 'bg-foreground text-background' : 'bg-secondary text-foreground'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={120}
                    placeholder="O que era? (opcional)"
                    className="w-full mt-4 h-12 rounded-2xl bg-secondary px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />

                  <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-2xl font-semibold mt-4">
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-1.5" /> Salvar
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

        {/* Foto ampliada */}
        {createPortal(
          <AnimatePresence>
            {viewer && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewer(null)}
                aria-label="Fechar foto"
                className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
              >
                <img src={viewer} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
              </motion.button>
            )}
          </AnimatePresence>,
          document.body,
        )}
      </div>
    </AppLayout>
  );
};

/** Fotos do prato: câmera ou galeria, até 4. A 1ª vem grande. */
function PhotoPicker({ photos, onChange }: { photos: Blob[]; onChange: (p: Blob[]) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const urls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].slice(0, MAX_PHOTOS - photos.length);
    setBusy(true);
    try {
      onChange([...photos, ...(await shrinkPhotos(list))]);
    } catch (e) {
      toast.error(photoError(list[0], e), { duration: 12000 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {photos.length === 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => camera.current?.click()}
            disabled={busy}
            className="aspect-[4/3] rounded-2xl bg-primary/15 text-foreground flex flex-col items-center justify-center gap-2 font-medium"
          >
            {busy ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7" />}
            Tirar foto
          </button>
          <button
            onClick={() => gallery.current?.click()}
            disabled={busy}
            className="aspect-[4/3] rounded-2xl bg-secondary text-foreground flex flex-col items-center justify-center gap-2 font-medium"
          >
            <ImageIcon className="w-7 h-7" />
            Da galeria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {urls.map((u, i) => (
            <div key={u} className={`relative ${i === 0 ? 'col-span-4' : ''}`}>
              <img src={u} alt="" className={`w-full rounded-2xl object-cover ${i === 0 ? 'aspect-[4/3]' : 'aspect-square'}`} />
              <button
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                aria-label="Tirar foto"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => gallery.current?.click()}
              disabled={busy}
              aria-label="Mais fotos"
              className="aspect-square rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default Meals;
