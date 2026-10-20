import { useState } from 'react';
import { Pencil, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { useDesafio } from '@/hooks/useDesafio';
import { INITIAL_WEIGHTS, num } from '@/lib/desafio/rules';

// Corpo no Perfil: peso atual, meta de peso (quanto falta) e calculadora de IMC.
// IMC = peso ÷ altura². Só informação: não entra na pontuação.

const BANDS = [
  { max: 18.5, label: 'Abaixo do peso', color: 'bg-sky-500', text: 'text-sky-600', chip: 'bg-sky-500/15' },
  { max: 25, label: 'Saudável', color: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-500/15' },
  { max: 30, label: 'Sobrepeso', color: 'bg-amber-400', text: 'text-amber-600', chip: 'bg-amber-500/15' },
  { max: Infinity, label: 'Obesidade', color: 'bg-rose-500', text: 'text-rose-600', chip: 'bg-rose-500/15' },
];
const bandOf = (imc: number) => BANDS.find((b) => imc < b.max)!;
// posição na barra: 15 a 40 de IMC ocupam a barra inteira
const pos = (imc: number) => `${Math.min(100, Math.max(0, ((imc - 15) / 25) * 100))}%`;
const parse = (v: string) => parseFloat(v.replace(',', '.'));

export function BodyCard({ d }: { d: ReturnType<typeof useDesafio> }) {
  const p = d.profileData;
  const [editing, setEditing] = useState(!p.heightCm);
  const [height, setHeight] = useState(p.heightCm ? String(p.heightCm) : '');
  const [goal, setGoal] = useState(p.goalKg ? String(p.goalKg).replace('.', ',') : '');

  const first = d.player ? INITIAL_WEIGHTS[d.player] : null;
  const sorted = [...d.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const current = sorted.length ? sorted[sorted.length - 1].kg : first;
  const m = (p.heightCm ?? 0) / 100;
  const imc = current && m ? current / (m * m) : null;
  const imcGoal = p.goalKg && m ? p.goalKg / (m * m) : null;
  const toLose = current && p.goalKg ? Math.max(0, current - p.goalKg) : null;
  const goalPct = first && current && p.goalKg && first > p.goalKg ? Math.min(100, Math.max(0, ((first - current) / (first - p.goalKg)) * 100)) : null;

  const save = () => {
    const h = parse(height);
    const g = parse(goal);
    d.saveProfileData({
      heightCm: h >= 100 && h <= 230 ? Math.round(h) : undefined,
      goalKg: g >= 30 && g <= 250 ? Math.round(g * 10) / 10 : undefined,
    });
    setEditing(false);
  };

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Corpo</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Altura e meta
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-secondary/70 p-3">
              <span className="text-xs text-muted-foreground">Altura (cm)</span>
              <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" placeholder="175" className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none" />
            </label>
            <label className="rounded-2xl bg-secondary/70 p-3">
              <span className="text-xs text-muted-foreground">Meta de peso (kg)</span>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="decimal" placeholder="75" className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none" />
            </label>
          </div>
          <Button onClick={save} className="w-full h-11 rounded-2xl font-semibold">
            Salvar
          </Button>
        </div>
      ) : (
        <>
          {/* peso e meta */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Peso atual</p>
              <p className="text-2xl font-bold text-foreground">{current ? `${num(current)} kg` : '–'}</p>
              {first && <p className="text-[11px] text-muted-foreground">começou com {num(first)} kg</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Meta
              </p>
              <p className="text-2xl font-bold text-foreground">{goalPct !== null ? `${Math.round(goalPct)}%` : '–'}</p>
              <p className="text-[11px] text-muted-foreground">
                {p.goalKg ? (toLose ? `faltam ${num(toLose)} kg para ${num(p.goalKg)}` : `chegou nos ${num(p.goalKg)} kg 🎉`) : 'defina sua meta'}
              </p>
            </div>
          </div>
          {goalPct !== null && (
            <div className="h-2 rounded-full bg-secondary overflow-hidden mt-3">
              <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct}%` }} />
            </div>
          )}

          {/* IMC */}
          {imc ? (
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">Seu IMC</p>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-bold text-foreground tabular-nums">{num(imc)}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${bandOf(imc).chip} ${bandOf(imc).text}`}>{bandOf(imc).label}</span>
              </div>
              <div className="relative mt-4">
                <div className="flex gap-1 h-3">
                  {BANDS.map((b, i) => (
                    <span key={b.label} className={`flex-1 ${b.color} ${i === 0 ? 'rounded-l-full' : ''} ${i === BANDS.length - 1 ? 'rounded-r-full' : ''}`} />
                  ))}
                </div>
                <span className="absolute -top-1 w-1 h-5 rounded-full bg-foreground" style={{ left: pos(imc) }} aria-label="Você" />
                {imcGoal && <span className="absolute -top-1 h-5 border-l-2 border-dotted border-orange-500" style={{ left: pos(imcGoal) }} aria-label="Meta" />}
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-muted-foreground">
                <span>&lt;18,5</span>
                <span>18,5–24,9</span>
                <span>25–29,9</span>
                <span>≥30</span>
              </div>
              {imcGoal && (
                <p className="text-xs text-muted-foreground mt-3 rounded-xl bg-secondary/60 px-3 py-2 flex justify-between">
                  <span>IMC na meta</span>
                  <span className="font-semibold text-foreground">
                    {num(imcGoal)} · {bandOf(imcGoal).label}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-4">Coloque sua altura para ver o IMC.</p>
          )}
        </>
      )}
    </section>
  );
}
