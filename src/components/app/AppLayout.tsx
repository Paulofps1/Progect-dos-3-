import { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation } from 'react-router-dom';
import BottomNav from '@/components/app/BottomNav';
import DesktopSidebar from '@/components/app/DesktopSidebar';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
  activeNav?: 'home' | 'meals' | 'progress' | 'achievements' | 'water' | 'diets' | 'history' | 'profile';
  showNav?: boolean;
}

const AppLayout = ({ children, activeNav = 'home', showNav = true }: AppLayoutProps) => {
  const { isExpanded, isMobile } = useSidebarContext();
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // toda tela interna exige login: sem usuário, vai para a entrada
  if (!loading && !user) return <Navigate to="/auth" replace />;

  // Mobile: keep original layout exactly as-is
  if (isMobile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F8FA' }}>
        {children}
        {showNav && <BottomNav active={activeNav} />}
      </div>
    );
  }

  // Desktop: sidebar + centered content
  return (
    <div 
      className="min-h-screen flex w-full"
      style={{ backgroundColor: '#F5F8FA' }}
    >
      <DesktopSidebar />
      
      <main className="flex-1 min-h-screen min-w-0">
        <div className="px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
