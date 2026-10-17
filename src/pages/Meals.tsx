import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, Loader2, Coffee, Sun, Moon, Cookie, Utensils, Copy, X, Check, Camera, ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/app/AppLayout';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { mealPhotos, shrinkPhoto } from '@/lib/desafio/localStore';
import { parseMealText, rememberFoods, searchFoods, type FoodMatch } from '@/lib/desafio/foods';

// Refeições: o foco é registrar o que comeu, contar as calorias e guardar a foto.
// O histórico é navegável por dia. Fotos ficam no aparelho até o back-end entrar.

interface MealItem {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  date: string;
  time: string | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  items: MealItem[];
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const mealTypes = [
  { id: 'breakfast', label: 'Café da manhã', icon: Coffee, color: 'from-amber-500 to-orange-500', time: '07:00' },
  { id: 'lunch', label: 'Almoço', icon: Sun, color: 'from-orange-500 to-red-500', time: '12:00' },
  { id: 'snack', label: 'Lanche', icon: Cookie, color: 'from-pink-500 to-rose-500', time: '15:00' },
  { id: 'dinner', label: 'Jantar', icon: Moon, color: 'from-indigo-500 to-purple-500', time: '19:00' },
  { id: 'supper', label: 'Ceia', icon: Utensils, color: 'from-slate-500 to-zinc-500', time: '21:00' },
];

type Draft = { id: string; name: string; calories: string; quantity: string; unit: string };
const newDraft = (id = '1'): Draft => ({ id, name: '', calories: '', quantity: '1', unit: '' });
const emptyDraft = (): Draft[] => [newDraft()];

// As tabelas pedem macros; o app só conta calorias, então mantemos a mesma estimativa de antes.
const macros = (kcal: number) => ({ protein: Math.round(kcal * 0.1), carbs: Math.round(kcal * 0.4), fat: Math.round(kcal * 0.03) });

const Meals = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekKcal, setWeekKcal] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [viewer, setViewer] = useState<string | null>(null);

  const [pickType, setPickType] = useState(false);
  const [mealType, setMealType] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft[]>(emptyDraft);
  const [draftPhotos, setDraftPhotos] = useState<Blob[]>([]);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')), []);

  const loadPhotos = useCallback(async (list: Meal[]) => {
    const out: Record<string, string[]> = {};
    for (const m of list) {
      const blobs = await mealPhotos.get(m.id).catch(() => []);
      if (blobs.length) out[m.id] = blobs.map((b) => URL.createObjectURL(b));
    }
    setPhotos((old) => {
      Object.values(old).flat().forEach((u) => URL.revokeObjectURL(u));
      return out;
    });
  }, []);

  const loadedDate = useRef<string | null>(null);
  const loadData = useCallback(async () => {
    if (!user) return;
    // carregando só ao trocar de dia; recarregar o mesmo dia não apaga a lista (piscava)
    if (loadedDate.current !== date) setLoading(true);
    loadedDate.current = date;
    const [dayMeals, week] = await Promise.all([
      supabase.from('meals').select('*').eq('user_id', user.id).eq('date', date).order('created_at', { ascending: true }),
      supabase.from('meals').select('date, total_calories').eq('user_id', user.id).gte('date', days[days.length - 1]),
    ]);
    const list = (dayMeals.data || []).map((m) => ({
      ...m,
      items: Array.isArray(m.meal_items) ? (m.meal_items as unknown as MealItem[]) : [],
    })) as Meal[];
    setMeals(list);
    const totals: Record<string, number> = {};
    for (const r of week.data || []) totals[r.date] = (totals[r.date] || 0) + (r.total_calories || 0);
    setWeekKcal(totals);
    setLoading(false);
    loadPhotos(list);
  }, [user, date, days, loadPhotos]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const total = meals.reduce((s, m) => s + (m.total_calories || 0), 0);

  // mantém daily_consumption em dia, como o resto do app espera
  const bumpConsumption = async (day: string, kcal: number) => {
    if (!user) return;
    const m = macros(Math.abs(kcal));
    const sign = Math.sign(kcal);
    const { data: cur } = await supabase.from('daily_consumption').select('*').eq('user_id', user.id).eq('date', day).maybeSingle();
    if (cur) {
      await supabase
        .from('daily_consumption')
        .update({
          calories: Math.max(0, (cur.calories || 0) + kcal),
          protein: Math.max(0, (cur.protein || 0) + sign * m.protein),
          carbs: Math.max(0, (cur.carbs || 0) + sign * m.carbs),
          fat: Math.max(0, (cur.fat || 0) + sign * m.fat),
        })
        .eq('id', cur.id);
    } else if (kcal > 0) {
      await supabase.from('daily_consumption').insert({ user_id: user.id, date: day, calories: kcal, ...m });
    }
  };

  // Foto → IA estima os alimentos e as kcal (função analyze-food-photo do Supabase)
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);

  const analyzePhoto = async (file: File) => {
    setAnalyzing(true);
    setAiNote('');
    try {
      const blob = await shrinkPhoto(file);
      const imageBase64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1]);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });
      setDraftPhotos((ph) => (ph.length < 4 ? [...ph, blob] : ph));
      const { data, error } = await supabase.functions.invoke('analyze-food-photo', { body: { imageBase64 } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const foods: { name: string; quantity?: number; calories?: number }[] = Array.isArray(data?.foods) ? data.foods : [];
      if (!foods.length) {
        toast.info('Não reconheci comida nessa foto. Registre digitando.');
        return;
      }
      const items: Draft[] = foods.map((f, n) => ({
        id: `ia-${Date.now()}-${n}`,
        name: String(f.name || 'Alimento').slice(0, 60),
        unit: f.quantity ? `${Math.round(f.quantity)} g (estimado)` : 'porção (estimada)',
        calories: String(Math.max(0, Math.round(Number(f.calories) || 0))),
        quantity: '1',
      }));
      // analisar de novo troca o resultado anterior da foto (antes somava e duplicava)
      setDraft((d) => [...d.filter((x) => x.name.trim() && !x.id.startsWith('ia-')), ...items]);
      setAiNote(data?.meal_description ? `${data.meal_description}. Confira as porções e as kcal.` : 'Confira as porções e as kcal.');
    } catch (e) {
      console.error('Erro na análise da foto:', e);
      toast.error('A análise da foto não respondeu. A foto ficou anexada; registre digitando.');
    } finally {
      setAnalyzing(false);
    }
  };

  // "Escrever o que comeu": entende quantidades e acha os alimentos na lista (local, sem IA)
  const [mealText, setMealText] = useState('');
  const addFromText = () => {
    const parsed = parseMealText(mealText);
    if (!parsed.length) return;
    const items: Draft[] = parsed.map((p, n) => ({ id: `tx-${Date.now()}-${n}`, name: p.name, unit: p.unit, calories: p.kcal, quantity: p.quantity }));
    setDraft((d) => [...d.filter((x) => x.name.trim()), ...items]);
    setMealText('');
    const missing = parsed.filter((p) => !p.found).length;
    if (missing) toast.info(missing === 1 ? 'Um item não está na lista: complete as kcal dele.' : `${missing} itens não estão na lista: complete as kcal deles.`);
  };

  const closeForm = () => {
    setMealType(null);
    setDraft(emptyDraft());
    setDraftPhotos([]);
    setAiNote('');
    setMealText('');
  };

  const handleSave = async () => {
    if (!mealType || !user) return;
    const valid = draft.filter((i) => i.name.trim());
    if (!valid.length) return toast.error('Escreva pelo menos um alimento');
    const noKcal = valid.find((i) => !i.calories);
    if (noKcal) return toast.error(`Complete as kcal de "${noKcal.name.trim()}"`);
    setSaving(true);
    try {
      const info = mealTypes.find((m) => m.id === mealType);
      const items: MealItem[] = valid.map((i) => {
        const cals = parseInt(i.calories) || 0;
        return { food_name: i.name.trim(), quantity: parseFloat(i.quantity.replace(',', '.')) || 1, unit: i.unit || 'porção', calories: cals, ...macros(cals) };
      });
      const kcal = Math.round(items.reduce((s, i) => s + i.calories * i.quantity, 0));
      const m = macros(kcal);
      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: info?.label || 'Refeição',
          meal_type: mealType,
          date,
          time: info?.time || null,
          total_calories: kcal,
          total_protein: m.protein,
          total_carbs: m.carbs,
          total_fat: m.fat,
          meal_items: items as never,
        })
        .select('id')
        .single();
      if (error) throw error;
      rememberFoods(items.map((i) => ({ name: i.food_name, unit: i.unit, kcal: i.calories })));
      if (draftPhotos.length) await mealPhotos.set(data.id, draftPhotos);
      await bumpConsumption(date, kcal);
      toast.success('Refeição registrada');
      closeForm();
      loadData();
    } catch (e) {
      console.error('Erro ao salvar refeição:', e);
      toast.error('Não salvou a refeição');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (meal: Meal) => {
    if (!confirm(`Apagar ${meal.name}?`)) return;
    const { error } = await supabase.from('meals').delete().eq('id', meal.id);
    if (error) return toast.error('Não apagou');
    await mealPhotos.remove(meal.id);
    await bumpConsumption(meal.date, -(meal.total_calories || 0));
    toast.success('Refeição apagada');
    loadData();
  };

  const handleCopyToToday = async (meal: Meal) => {
    if (!user) return;
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      name: meal.name,
      meal_type: meal.meal_type,
      date: today,
      time: meal.time,
      total_calories: meal.total_calories,
      total_protein: meal.total_protein,
      total_carbs: meal.total_carbs,
      total_fat: meal.total_fat,
      meal_items: meal.items as never,
    });
    if (error) return toast.error('Não copiou');
    await bumpConsumption(today, meal.total_calories || 0);
    toast.success('Copiada para hoje');
    if (date === today) loadData();
  };

  const draftTotal = draft.reduce((s, i) => s + (parseInt(i.calories) || 0) * (parseFloat(i.quantity.replace(',', '.')) || 1), 0);
  const isToday = date === today;

  return (
    <AppLayout activeNav="meals" showNav={!mealType}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        {/* Cabeçalho */}
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold text-foreground">Refeições</h1>
          <p className="text-muted-foreground text-sm first-letter:uppercase">
            {isToday ? 'hoje, ' : ''}
            {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Histórico por dia */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar" role="tablist" aria-label="Dia">
          {days.map((d) => {
            const on = d === date;
            const kcal = weekKcal[d];
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
                <span className={`block text-[9px] ${on ? '' : 'text-muted-foreground'}`}>{kcal ? `${kcal}` : '–'}</span>
              </button>
            );
          })}
        </div>

        {/* Total do dia */}
        <div className="mx-4 mt-4 p-5 rounded-3xl bg-card border border-border">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Calorias {isToday ? 'de hoje' : 'do dia'}</p>
              <p className="text-4xl font-bold text-foreground leading-none mt-1">
                {total}
                <span className="text-base font-medium text-muted-foreground"> kcal</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {meals.length} {meals.length === 1 ? 'refeição' : 'refeições'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Só registro: as calorias não entram na pontuação.</p>
        </div>

        {/* Lista */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-muted-foreground text-sm font-medium">O que comeu</h3>
            <Button size="sm" onClick={() => setPickType(true)} className="rounded-xl h-9">
              <Plus className="w-4 h-4 mr-1" /> Registrar
            </Button>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : meals.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-dashed border-border">
              <Utensils className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nada registrado {isToday ? 'hoje' : 'neste dia'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => {
                const info = mealTypes.find((m) => m.id === meal.meal_type);
                const Icon = info?.icon || Utensils;
                const pics = photos[meal.id] || [];
                return (
                  <div key={meal.id} className="p-4 rounded-2xl bg-card border border-border">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-foreground font-medium">{meal.name}</h4>
                          <span className="text-foreground font-bold whitespace-nowrap">{meal.total_calories} kcal</span>
                        </div>
                        {meal.items.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {meal.items.map((i, n) => (
                              <li key={n} className="flex justify-between text-xs text-muted-foreground">
                                <span className="truncate">
                                  {i.quantity !== 1 ? `${String(i.quantity).replace('.', ',')}× ` : ''}
                                  {i.food_name}
                                </span>
                                <span>{Math.round(i.calories * i.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    {pics.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {pics.map((u) => (
                          <button key={u} onClick={() => setViewer(u)} className="flex-shrink-0">
                            <img src={u} alt={`Foto de ${meal.name}`} className="w-20 h-20 rounded-xl object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {!isToday && (
                        <button onClick={() => handleCopyToToday(meal)} className="h-8 px-3 rounded-lg bg-secondary text-xs text-muted-foreground flex items-center gap-1.5">
                          <Copy className="w-3.5 h-3.5" /> Repetir hoje
                        </button>
                      )}
                      <button onClick={() => handleDelete(meal)} aria-label="Apagar refeição" className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-4 text-center">As fotos ficam salvas neste aparelho por enquanto.</p>
        </div>

        {/* Escolher tipo (portal: fica por cima do menu de baixo) */}
        {createPortal(
        <AnimatePresence>
          {pickType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-end justify-center"
              onClick={() => setPickType(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30 }}
                className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 border-t border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-5" />
                <h3 className="text-foreground font-semibold text-lg text-center">Qual refeição?</h3>
                {!isToday && (
                  <p className="text-xs text-muted-foreground text-center mt-1">Vai ser registrada em {format(parseISO(date), 'dd/MM')}</p>
                )}
                <div className="space-y-2.5 mt-5">
                  {mealTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setMealType(t.id);
                        setPickType(false);
                      }}
                      className="w-full p-3.5 rounded-2xl bg-secondary border border-border flex items-center gap-4"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-foreground font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setPickType(false)} className="w-full mt-4 py-3 text-muted-foreground font-medium">
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
          document.body,
        )}

        {/* Formulário */}
        <AnimatePresence>
          {mealType && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background z-50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-4">
                <button onClick={closeForm} aria-label="Fechar" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-5 h-5 text-foreground" />
                </button>
                <h2 className="text-foreground font-semibold">{mealTypes.find((m) => m.id === mealType)?.label}</h2>
                <div className="w-10" />
              </div>

              <div className="flex-1 overflow-auto px-4 pb-4 max-w-lg w-full mx-auto space-y-4">
                {/* jeitos de preencher: escrever ou foto */}
                <div className="bg-card rounded-3xl border border-border/30 shadow-sm p-3">
                  <textarea
                    id="o-que-comeu"
                    value={mealText}
                    onChange={(e) => setMealText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addFromText();
                      }
                    }}
                    rows={2}
                    placeholder="O que você comeu? Ex.: 2 ovos mexidos, 1 pão francês e café"
                    className="w-full resize-none bg-transparent px-2 py-1.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      disabled={analyzing}
                      className="flex items-center gap-2 rounded-xl bg-secondary px-3 h-10 text-sm font-medium text-foreground disabled:opacity-60"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {analyzing ? 'Analisando…' : 'Foto'}
                    </button>
                    <span className="flex-1 text-[11px] text-muted-foreground leading-tight">Escreva ou mande a foto do prato</span>
                    <Button type="button" onClick={addFromText} disabled={!mealText.trim()} className="rounded-xl h-10 px-4 font-semibold">
                      Calcular
                    </Button>
                  </div>
                </div>
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) analyzePhoto(f);
                  }}
                />
                {aiNote && (
                  <p className="text-xs text-foreground bg-secondary rounded-xl px-3 py-2">
                    <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-primary" />
                    {aiNote}
                  </p>
                )}

                {/* alimentos */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-sm font-semibold text-foreground">Alimentos</p>
                    <button onClick={() => setDraft((d) => [...d, newDraft(String(Date.now()))])} className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                  <div className="bg-card rounded-3xl border border-border/30 shadow-sm divide-y divide-border/40">
                    {draft.map((item) => (
                      <FoodRow
                        key={item.id}
                        item={item}
                        onChange={(patch) => setDraft((d) => d.map((x) => (x.id === item.id ? { ...x, ...patch } : x)))}
                        onRemove={draft.length > 1 ? () => setDraft((d) => d.filter((x) => x.id !== item.id)) : undefined}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 px-1">Fotos do prato</p>
                  <PhotoPicker photos={draftPhotos} onChange={setDraftPhotos} />
                </div>
              </div>

              {/* total + salvar */}
              <div className="border-t border-border/40 bg-card/95 backdrop-blur px-4 pt-3 pb-8">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Total da refeição</p>
                    <p className="text-2xl font-bold text-foreground leading-none tabular-nums">
                      {Math.round(draftTotal)} <span className="text-sm font-medium text-muted-foreground">kcal</span>
                    </p>
                  </div>
                  <Button onClick={handleSave} disabled={saving || draft.every((i) => !i.name.trim())} className="flex-1 h-12 rounded-2xl font-semibold">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Check className="w-5 h-5 mr-1.5" /> Salvar</>)}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foto ampliada */}
        <AnimatePresence>
          {viewer && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewer(null)}
              aria-label="Fechar foto"
              className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
            >
              <img src={viewer} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
};

const fmtQty = (q: number) => String(q).replace('.', ',');

/** Uma linha do formulário: nome (com busca), quantidade, kcal por porção e total. */
function FoodRow({ item, onChange, onRemove }: { item: Draft; onChange: (p: Partial<Draft>) => void; onRemove?: () => void }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => (open ? searchFoods(item.name) : []), [open, item.name]);
  const qty = parseFloat(item.quantity.replace(',', '.')) || 0;
  const kcal = parseInt(item.calories) || 0;
  const missing = item.name.trim() !== '' && !item.calories;
  const pick = (f: FoodMatch) => {
    onChange({ name: f.name, unit: f.unit, calories: String(f.kcal), quantity: '1' });
    setOpen(false);
  };
  const step = (by: number) => onChange({ quantity: fmtQty(Math.max(0.5, Math.round((qty + by) * 2) / 2)) });
  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            placeholder="Alimento (ex.: arroz)"
            value={item.name}
            maxLength={60}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => {
              onChange({ name: e.target.value, unit: '' });
              setOpen(true);
            }}
            className="w-full bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {matches.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden" role="listbox">
              {matches.map((f) => (
                <li key={f.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(f)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground truncate">{f.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {f.mine ? 'seu · ' : ''}1 {f.unit}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{f.kcal} kcal</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${missing ? 'text-destructive' : 'text-foreground'}`}>
          {missing ? 'falta kcal' : `${Math.round(kcal * qty)} kcal`}
        </span>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label="Remover alimento" className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center rounded-lg bg-secondary h-8">
          <button type="button" onClick={() => step(-0.5)} aria-label="Menos" className="w-7 h-full flex items-center justify-center text-muted-foreground">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            value={item.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
            inputMode="decimal"
            aria-label="Quantidade"
            className="w-8 text-center bg-transparent text-sm font-semibold text-foreground focus:outline-none"
          />
          <button type="button" onClick={() => step(0.5)} aria-label="Mais" className="w-7 h-full flex items-center justify-center text-muted-foreground">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate">× {item.unit || 'porção'}</span>
        <label className={`flex items-center gap-1 rounded-lg h-8 px-2 ${missing ? 'bg-destructive/10 ring-1 ring-destructive/40' : 'bg-secondary'}`}>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            aria-label="Calorias por porção"
            value={item.calories}
            onChange={(e) => onChange({ calories: e.target.value })}
            className="w-12 text-right bg-transparent text-sm text-foreground focus:outline-none"
          />
          <span className="text-[11px] text-muted-foreground">kcal</span>
        </label>
      </div>
    </div>
  );
}

function PhotoPicker({ photos, onChange }: { photos: Blob[]; onChange: (p: Blob[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const urls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return (
    <div className="flex gap-2 flex-wrap">
      {urls.map((u, i) => (
        <div key={u} className="relative">
          <img src={u} alt="" className="w-20 h-20 rounded-xl object-cover" />
          <button
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            aria-label="Tirar foto"
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {photos.length < 4 && (
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border text-muted-foreground flex flex-col items-center justify-center gap-1 text-[10px]"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : photos.length ? <ImageIcon className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          {busy ? '' : 'Anexar'}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          try {
            onChange([...photos, await shrinkPhoto(f)]);
          } catch {
            toast.error('Não consegui ler essa foto');
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export default Meals;
