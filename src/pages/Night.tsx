import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Moon, Sunrise, Trash2 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { fmtHours, sleepHours } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Sono: opcional, NÃO é regra e não vale ponto (tem quem tenha insônia).
// Marca a hora que deitou e a que acordou; o dia é o dia em que acordou.

const LAST_KEY = 'desafio:sono-ultimo';
const longDay = (d: string) => format(parseISO(d), 'EEE, dd/MM', { locale: ptBR });

function lastTimes(): { bed: string; wake: string } {
  try {
    return { bed: '23:00', wake: '07:00', ...JSON.parse(localStorage.getItem(LAST_KEY) || '{}') };
  } catch {
    return { bed: '23:00', wake: '07:00' };
  }
}

const Night = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const [bed, setBed] = useState(() => lastTimes().bed);
  const [wake, setWake] = useState(() => lastTimes().wake);
  const [date, setDate] = useState(d.today);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const hours = bed && wake ? sleepHours(bed, wake) : 0;
  const nights = d.sleep.filter((s) => !s.nap);
  const existing = nights.find((s) => s.date === date);

  const avg7 = useMemo(() => {
    const since = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const vals = nights.filter((s) => s.date > since).map((s) => s.hours);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [nights]);

  const save = () => {
    if (date > d.today) return toast.error('Escolha hoje ou um dia que já passou');
    if (!hours) return toast.error('Confira os horários');
    d.addSleep({ date, bed, wake, hours });
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({ bed, wake }));
    } catch {
      /* só a sugestão de horário */
    }
    toast.success(`${fmtHours(hours)} de sono anotadas`);
  };

  return (
    <AppLayout activeNav="home">
      <div className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Sono" subtitle="Opcional · não vale ponto" backTo="/dashboard" icon={<Moon className="w-5 h-5 text-violet-500" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-5 mt-6 max-w-2xl mx-auto">
          <section className="relative overflow-hidden bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Como foi a noite</h3>
                  <p className="text-xs text-muted-foreground">Só para acompanhar, do jeito que der</p>
                </div>
                {avg7 !== null && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground leading-none">{fmtHours(avg7)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">média 7 dias</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <label className="rounded-2xl bg-secondary/70 p-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BedDouble className="w-3.5 h-3.5" /> Deitou
                  </span>
                  <input
                    type="time"
                    value={bed}
                    onChange={(e) => setBed(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-foreground mt-1 focus:outline-none"
                  />
                </label>
                <label className="rounded-2xl bg-secondary/70 p-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sunrise className="w-3.5 h-3.5" /> Acordou
                  </span>
                  <input
                    type="time"
                    value={wake}
                    onChange={(e) => setWake(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-foreground mt-1 focus:outline-none"
                  />
                </label>
              </div>

              <p className="text-center mt-4">
                <span className="text-4xl font-bold text-foreground tabular-nums">{hours ? fmtHours(hours) : '–'}</span>
                <span className="block text-xs text-muted-foreground mt-1">de sono</span>
              </p>

              <label className="flex items-center justify-between mt-4 text-sm">
                <span className="text-muted-foreground">Acordou no dia</span>
                <input
                  type="date"
                  value={date}
                  max={d.today}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="bg-secondary rounded-xl px-3 h-10 text-foreground"
                />
              </label>

              <Button className="w-full h-12 rounded-2xl font-semibold mt-4 bg-violet-500 hover:bg-violet-600 text-white" onClick={save}>
                {existing ? 'Atualizar' : 'Anotar'}
              </Button>
            </div>
          </section>

          {nights.length > 0 && (
            <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">Últimas noites</h3>
              <div className="divide-y divide-border">
                {nights.slice(0, 14).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <Moon className="w-4 h-4 text-violet-500" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground first-letter:uppercase">{longDay(s.date)}</p>
                      {s.bed && s.wake && (
                        <p className="text-xs text-muted-foreground">
                          {s.bed} → {s.wake}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{fmtHours(s.hours)}</span>
                    <button onClick={() => d.removeSleep(s.id)} className="text-muted-foreground p-1" aria-label="Apagar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Night;
