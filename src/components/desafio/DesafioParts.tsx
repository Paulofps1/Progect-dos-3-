import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  PLAYERS,
  isPerfect,
  isSunday,
  monthDays,
  shiftMonth,
  type DayRecord,
  type Player,
} from '@/lib/desafio/rules';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** "Quem é você no desafio?" — aparece só se o nome do perfil não bater com um dos participantes. */
export function PlayerPicker({ onPick }: { onPick: (p: Player) => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Quem é você no desafio?</p>
      <p className="text-[11px] text-muted-foreground">Escolha uma vez; fica salvo neste aparelho.</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {PLAYERS.map((p) => (
          <button key={p} onClick={() => onPick(p)} className="rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Calendário com ponto verde nos dias perfeitos. */
export function MonthCalendar({
  month,
  setMonth,
  selected,
  onSelect,
  today,
  record,
}: {
  month: string;
  setMonth: (m: string) => void;
  selected: string;
  onSelect: (d: string) => void;
  today: string;
  record: (d: string) => DayRecord;
}) {
  const days = monthDays(month);
  const lead = parseISO(days[0]).getDay();
  return (
    <div>
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
        {days.map((d) => (
          <button
            key={d}
            disabled={d > today}
            onClick={() => onSelect(d)}
            className={`relative rounded-xl py-2 text-sm tabular-nums disabled:opacity-30 ${
              d === selected ? 'bg-primary text-primary-foreground font-bold' : d === today ? 'ring-1 ring-border' : ''
            }`}
          >
            {+d.slice(8)}
            {isPerfect(record(d)) && <span className="absolute bottom-1 left-1/2 -ml-[3px] w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-card" />}
          </button>
        ))}
      </div>
    </div>
  );
}
