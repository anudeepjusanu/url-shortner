import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/links" element={<MyLinks />} />
            <Route path="/dashboard/create-link" element={<CreateLink />} />
            <Route path="/dashboard/qr-codes" element={<QRCodes />} />
            <Route path="/dashboard/qr-codes/create" element={<CreateQRCode />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/analytics/:linkId" element={<AnalyticsPage />} />
            <Route path="/dashboard/domains" element={<CustomDomains />} />
            <Route path="/dashboard/domains/add" element={<AddDomain />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/api" element={<ApiDocs />} />
            <Route path="/dashboard/users" element={<UserManagement />} />
            <Route path="/dashboard/urls" element={<UrlManagement />} />
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
