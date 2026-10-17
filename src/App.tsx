import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DemoBanner from "@/components/app/DemoBanner";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/app/PageTransition";
import Auth from "./pages/Auth";

import Today from "./pages/Today";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Water from "./pages/Water";
import Meals from "./pages/Meals";
import NotFound from "./pages/NotFound";
import Progress from "./pages/Progress";
import Achievements from "./pages/Achievements";
import Challenges from "./pages/Challenges";

import Workouts from "./pages/Workouts";
import Injection from "./pages/Injection";
import History from "./pages/History";

const queryClient = new QueryClient();
const IS_DEMO = import.meta.env.MODE === "demo";
// a demonstração roda dentro de outra página, então as rotas vão no "#"
const Router = IS_DEMO ? HashRouter : BrowserRouter;

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/dashboard" element={<Today />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/water" element={<Water />} />
          <Route path="/add-food" element={<Navigate to="/meals" replace />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/challenges" element={<Challenges />} />
          
          
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/injecao" element={<Injection />} />
          <Route path="/historico" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          {IS_DEMO && <DemoBanner />}
          <AuthProvider>
            <SidebarProvider>
              <AnimatedRoutes />
            </SidebarProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
