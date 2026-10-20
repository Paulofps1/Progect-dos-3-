import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Camera, User, Loader2, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/app/AppLayout';
import { AvatarCropper, saveAvatar } from '@/components/desafio/AvatarCropper';
import SectionHeader from '@/components/app/SectionHeader';

const EditProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const desafio = useDesafio();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>((desafio.profileData.avatar || profile?.avatar_url) || null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    setAvatarPreview(dataUrl);
    // a foto fica no perfil do desafio (banco), que é o que as telas mostram;
    // o perfil antigo do app é só tentativa extra (não salvava)
    desafio.saveProfileData({ avatar: dataUrl });
    saveAvatar(user.id, dataUrl, profile?.full_name).then(() => refreshProfile()).catch(() => undefined);
    toast.success('Foto atualizada!');
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!fullName.trim()) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil atualizado!');
      navigate('/profile');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AppLayout activeNav="profile" showNav={false}>
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onSaved={handleCropped} />}
      <motion.div 
        initial={false}
        animate={{ opacity: 1 }}
        className="min-h-screen pb-8"
      >
        <SectionHeader 
          title="Editar Perfil" 
          subtitle="Atualize suas informações"
          backTo="/profile"
        />

        <div className="px-4 sm:px-6 max-w-lg mx-auto space-y-6">
          {/* Avatar Section */}
          <motion.div 
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPhotoOptions(true)}
                disabled={uploadingImage}
                className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25 border-4 border-background"
              >
                {uploadingImage ? (
                  <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground text-4xl font-bold">
                    {fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </motion.button>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-card rounded-full shadow-lg flex items-center justify-center border-2 border-background">
                <Camera className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.div>

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

          {/* Form */}
          <motion.div 
            initial={false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-5 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-12 h-14 rounded-xl border-border bg-secondary/30 text-base"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

          </motion.div>

          {/* Save Button */}
          <motion.div 
            initial={false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-xl shadow-primary/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </motion.div>
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
      </motion.div>
    </AppLayout>
  );
};

export default EditProfile;