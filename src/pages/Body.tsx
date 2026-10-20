import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { BodyCard } from '@/components/desafio/BodyCard';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';

// IMC e meta de peso (aberto pelo Perfil, para não ocupar espaço no resto do app).
const Body = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  return (
    <AppLayout activeNav="profile">
      <div className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="IMC e meta" subtitle="Seu peso, altura e onde quer chegar" backTo="/profile" icon={<Scale className="w-5 h-5 text-primary" />} />
        <div className="px-4 sm:px-6 lg:px-8 mt-6 max-w-2xl mx-auto">{d.loading ? null : <BodyCard d={d} />}</div>
      </div>
    </AppLayout>
  );
};

export default Body;
