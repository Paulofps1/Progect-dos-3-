import { useState } from 'react';
import { Calculator, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { useDesafio } from '@/hooks/useDesafio';
import { INITIAL_WEIGHTS, num } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Calculadora de IMC e meta de peso (página Corpo, aberta pelo Perfil).
// IMC = peso ÷ (altura × altura), com a altura em metros. Altura e meta ficam no
// perfil do desafio (banco); o peso digitado vira a pesagem de hoje.
// Só informação: não entra na pontuação.

const BANDS = [
  { max: 18.5, label: 'Abaixo do peso', color: 'bg-sky-500', text: 'text-sky-600', chip: 'bg-sky-500/15' },
  { max: 25, label: 'Saudável', color: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-500/15' },
  { max: 30, label: 'Sobrepeso', color: 'bg-amber-400', text: 'text-amber-600', chip: 'bg-amber-500/15' },
  { max: 35, label: 'Obesidade grau 1', color: 'bg-orange-500', text: 'text-orange-600', chip: 'bg-orange-500/15' },
  { max: 40, label: 'Obesidade grau 2', color: 'bg-rose-500', text: 'text-rose-600', chip: 'bg-rose-500/15' },
  { max: Infinity, label: 'Obesidade grau 3', color: 'bg-red-700', text: 'text-red-700', chip: 'bg-red-700/15' },
];
const bandOf = (imc: number) => BANDS.find((b) => imc < b.max)!;
// posição na barra: IMC de 15 a 45 ocupa a barra inteira
const pos = (imc: number) => `${Math.min(100, Math.max(0, ((imc - 15) / 30) * 100))}%`;
const parse = (v: string) => parseFloat(v.replace(',', '.'));
const fmtIn = (n?: number | null) => (n ? String(n).replace('.', ',') : '');

export function BodyCard({ d }: { d: ReturnType<typeof useDesafio> }) {
  const p = d.profileData;
  const first = d.player ? INITIAL_WEIGHTS[d.player] : null;
  const sorted = [...d.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const current = sorted.length ? sorted[sorted.length - 1].kg : first;

  const [weight, setWeight] = useState(fmtIn(current));
  const [height, setHeight] = useState(fmtIn(p.heightCm));
  const [goal, setGoal] = useState(fmtIn(p.goalKg));

  const m = (p.heightCm ?? 0) / 100;
  const imc = current && m ? current / (m * m) : null;
  const imcGoal = p.goalKg && m ? p.goalKg / (m * m) : null;
  const healthy = m ? [18.5 * m * m, 24.9 * m * m] : null;
  const toLose = current && p.goalKg ? Math.max(0, current - p.goalKg) : null;
  const goalPct = first && current && p.goalKg && first > p.goalKg ? Math.min(100, Math.max(0, ((first - current) / (first - p.goalKg)) * 100)) : null;

  const calc = () => {
    const kg = parse(weight);
    const cm = parse(height);
    if (!(cm >= 120 && cm <= 230)) return toast.error('Altura em centímetros, ex.: 178');
    if (!(kg >= 35 && kg <= 300)) return toast.error('Peso em kg, ex.: 94,4');
    d.saveProfileData({ heightCm: Math.round(cm) });
    const kgRounded = Math.round(kg * 10) / 10;
    if (kgRounded !== current) d.saveWeight(kgRounded); // vira a pesagem de hoje
    toast.success('IMC calculado e salvo');
  };

  const saveGoal = () => {
    const g = parse(goal);
    if (!g) return d.saveProfileData({ goalKg: undefined });
    if (!(g >= 35 && g <= 250)) return toast.error('Meta em kg, ex.: 80');
    if (current && g >= current) return toast.error(`A meta tem que ser menor que o seu peso atual (${num(current)} kg)`);
    d.saveProfileData({ goalKg: Math.round(g * 10) / 10 });
    toast.success('Meta salva');
  };

  return (
    <div className="space-y-4">
      {/* Calculadora */}
      <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Calculadora de IMC
        </h3>
        <p className="text-xs text-muted-foreground">Peso ÷ (altura × altura). Fica salvo; o peso vira a pesagem de hoje.</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="rounded-2xl bg-secondary/70 p-3">
            <span className="text-xs text-muted-foreground">Peso (kg)</span>
            <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="94,4" className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none" />
          </label>
          <label className="rounded-2xl bg-secondary/70 p-3">
            <span className="text-xs text-muted-foreground">Altura (cm)</span>
            <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" placeholder="178" className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none" />
          </label>
        </div>
        <Button onClick={calc} className="w-full h-12 rounded-2xl font-semibold mt-3">
          Calcular e salvar
        </Button>

        {imc && current && (
          <div className="mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-foreground tabular-nums">{num(imc)}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${bandOf(imc).chip} ${bandOf(imc).text}`}>{bandOf(imc).label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {num(current)} ÷ ({num(m, 2)} × {num(m, 2)}) = {num(imc)}
            </p>

            <div className="relative mt-5">
              <div className="flex gap-0.5 h-3">
                {BANDS.map((b, i) => (
                  <span key={b.label} className={`flex-1 ${b.color} ${i === 0 ? 'rounded-l-full' : ''} ${i === BANDS.length - 1 ? 'rounded-r-full' : ''}`} />
                ))}
              </div>
              <span className="absolute -top-1.5 w-1.5 h-6 -ml-[3px] rounded-full bg-foreground ring-2 ring-card" style={{ left: pos(imc) }} aria-label="Você" />
              {imcGoal && <span className="absolute -top-1.5 h-6 border-l-2 border-dotted border-foreground/60" style={{ left: pos(imcGoal) }} aria-label="Meta" />}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground tabular-nums">
              <span>15</span>
              <span>18,5</span>
              <span>25</span>
              <span>30</span>
              <span>35</span>
              <span>40</span>
              <span>45</span>
            </div>

            {healthy && (
              <p className="text-xs text-muted-foreground mt-3 rounded-xl bg-secondary/60 px-3 py-2 flex justify-between gap-3">
                <span>Faixa saudável para {num(m, 2)} m</span>
                <span className="font-semibold text-foreground whitespace-nowrap">
                  {num(Math.round(healthy[0] * 10) / 10)} a {num(Math.round(healthy[1] * 10) / 10)} kg
                </span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Meta de peso */}
      <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Meta de peso
        </h3>
        <div className="flex gap-2 mt-3">
          <label className="flex-1 rounded-2xl bg-secondary/70 px-3 py-2">
            <span className="text-xs text-muted-foreground">Quero chegar em (kg)</span>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="decimal" placeholder="80" className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none" />
          </label>
          <Button onClick={saveGoal} variant="secondary" className="h-auto rounded-2xl px-5 font-semibold">
            Salvar
          </Button>
        </div>

        {p.goalKg && current && first && (
          <>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {[
                ['Começou', `${num(first)} kg`],
                ['Agora', `${num(current)} kg`],
                ['Meta', `${num(p.goalKg)} kg`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-secondary/50 py-2">
                  <p className="text-[11px] text-muted-foreground">{l}</p>
                  <p className="text-sm font-bold text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden mt-4">
              <div className="h-full rounded-full bg-primary" style={{ width: `${goalPct ?? 0}%` }} />
            </div>
            <p className="text-sm text-foreground mt-2">
              {toLose ? (
                <>
                  <b>{Math.round(goalPct ?? 0)}%</b> do caminho · faltam <b>{num(toLose)} kg</b>
                </>
              ) : (
                'Chegou na meta! 🎉'
              )}
            </p>
            {imcGoal && (
              <p className="text-xs text-muted-foreground mt-1">
                Na meta, seu IMC fica {num(imcGoal)} · {bandOf(imcGoal).label}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
