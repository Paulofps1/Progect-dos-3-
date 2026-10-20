import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Images } from 'lucide-react';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { BodyPhotos } from '@/components/desafio/BodyPhotos';
import { useAuth } from '@/hooks/useAuth';

// Evolução em fotos do corpo (aberta pelo Perfil).
const Evolution = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  return (
    <AppLayout activeNav="profile">
      <div className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Evolução em fotos" subtitle="Seu antes e depois · só você vê" backTo="/profile" icon={<Images className="w-5 h-5 text-primary" />} />
        <div className="px-4 sm:px-6 lg:px-8 mt-6 max-w-2xl mx-auto">{user && <BodyPhotos userId={user.id} />}</div>
      </div>
    </AppLayout>
  );
};

export default Evolution;
