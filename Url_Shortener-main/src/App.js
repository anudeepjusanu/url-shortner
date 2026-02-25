import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PermissionProvider } from './contexts/PermissionContext';
import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';
import './rtl.css';

// Lazy load all other components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const CustomDomains = lazy(() => import('./components/CustomDomains'));
const CreateShortLink = lazy(() => import('./components/CreateShortLink'));
const Analytics = lazy(() => import('./components/Analytics'));
const MyLinks = lazy(() => import('./components/MyLinks'));
const UTMBuilder = lazy(() => import('./components/UtmBuilder'));
const QRCodes = lazy(() => import('./components/QRCodes'));
const ContentFilter = lazy(() => import('./components/ContentFilter'));
const Subscription = lazy(() => import('./components/SubscriptionPage'));
const Profile = lazy(() => import('./components/Profile'));
const BillingManagement = lazy(() => import('./components/BillingManagement'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const AdminUrlManagement = lazy(() => import('./components/AdminUrlManagement'));
const GoogleAnalyticsDashboard = lazy(() => import('./components/GoogleAnalyticsDashboard'));
const ApiDocumentation = lazy(() => import('./components/ApiDocumentation'));
const NotFound = lazy(() => import('./components/NotFound'));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#2563eb'
  }}>
    <div>Loading...</div>
  </div>
);
// Import placeholder components for now - we'll create them later
// const QRCodes = () => <div>QR Codes Page</div>;
// const UTMBuilder = () => <div>UTM Builder Page</div>;
const CreateLink = () => <div>Create Link Page</div>;
const TeamMembers = () => <div>Team Members Page</div>;

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <LanguageProvider>
          <Router>
            <div className="App">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
            {/* Landing page route */}
            <Route path="/" element={<LandingPage />} />

            {/* Public pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/api-docs" element={<ApiDocumentation />} />

            {/* Authentication routes */}
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard routes - Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics/:id" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/create-short-link" element={
              <ProtectedRoute>
                <Layout>
                  <CreateShortLink />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-links" element={
              <ProtectedRoute>
                <Layout>
                  <MyLinks />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/qr-codes" element={
              <ProtectedRoute>
                <Layout>
                  <QRCodes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/custom-domains" element={
              <ProtectedRoute>
                <Layout>
                  <CustomDomains />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/utm-builder" element={
              <ProtectedRoute>
                <Layout>
                  <UTMBuilder />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/create-link" element={
              <ProtectedRoute>
                <Layout>
                  <CreateLink />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Account & Settings routes - Protected */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-members" element={
              <ProtectedRoute>
                <Layout>
                  <TeamMembers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <Layout>
                  <BillingManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Layout>
                  <Subscription />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/content-filter" element={
              <ProtectedRoute>
                <Layout>
                  <ContentFilter />
                </Layout>
              </ProtectedRoute>
            } />

            {/* User Management - Admin and Super Admin only */}
            <Route path="/user-management" element={
              <ProtectedRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Admin URL Management - Admin and Super Admin only */}
            <Route path="/admin-urls" element={
              <ProtectedRoute>
                <Layout>
                  <AdminUrlManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Google Analytics - Super Admin only */}
            <Route path="/google-analytics" element={
              <ProtectedRoute>
                <Layout>
                  <GoogleAnalyticsDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* 404 Not Found - catch all routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
              </Suspense>
            </div>
          </Router>
        </LanguageProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;