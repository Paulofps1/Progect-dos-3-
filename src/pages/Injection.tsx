import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronLeft, ChevronRight, Clock, MapPin, Syringe, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { INJECTION_SITES, daysBetween, monthDays, shiftMonth } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Injeção: só registro, como uma carteira de vacinação. O app não sugere dose,
// intervalo nem a próxima data; a próxima é a pessoa quem marca, se quiser.

const longDay = (d: string) => format(parseISO(d), "EEE, dd 'de' MMM", { locale: ptBR });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const mlLabel = (v: number) => `${String(v).replace('.', ',')} ml`;

const Injection = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const [date, setDate] = useState(d.today);
  const [site, setSite] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [ml, setMl] = useState('');
  const [month, setMonth] = useState(d.today.slice(0, 7));
  const [editNext, setEditNext] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const past = d.injections.filter((i) => i.date <= d.today);
  const last = past[0];
  const since = last ? daysBetween(last.date, d.today) : null;
  const next = d.nextInjection && d.nextInjection >= d.today ? d.nextInjection : null;
  const untilNext = next ? daysBetween(d.today, next) : null;
  const byDate = new Map(d.injections.map((i) => [i.date, i]));
  const already = byDate.get(date);
  const lastMl = d.injections.find((i) => i.ml)?.ml;
  const mlNum = parseFloat(ml.replace(',', '.'));

  const register = () => {
    if (date > d.today) return toast.error('Escolha hoje ou um dia que já passou');
    if (ml.trim() && !(mlNum > 0 && mlNum <= 10)) return toast.error('Quantidade inválida: use ml, por exemplo 0,5');
    d.addInjection({ date, ml: ml.trim() ? Math.round(mlNum * 100) / 100 : undefined, site: site ?? undefined, note: note.trim() || undefined });
    if (next && next <= date) d.setNextInjection(null);
    setNote('');
    toast.success(date === d.today ? 'Aplicação de hoje registrada' : `Aplicação de ${format(parseISO(date), 'dd/MM')} registrada`);
  };

  const days = monthDays(month);
  const lead = parseISO(days[0]).getDay();

  return (
    <AppLayout activeNav="home">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Injeção" subtitle="Registro das suas aplicações" backTo="/dashboard" icon={<Syringe className="w-5 h-5 text-indigo-500" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-5 mt-6 max-w-2xl mx-auto">
          {/* Destaque: há quantos dias */}
          <div className="relative overflow-hidden bg-card rounded-3xl p-6 border border-border/30 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-primary/5 pointer-events-none" />
            <div className="relative flex items-center gap-5">
              <div className="w-28 h-28 rounded-full border-[10px] border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0">
                {since == null ? (
                  <Syringe className="w-8 h-8 text-indigo-500" />
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground leading-none tabular-nums">{since}</span>
                    <span className="text-[11px] text-muted-foreground mt-1">{since === 1 ? 'dia' : 'dias'}</span>
                  </>
                )}
              </div>
              <div className="min-w-0">
                {last ? (
                  <>
                    <p className="text-xs text-muted-foreground">Última aplicação</p>
                    <p className="text-lg font-semibold text-foreground first-letter:uppercase">{since === 0 ? 'Hoje' : longDay(last.date)}</p>
                    {(last.ml || last.site) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {last.ml ? <b className="text-foreground">{mlLabel(last.ml)}</b> : null}
                        {last.ml && last.site ? ' · ' : ''}
                        {last.site && (
                          <>
                            <MapPin className="inline w-3 h-3 -mt-0.5" /> {last.site}
                          </>
                        )}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-foreground">Nenhuma aplicação ainda</p>
                    <p className="text-xs text-muted-foreground">Registre a primeira abaixo</p>
                  </>
                )}
              </div>
            </div>

            {/* próxima, marcada pela pessoa */}
            <div className="relative mt-5">
              {editNext ? (
                <div className="flex gap-2">
                  <input
                    id="proxima"
                    type="date"
                    min={d.today}
                    defaultValue={next ?? ''}
                    onChange={(e) => e.target.value && (d.setNextInjection(e.target.value), setEditNext(false))}
                    className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <button onClick={() => setEditNext(false)} aria-label="Cancelar" className="w-11 rounded-xl bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : next ? (
                <div className="flex items-center gap-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                  <CalendarClock className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground first-letter:uppercase">Próxima: {longDay(next)}</p>
                    <p className="text-xs text-muted-foreground">{untilNext === 0 ? 'É hoje' : `Em ${plural(untilNext!, 'dia', 'dias')}`}</p>
                  </div>
                  <button onClick={() => setEditNext(true)} className="text-xs font-semibold text-indigo-500">Mudar</button>
                  <button onClick={() => d.setNextInjection(null)} aria-label="Tirar data marcada" className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditNext(true)} className="w-full rounded-2xl border border-dashed border-border p-3 flex items-center gap-3 text-left">
                  <CalendarClock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Marcar a data da próxima aplicação (opcional)</span>
                </button>
              )}
            </div>
          </div>

          {/* Registrar */}
          <div className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Registrar aplicação</h3>
              <input
                id="data-aplicacao"
                type="date"
                max={d.today}
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                aria-label="Data da aplicação"
              />
            </div>
            <div>
              <label htmlFor="ml-aplicacao" className="text-xs text-muted-foreground">Quantidade aplicada</label>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <input
                    id="ml-aplicacao"
                    value={ml}
                    onChange={(e) => setMl(e.target.value)}
                    inputMode="decimal"
                    placeholder={lastMl ? `Ex.: ${mlLabel(lastMl).replace(' ml', '')}` : 'Ex.: 0,5'}
                    className="w-full rounded-xl border border-border bg-background pl-3 pr-10 py-2.5 text-sm tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ml</span>
                </div>
                {lastMl && ml !== String(lastMl).replace('.', ',') && (
                  <button onClick={() => setMl(String(lastMl).replace('.', ','))} className="rounded-xl bg-secondary px-3 py-2.5 text-xs font-medium text-foreground whitespace-nowrap">
                    Igual à última ({mlLabel(lastMl)})
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Local (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {INJECTION_SITES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSite(site === s ? null : s)}
                    aria-pressed={site === s}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      site === s ? 'bg-indigo-500 text-white border-indigo-500' : 'border-border text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {last?.site && <p className="text-[11px] text-muted-foreground mt-2">Última foi em: {last.site}</p>}
            </div>
            <input
              id="obs-aplicacao"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder="Observação (opcional)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
            <Button onClick={register} className="w-full h-12 rounded-2xl font-semibold bg-indigo-500 hover:bg-indigo-500/90 text-white">
              <Syringe className="w-5 h-5 mr-2" />
              {already ? 'Atualizar este registro' : date === d.today ? 'Apliquei hoje' : `Apliquei em ${format(parseISO(date), 'dd/MM')}`}
            </Button>
          </div>

          {/* Carteira (calendário) */}
          <div className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground first-letter:uppercase">{format(parseISO(days[0]), "MMMM 'de' yyyy", { locale: ptBR })}</p>
              <div className="flex gap-1">
                <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-3 text-center">
              {'DSTQQSS'.split('').map((c, i) => (
                <span key={i} className="text-[10px] text-muted-foreground">{c}</span>
              ))}
              {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
              {days.map((day) => {
                const inj = byDate.has(day);
                const isNext = day === next;
                const sel = day === date;
                return (
                  <button
                    key={day}
                    disabled={day > d.today && !isNext}
                    onClick={() => day <= d.today && setDate(day)}
                    aria-label={`${format(parseISO(day), 'dd/MM')}${inj ? ', aplicação registrada' : ''}${isNext ? ', próxima marcada' : ''}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm tabular-nums disabled:opacity-30 ${
                      inj ? 'bg-indigo-500 text-white font-semibold' : isNext ? 'border-2 border-dashed border-indigo-500 text-indigo-500 font-semibold' : sel ? 'bg-secondary font-semibold' : ''
                    } ${sel ? 'ring-2 ring-foreground/30' : ''}`}
                  >
                    {+day.slice(8)}
                    {inj && <Syringe className="w-2.5 h-2.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" /> Aplicada</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-indigo-500" /> Marcada por você</span>
            </div>
          </div>

          {/* Histórico */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Aplicações</span>
              </div>
              <span className="text-xs text-muted-foreground">{plural(past.length, 'registro', 'registros')}</span>
            </div>
            <div className="bg-card rounded-2xl border border-border/30 shadow-sm overflow-hidden">
              {past.length === 0 ? (
                <div className="p-8 text-center">
                  <Syringe className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma aplicação registrada</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {past.map((i, n) => {
                    const gap = past[n + 1] ? daysBetween(past[n + 1].date, i.date) : null;
                    return (
                      <div key={i.date} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Syringe className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground first-letter:uppercase">{longDay(i.date)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[i.ml ? mlLabel(i.ml) : null, i.site, i.note, gap != null ? `${plural(gap, 'dia', 'dias')} depois da anterior` : null].filter(Boolean).join(' · ') || 'Sem detalhes'}
                          </p>
                        </div>
                        <button
                          onClick={() => confirm(`Apagar a aplicação de ${format(parseISO(i.date), 'dd/MM')}?`) && d.removeInjection(i.date)}
                          aria-label="Apagar aplicação"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center px-4">
            O app só registra. Dose, intervalo e local são orientados pelo seu médico.
          </p>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Injection;
