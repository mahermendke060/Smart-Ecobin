import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Intro from "./pages/Intro";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScanDisposal from "./pages/ScanDisposal";
import BinLocator from "./pages/BinLocator";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Feedback from "./components/Feedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Intro />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/disposal" element={<ScanDisposal />} />
        <Route path="/locator" element={<BinLocator />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
