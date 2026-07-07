import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ScrollToTop from "@/components/ScrollToTop";

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Tracks a Page View event on every route change — Amplitude is loaded lazily
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    import("@/services/amplitude").then(({ default: amplitudeService }) => {
      const pageName =
        location.pathname.replace(/^\//, "").replace(/\//g, " / ") || "home";
      amplitudeService.trackPageView(pageName, location.pathname);
    });
    type TikTokWindow = Window & { ttq?: { page: () => void } };
    if (typeof window !== "undefined" && (window as TikTokWindow).ttq) {
      (window as TikTokWindow).ttq!.page();
    }
  }, [location]);
  return null;
};

import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UTMProvider } from "./contexts/UTMContext";
import { ProjectProvider } from "./contexts/ProjectContext";

// Initialize Amplitude lazily after first render — keeps SDK off the critical path
const AmplitudeInit = () => {
  useEffect(() => {
    import("@/services/amplitude").then(({ default: amplitudeService }) => {
      amplitudeService.initialize();
    });
  }, []);
  return null;
};

// Landing page kept eager — it IS the critical path for the homepage LCP
import Index from "./pages/Index";

// All other pages are lazy-loaded — they ship in separate chunks
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyLinks = lazy(() => import("./pages/MyLinks"));
const CreateLink = lazy(() => import("./pages/CreateLink"));
const QRCodes = lazy(() => import("./pages/QRCodes"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CustomDomains = lazy(() => import("./pages/CustomDomains"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Profile = lazy(() => import("./pages/Profile"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const UrlManagement = lazy(() => import("./pages/UrlManagement"));
const CreateQRCode = lazy(() => import("./pages/CreateQRCode"));
const AddDomain = lazy(() => import("./pages/AddDomain"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const BioPages = lazy(() => import("./pages/BioPages"));
const BioPageEditor = lazy(() => import("./pages/BioPageEditor"));
const BioWizard = lazy(() => import("./pages/BioWizard"));
const BioBuilder = lazy(() => import("./pages/BioBuilder"));
const PublicBioPage = lazy(() => import("./pages/PublicBioPage"));
const BulkCreate = lazy(() => import("./pages/BulkCreate"));
const BulkShorten = lazy(() => import("./pages/BulkShorten"));
const DynamicQRCodes = lazy(() => import("./pages/DynamicQRCodes"));
const CreateDynamicQRCode = lazy(() => import("./pages/CreateDynamicQRCode"));
const ShortenLinkFlow = lazy(() => import("./pages/ShortenLinkFlow"));
const QRErrorPage = lazy(() => import("./pages/QRErrorPage"));
const LinkNotFoundPage = lazy(() => import("./pages/LinkNotFoundPage"));
const BlockedLinkPage = lazy(() => import("./pages/BlockedLinkPage"));
const UTMBuilder = lazy(() => import("./pages/UTMBuilder"));
const CreateUTMLink = lazy(() => import("./pages/CreateUTMLink"));
const FeatureUrlShortening = lazy(() => import("./pages/FeatureUrlShortening"));
const FeatureQRCodes = lazy(() => import("./pages/FeatureQRCodes"));
const FeatureLinkInBio = lazy(() => import("./pages/FeatureLinkInBio"));
const FeatureUTMTracking = lazy(() => import("./pages/FeatureUTMTracking"));
const FeatureCustomDomains = lazy(() => import("./pages/FeatureCustomDomains"));
const FeatureAPI = lazy(() => import("./pages/FeatureAPI"));
const DeepLinks = lazy(() => import("./pages/DeepLinks"));
const AppRegistrations = lazy(() => import("./pages/AppRegistrations"));
const CreateAppRegistration = lazy(
  () => import("./pages/CreateAppRegistration"),
);
const CreateDeepLink = lazy(() => import("./pages/CreateDeepLink"));
const TeamOverview = lazy(() => import("./pages/TeamOverview"));
const TeamMemberDetail = lazy(() => import("./pages/TeamMemberDetail"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

const queryClient = new QueryClient();

// Minimal spinner shown while a lazy chunk loads — keeps LCP element visible
const PageLoader = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: "3px solid #e5e7eb",
        borderTopColor: "#1e3a5f",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProjectProvider>
            <UTMProvider>
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <AmplitudeInit />
                  <PageViewTracker />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route
                        path="/privacy-policy"
                        element={<PrivacyPolicy />}
                      />
                      <Route path="/terms" element={<TermsAndConditions />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/links"
                        element={
                          <ProtectedRoute>
                            <MyLinks />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/create-link"
                        element={
                          <ProtectedRoute>
                            <CreateLink />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/qr-codes"
                        element={
                          <ProtectedRoute>
                            <QRCodes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/qr-codes/create"
                        element={
                          <ProtectedRoute>
                            <CreateQRCode />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/analytics"
                        element={
                          <ProtectedRoute>
                            <AnalyticsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/analytics/:linkId"
                        element={
                          <ProtectedRoute>
                            <AnalyticsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/domains"
                        element={
                          <ProtectedRoute>
                            <CustomDomains />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/domains/add"
                        element={
                          <ProtectedRoute>
                            <AddDomain />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/profile"
                        element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/api"
                        element={
                          <ProtectedRoute>
                            <ApiDocs />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/users"
                        element={
                          <ProtectedRoute>
                            <UserManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/urls"
                        element={
                          <ProtectedRoute>
                            <UrlManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/team"
                        element={
                          <ProtectedRoute>
                            <TeamOverview />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/team/:userId"
                        element={
                          <ProtectedRoute>
                            <TeamMemberDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/invite/accept"
                        element={
                          <ProtectedRoute>
                            <AcceptInvite />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-pages"
                        element={
                          <ProtectedRoute>
                            <BioPages />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-pages/create"
                        element={
                          <ProtectedRoute>
                            <BioPageEditor />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-pages/:id/edit"
                        element={
                          <ProtectedRoute>
                            <BioPageEditor />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-wizard"
                        element={
                          <ProtectedRoute>
                            <BioWizard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-wizard/:id/edit"
                        element={
                          <ProtectedRoute>
                            <BioWizard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bio-builder/:id"
                        element={
                          <ProtectedRoute>
                            <BioBuilder />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bulk-create"
                        element={
                          <ProtectedRoute>
                            <BulkCreate />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/bulk-shorten"
                        element={
                          <ProtectedRoute>
                            <BulkShorten />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/dynamic-qr"
                        element={
                          <ProtectedRoute>
                            <DynamicQRCodes />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/dynamic-qr/create"
                        element={
                          <ProtectedRoute>
                            <CreateDynamicQRCode />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/utm-builder"
                        element={
                          <ProtectedRoute>
                            <UTMBuilder />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/utm-builder/create"
                        element={
                          <ProtectedRoute>
                            <CreateUTMLink />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links"
                        element={
                          <ProtectedRoute>
                            <DeepLinks />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links/apps"
                        element={
                          <ProtectedRoute>
                            <AppRegistrations />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links/register-app"
                        element={
                          <ProtectedRoute>
                            <CreateAppRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links/register-app/:id/edit"
                        element={
                          <ProtectedRoute>
                            <CreateAppRegistration />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links/create"
                        element={
                          <ProtectedRoute>
                            <CreateDeepLink />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/deep-links/:urlId/edit"
                        element={
                          <ProtectedRoute>
                            <CreateDeepLink />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/bio/:username"
                        element={<PublicBioPage />}
                      />
                      {/* Public error page for failed dynamic QR scans — no auth required */}
                      <Route path="/qr-error" element={<QRErrorPage />} />
                      <Route
                        path="/link-not-found"
                        element={<LinkNotFoundPage />}
                      />
                      <Route path="/blocked" element={<BlockedLinkPage />} />
                      <Route path="/shorten" element={<ShortenLinkFlow />} />
                      <Route
                        path="/features/url-shortening"
                        element={<FeatureUrlShortening />}
                      />
                      <Route
                        path="/features/qr-codes"
                        element={<FeatureQRCodes />}
                      />
                      <Route
                        path="/features/link-in-bio"
                        element={<FeatureLinkInBio />}
                      />
                      <Route
                        path="/features/utm-tracking"
                        element={<FeatureUTMTracking />}
                      />
                      <Route
                        path="/features/custom-domains"
                        element={<FeatureCustomDomains />}
                      />
                      <Route path="/features/api" element={<FeatureAPI />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </GoogleOAuthProvider>
            </UTMProvider>
          </ProjectProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
