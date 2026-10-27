import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { PLAYER_PASSWORD, playerEmail } from '@/lib/desafio/accounts';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  scans_remaining: number;
  goal: string | null;
  phone_number: string | null;
  notification_meals: boolean;
  notification_water: boolean;
  notification_daily: boolean;
  notification_tips: boolean;
  has_seen_onboarding: boolean;
  water_goal_ml: number | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  plan: string | null;
  first_login: boolean;
  password_created: boolean;
  // Onboarding fields
  gender: string | null;
  birth_date: string | null;
  sleep_quality: number | null;
  dietary_restrictions: string[] | null;
  meal_routine: string | null;
  exercise_frequency: number | null;
  uses_supplements: boolean | null;
  target_weight: number | null;
  observations: string | null;
  onboarding_step: number | null;
  // Streak fields
  current_streak: number | null;
  longest_streak: number | null;
  last_active_date: string | null;
  flex_days: number[] | null;
  flex_calories_bonus: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  enterAs: (player: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    // O Supabase avisa de novo a cada troca de token e ao voltar para o app. Se for a
    // mesma pessoa, mantém o mesmo objeto de usuário: senão as telas recarregam e piscam.
    let currentId: string | null = null;
    const apply = (s: Session | null) => {
      setSession(s);
      const id = s?.user?.id ?? null;
      if (id !== currentId) {
        currentId = id;
        setUser(s?.user ?? null);
        if (s?.user) setTimeout(() => fetchProfile(s.user.id), 0);
        else setProfile(null);
      }
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => apply(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      apply(s);
      // A sessão guardada no aparelho pode ter caído (o banco não reconhece mais). Aí
      // tudo que depende do login falha calado (fotos dão "Bucket not found"). Confere
      // no servidor; se ele recusar, sai e manda para a tela de entrar de novo.
      if (s)
        supabase.auth.getUser().then(({ error }) => {
          if (error && (error.status === 401 || error.status === 403 || /jwt|session|token|user/i.test(error.message))) {
            supabase.auth.signOut({ scope: 'local' }).then(() => apply(null));
          }
        });
    });
    return () => subscription.unsubscribe();
  }, []);

  // Entrada só com o nome: cada jogador tem uma conta fixa por trás (e-mail e senha
  // do app, não da pessoa). Na 1ª vez a conta é criada. Escolha do grupo: qualquer um
  // pode entrar como qualquer um.
  const enterAs = async (player: string) => {
    const email = playerEmail(player);
    const first = await supabase.auth.signInWithPassword({ email, password: PLAYER_PASSWORD });
    if (!first.error) return { error: null };
    if (!/invalid login/i.test(first.error.message)) return { error: first.error };
    const created = await supabase.auth.signUp({ email, password: PLAYER_PASSWORD, options: { data: { full_name: player } } });
    if (created.error) return { error: created.error };
    if (!created.data.session) {
      return { error: new Error('A conta foi criada, mas o Supabase pede confirmação de e-mail. Desligue "Confirm email" em Auth → Providers → Email.') };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      enterAs,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
