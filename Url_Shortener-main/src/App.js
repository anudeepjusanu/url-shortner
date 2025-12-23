import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PermissionProvider } from './contexts/PermissionContext';
import './App.css';
import './rtl.css';
import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CustomDomains from './components/CustomDomains';
import CreateShortLink from './components/CreateShortLink';
import Analytics from './components/Analytics';
import MyLinks from './components/MyLinks';
import UTMBuilder from './components/UtmBuilder';
import QRCodes from './components/QRCodes';
import ContentFilter from './components/ContentFilter';
import Subscription from './components/SubscriptionPage';
import Profile from './components/Profile';
import BillingManagement from './components/BillingManagement';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import UserManagement from './components/UserManagement';
import BioPage from './components/BioPage';
import LinkBundles from './components/LinkBundles';
import LinkHealth from './components/LinkHealth';
import PublicBioPage from './components/PublicBioPage';
// Import placeholder components for now - we'll create them later
const CreateLink = () => <div>Create Link Page</div>;
const TeamMembers = () => <div>Team Members Page</div>;

function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <LanguageProvider>
          <Router>
            <div className="App">
              <Routes>
            {/* Landing page route */}
            <Route path="/" element={<LandingPage />} />

            {/* Public pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            
            {/* Public Bio Page - No authentication required */}
            <Route path="/:username" element={<PublicBioPage />} />

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

            {/* Phase 1 Features - Protected */}
            <Route path="/bio-page" element={
              <ProtectedRoute>
                <Layout>
                  <BioPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/bundles" element={
              <ProtectedRoute>
                <Layout>
                  <LinkBundles />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/health" element={
              <ProtectedRoute>
                <Layout>
                  <LinkHealth />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Redirect any unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
        </LanguageProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;