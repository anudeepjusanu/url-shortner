import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import amplitudeService from "@/services/amplitude";

// Initialize Amplitude once at module load
amplitudeService.initialize();

// Tracks a Page View event on every route change
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const pageName = location.pathname.replace(/^\//, "").replace(/\//g, " / ") || "home";
    amplitudeService.trackPageView(pageName, location.pathname);
  }, [location]);
  return null;
};
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MyLinks from "./pages/MyLinks";
import CreateLink from "./pages/CreateLink";
import QRCodes from "./pages/QRCodes";
import AnalyticsPage from "./pages/AnalyticsPage";
import CustomDomains from "./pages/CustomDomains";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Profile from "./pages/Profile";
import ApiDocs from "./pages/ApiDocs";
import UserManagement from "./pages/UserManagement";
import UrlManagement from "./pages/UrlManagement";
import CreateQRCode from "./pages/CreateQRCode";
import AddDomain from "./pages/AddDomain";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import BioPages from "./pages/BioPages";
import BioPageEditor from "./pages/BioPageEditor";
import PublicBioPage from "./pages/PublicBioPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/links" element={<ProtectedRoute><MyLinks /></ProtectedRoute>} />
            <Route path="/dashboard/create-link" element={<ProtectedRoute><CreateLink /></ProtectedRoute>} />
            <Route path="/dashboard/qr-codes" element={<ProtectedRoute><QRCodes /></ProtectedRoute>} />
            <Route path="/dashboard/qr-codes/create" element={<ProtectedRoute><CreateQRCode /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/dashboard/analytics/:linkId" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/dashboard/domains" element={<ProtectedRoute><CustomDomains /></ProtectedRoute>} />
            <Route path="/dashboard/domains/add" element={<ProtectedRoute><AddDomain /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard/api" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/dashboard/urls" element={<ProtectedRoute><UrlManagement /></ProtectedRoute>} />
            <Route path="/dashboard/bio-pages" element={<ProtectedRoute><BioPages /></ProtectedRoute>} />
            <Route path="/dashboard/bio-pages/create" element={<ProtectedRoute><BioPageEditor /></ProtectedRoute>} />
            <Route path="/dashboard/bio-pages/:id/edit" element={<ProtectedRoute><BioPageEditor /></ProtectedRoute>} />
            <Route path="/bio/:username" element={<PublicBioPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
