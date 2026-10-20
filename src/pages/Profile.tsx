import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { InstallSheet, isInstalled } from '@/components/desafio/InstallApp';
import { num } from '@/lib/desafio/rules';
import AppLayout from '@/components/app/AppLayout';
import { AvatarCropper, saveAvatar } from '@/components/desafio/AvatarCropper';
import SectionHeader from '@/components/app/SectionHeader';
import { ChevronRight, LogOut, User, History, Camera, ImagePlus, Flame, Loader2, Trophy, Scale, Images, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const desafio = useDesafio();
  const [installOpen, setInstallOpen] = useState(false);
  const navigate = useNavigate();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu da conta');
    navigate('/auth');
  };


  const [cropFile, setCropFile] = useState<File | null>(null);

  // escolheu a foto: abre o ajuste (posição e zoom) antes de salvar
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Escolha uma imagem');
      return;
    }
    setShowPhotoOptions(false);
    setCropFile(file);
  };

  const handleCropped = async (dataUrl: string) => {
    if (!user) return;
    setCropFile(null);
    // a foto fica no perfil do desafio (banco), que é o que as telas mostram;
    // o perfil antigo do app é só tentativa extra (não salvava)
    desafio.saveProfileData({ avatar: dataUrl });
    saveAvatar(user.id, dataUrl, profile?.full_name).then(() => refreshProfile()).catch(() => undefined);
    toast.success('Foto atualizada!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const menuItems = [
    { icon: Scale, label: 'IMC e meta de peso', action: () => navigate('/corpo'), desc: 'Calculadora de IMC e quanto falta' },
    { icon: Images, label: 'Evolução em fotos', action: () => navigate('/evolucao'), desc: 'Seu antes e depois' },
    { icon: History, label: 'Meu histórico', action: () => navigate('/historico'), desc: 'Seus dias, refeições, água, treinos e injeções' },
    { icon: User, label: 'Editar perfil', action: () => navigate('/edit-profile'), desc: 'Nome e foto' },
    ...(isInstalled() ? [] : [{ icon: Download, label: 'Instalar o app', action: () => setInstallOpen(true), desc: 'Na tela de início, como app nativo' }]),
  ];

  return (
    <AppLayout activeNav="profile">
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onSaved={handleCropped} />}
      <motion.div 
        initial={false}
        animate={{ opacity: 1 }}
        className="min-h-screen pb-28 lg:pb-8"
      >
        <SectionHeader title="Perfil" subtitle="Gerencie sua conta" />

        <div className="px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Profile Card */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-6"
          >
            <div className="flex items-center gap-5">
              {/* Avatar with edit button */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPhotoOptions(true)}
                  disabled={uploadingImage}
                  className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20 border-2 border-primary/20"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                  ) : (desafio.profileData.avatar || profile?.avatar_url) ? (
                    <img src={desafio.profileData.avatar || profile?.avatar_url || ''} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground text-3xl font-bold">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </motion.button>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-card rounded-full flex items-center justify-center shadow-lg border border-border/50">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-xl text-foreground truncate">
                  {profile?.full_name || 'Usuário'}
                </h2>
                <p className="text-muted-foreground text-sm truncate">No desafio · 19/10 a 20/12</p>
              </div>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="glass-card motion-card rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-warning streak-flame" />
              </div>
              <p className="text-2xl font-bold text-foreground">{desafio.myStats?.run ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dias perfeitos seguidos</p>
            </div>
            <div className="glass-card motion-card rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-info" />
              </div>
              <p className="text-2xl font-bold text-foreground">{desafio.myStats ? num(desafio.myStats.pts) : 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pontos no desafio</p>
            </div>
          </motion.div>


          {/* Menu Items */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card motion-card rounded-2xl overflow-hidden"
          >
            {menuItems.map((menuItem, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.98 }}
                onClick={menuItem.action}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/30"
              >
                <div className="w-10 h-10 bg-secondary/50 rounded-xl flex items-center justify-center">
                  <menuItem.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-foreground">{menuItem.label}</span>
                  <p className="text-xs text-muted-foreground">{menuItem.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
              </motion.button>
            ))}
          </motion.div>

          {/* Account Actions */}
          <motion.div 
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="w-full glass-card rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors hover:bg-secondary/30"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-orange-500" />
              </div>
              <span className="flex-1 text-left text-foreground font-medium">Sair da conta</span>
            </motion.button>

          </motion.div>

          {/* Version */}
          <motion.p 
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground text-xs pt-2 pb-4"
          >
            Desafio dos 4 · 19/10 a 20/12
          </motion.p>
        </div>

        {/* Photo Options Modal */}
        <AnimatePresence>
          {showPhotoOptions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-md flex items-end justify-center z-50" 
              onClick={() => setShowPhotoOptions(false)}
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="bg-card/95 backdrop-blur-xl rounded-t-[2rem] w-full max-w-lg p-6 pb-10 border-t border-border/30 shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-border/50 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-foreground text-center mb-6">Alterar foto de perfil</h3>
                <div className="space-y-3">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => cameraInputRef.current?.click()} 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                    Tirar Foto
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => galleryInputRef.current?.click()} 
                    className="w-full bg-secondary text-foreground rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold"
                  >
                    <ImagePlus className="w-5 h-5" />
                    Escolher da Galeria
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPhotoOptions(false)} 
                    className="w-full text-muted-foreground py-3 font-medium"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Account Dialog */}
      </motion.div>
      <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
    </AppLayout>
  );
};

export default Profile;