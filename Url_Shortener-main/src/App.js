import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CustomDomains from './components/CustomDomains';
import CreateShortLink from './components/CreateShortLink';
import Analytics from './components/Analytics';
// Import placeholder components for now - we'll create them later
const MyLinks = () => <div>My Links Page</div>;
const QRCodes = () => <div>QR Codes Page</div>;
const UTMBuilder = () => <div>UTM Builder Page</div>;
const CreateLink = () => <div>Create Link Page</div>;
const TeamMembers = () => <div>Team Members Page</div>;
const BillingHistory = () => <div>Billing History Page</div>;
const Subscription = () => <div>Subscription Page</div>;
const BillingPayment = () => <div>Billing Payment Page</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication routes */}
            <Route path="/register" element={<Registration />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard routes - Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/create-short-link" element={
              <ProtectedRoute>
                <CreateShortLink />
              </ProtectedRoute>
            } />
            <Route path="/my-links" element={
              <ProtectedRoute>
                <MyLinks />
              </ProtectedRoute>
            } />
            <Route path="/qr-codes" element={
              <ProtectedRoute>
                <QRCodes />
              </ProtectedRoute>
            } />
            <Route path="/custom-domains" element={
              <ProtectedRoute>
                <CustomDomains />
              </ProtectedRoute>
            } />
            <Route path="/utm-builder" element={
              <ProtectedRoute>
                <UTMBuilder />
              </ProtectedRoute>
            } />
            <Route path="/create-link" element={
              <ProtectedRoute>
                <CreateLink />
              </ProtectedRoute>
            } />

            {/* Account & Settings routes - Protected */}
            <Route path="/team-members" element={
              <ProtectedRoute>
                <TeamMembers />
              </ProtectedRoute>
            } />
            <Route path="/billing-history" element={
              <ProtectedRoute>
                <BillingHistory />
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            } />
            <Route path="/billing-payment" element={
              <ProtectedRoute>
                <BillingPayment />
              </ProtectedRoute>
            } />

            {/* Redirect any unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;