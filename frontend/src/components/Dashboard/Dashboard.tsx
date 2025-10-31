import React, { useState } from 'react';
import { Link2, Globe, BarChart3, Settings } from 'lucide-react';
import Header from './Header';
import URLShortener from './URLShortener';
import URLList from './URLList';
import StatsCards from './StatsCards';
import { DomainManagement } from '../Domains/DomainManagement';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('urls');

  const tabs = [
    { id: 'urls', name: 'URLs', icon: Link2 },
    { id: 'domains', name: 'Domains', icon: Globe },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'urls' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <StatsCards />

            {/* URL Shortener Form */}
            <URLShortener />

            {/* URL List */}
            <URLList />
          </div>
        )}

        {activeTab === 'domains' && (
          <DomainManagement
            userRole="admin"
            language="en"
            getTranslation={(key: string) => key}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-600">Detailed analytics and reporting features will be available soon.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Coming Soon</h3>
            <p className="text-gray-600">User and organization settings will be available soon.</p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 URL Shortener. Built with React, TypeScript, and Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;