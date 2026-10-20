import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Check, Trash2, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Treino aqui é só registro: "treinei hoje" (academia), com observação opcional.
// Cada registro vira uma linha em workout_sessions. Não precisa de foto.

interface Session {
  id: string;
  date: string;
  notes: string | null;
}

const Workouts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const trainedToday = sessions.some((s) => s.date === today);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('id, date, notes')
      .eq('user_id', user.id)
      .gte('date', format(subDays(new Date(), 60), 'yyyy-MM-dd'))
      .order('date', { ascending: false });
    setSessions(data || []);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const markTrained = async () => {
    if (!user || trainedToday) return;
    setSaving(true);
    const { error } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      date: today,
      modality: 'academia',
      notes: notes.trim() || null,
      finished_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error('Não salvou o treino');
    setNotes('');
    toast.success('Treino registrado 💪');
    fetchSessions();
  };

  const remove = async (id: string) => {
    if (!confirm('Apagar este treino?')) return;
    const { error } = await supabase.from('workout_sessions').delete().eq('id', id);
    if (error) return toast.error('Não apagou');
    setSessions((s) => s.filter((x) => x.id !== id));
  };

  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const thisWeek = new Set(sessions.filter((s) => s.date >= weekAgo).map((s) => s.date)).size;
  const last30 = new Set(sessions.filter((s) => s.date >= format(subDays(new Date(), 29), 'yyyy-MM-dd')).map((s) => s.date)).size;

  return (
    <AppLayout activeNav="home" showNav>
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader
          title="Treinos"
          subtitle="Marque os dias que você foi pra academia"
          backTo="/dashboard"
          icon={<Dumbbell className="w-5 h-5 text-primary" />}
        />

        <div className="px-4 sm:px-6 lg:px-8 space-y-5 mt-4">
          {/* Hoje */}
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border p-5 ${trainedToday ? 'bg-primary/10 border-primary/20' : 'bg-card border-border'}`}>
            <p className="text-xs text-muted-foreground first-letter:uppercase">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            {trainedToday ? (
              <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg font-semibold text-foreground">Treinou hoje ✅</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold text-foreground mt-1">Treinou hoje?</p>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={80}
                  placeholder="O que treinou (opcional) — ex.: peito e tríceps"
                  className="w-full mt-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                />
                <Button onClick={markTrained} disabled={saving} className="w-full mt-3 rounded-xl h-12 text-base font-semibold">
                  <Dumbbell className="w-5 h-5 mr-2" /> Treinei hoje
                </Button>
              </>
            )}
          </motion.div>

          {/* Contagem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-2xl font-bold text-foreground">{thisWeek}</p>
              <p className="text-[11px] text-muted-foreground">dias nos últimos 7</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-2xl font-bold text-foreground">{last30}</p>
              <p className="text-[11px] text-muted-foreground">dias nos últimos 30</p>
            </div>
          </div>

          {/* Histórico */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Histórico</h3>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum treino registrado ainda.</p>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground first-letter:uppercase">
                        {format(parseISO(s.date), "EEE, dd/MM", { locale: ptBR })}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground truncate">{s.notes}</p>}
                    </div>
                    <button onClick={() => remove(s.id)} aria-label="Apagar treino"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Workouts;
