import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, DownloadCloud, Loader2 } from 'lucide-react';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { migrateFromOld, type MigrateResult } from '@/lib/desafio/migrateOld';

// Trazer do app antigo: refeições com fotos e evolução do corpo (Perfil → Configurações).
const Migrate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<string | null>(null);
  const [result, setResult] = useState<MigrateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const run = async () => {
    if (!user?.email) return;
    setError(null);
    setResult(null);
    try {
      setResult(await migrateFromOld(user.email, user.id, setStep));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado');
    } finally {
      setStep(null);
    }
  };

  return (
    <AppLayout activeNav="profile">
      <div className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Trazer do app antigo" subtitle="Refeições com fotos e evolução do corpo" backTo="/profile" icon={<DownloadCloud className="w-5 h-5 text-primary" />} />
        <div className="px-4 sm:px-6 lg:px-8 mt-6 max-w-2xl mx-auto">
          <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm space-y-4">
            <p className="text-sm text-foreground">
              Copia para cá as <b>refeições com fotos</b> e as <b>fotos de evolução</b> que você registrou no app antigo. O checklist, a água, os
              treinos, a injeção e o sono já vieram.
            </p>
            <p className="text-xs text-muted-foreground">Pode tocar de novo depois: o que já veio não é copiado duas vezes.</p>

            <Button onClick={run} disabled={!!step} className="w-full h-12 rounded-2xl font-semibold">
              {step ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {step}
                </>
              ) : (
                'Trazer agora'
              )}
            </Button>

            {result && (
              <div className="rounded-2xl bg-primary/10 p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold">Pronto!</p>
                  <p>
                    {result.meals} {result.meals === 1 ? 'refeição' : 'refeições'} com {result.photos} {result.photos === 1 ? 'foto' : 'fotos'}
                    {result.body ? ` e ${result.body} ${result.body === 1 ? 'foto' : 'fotos'} de evolução` : ''}.
                  </p>
                  {result.skipped > 0 && <p className="text-xs text-muted-foreground">{result.skipped} já tinham vindo antes.</p>}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Migrate;
