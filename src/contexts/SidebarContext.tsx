import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean; // agora inclui tablet também
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // Usa mobile OU tablet para decidir se mostra bottom nav
  const isMobile = useIsMobileOrTablet();
  const [isExpanded, setIsExpanded] = useState(true);

  // On desktop, persist sidebar state
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem('sidebar-expanded');
      if (saved !== null) {
        setIsExpanded(saved === 'true');
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-expanded', String(isExpanded));
    }
  }, [isExpanded, isMobile]);

  const toggleSidebar = () => setIsExpanded(prev => !prev);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};
