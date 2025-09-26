import React, { useState } from 'react';
import { 
  Link2, 
  BarChart3, 
  Users, 
  Globe, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Activity,
  Shield,
  LogOut,
  Menu,
  X,
  Languages,
  User,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Zap
} from 'lucide-react';
import { GlobalAnalytics } from '../Analytics/GlobalAnalytics';
import { PerLinkAnalytics } from '../Analytics/PerLinkAnalytics';
import { DomainManagement } from '../Domains/DomainManagement';
import { CreateLinkFlow } from '../Links/CreateLinkFlow';

interface Link {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'disabled';
  clicks: number;
}

interface DashboardProps {
  userEmail: string;
  userRole: 'admin' | 'editor' | 'viewer';
  onLogout: () => void;
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  userRole,
  onLogout,
  language,
  onLanguageChange
}) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentRole, setCurrentRole] = useState(userRole);

  const translations = {
    dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
    links: { en: 'Links', ar: 'الروابط' },
    analytics: { en: 'Analytics', ar: 'التحليلات' },
    domains: { en: 'Domains', ar: 'النطاقات' },
    createLink: { en: 'Create Link', ar: 'إنشاء رابط' },
    users: { en: 'Users', ar: 'المستخدمون' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
    logout: { en: 'Logout', ar: 'تسجيل الخروج' },
    welcome: { en: 'Welcome back', ar: 'مرحباً بعودتك' },
    createNewLink: { en: 'Create New Link', ar: 'إنشاء رابط جديد' },
    totalLinks: { en: 'Total Links', ar: 'إجمالي الروابط' },
    totalClicks: { en: 'Total Clicks', ar: 'إجمالي النقرات' },
    activeDomains: { en: 'Active Domains', ar: 'النطاقات النشطة' },
    recentActivity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
    switchRole: { en: 'Switch Role', ar: 'تغيير الدور' }
  };

  const t = (key: keyof typeof translations) => translations[key][language];

  const mockLinks: Link[] = [
    {
      id: '1',
      shortUrl: 'short.sa/gov-portal',
      destinationUrl: 'https://saudi.gov.sa/wps/portal/snp/main',
      slug: 'gov-portal',
      domain: 'short.sa',
      createdBy: 'admin@gov.sa',
      createdAt: '2024-01-15',
      status: 'active',
      clicks: 1250
    },
    {
      id: '2',
      shortUrl: 'enterprise.sa/vision2030',
      destinationUrl: 'https://www.vision2030.gov.sa/',
      slug: 'vision2030',
      domain: 'enterprise.sa',
      createdBy: 'editor@company.sa',
      createdAt: '2024-01-14',
      status: 'active',
      clicks: 890
    },
    {
      id: '3',
      shortUrl: 'short.sa/neom-info',
      destinationUrl: 'https://www.neom.com/',
      slug: 'neom-info',
      domain: 'short.sa',
      createdBy: 'admin@gov.sa',
      createdAt: '2024-01-13',
      status: 'disabled',
      clicks: 756
    }
  ];

  const getFilteredLinks = () => {
    if (currentRole === 'admin') return mockLinks;
    if (currentRole === 'editor') return mockLinks.filter(link => link.createdBy === userEmail);
    return mockLinks; // Viewer can see all but not edit
  };

  const renderSidebar = () => (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-xl text-gray-900">LinkShorten</h1>
              <p className="text-sm text-gray-600">Enterprise</p>
            </div>
          )}
        </div>
      </div>

      <nav className="px-4 space-y-2">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'dashboard' 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          {sidebarOpen && <span>{t('dashboard')}</span>}
        </button>

        <button
          onClick={() => setActiveSection('links')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'links' 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Link2 className="w-5 h-5" />
          {sidebarOpen && <span>{t('links')}</span>}
        </button>


        <button
          onClick={() => setActiveSection('analytics')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'analytics' 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          {sidebarOpen && <span>{t('analytics')}</span>}
        </button>

        {currentRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveSection('domains')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'domains' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-5 h-5" />
              {sidebarOpen && <span>{t('domains')}</span>}
            </button>

            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'users' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span>{t('users')}</span>}
            </button>
          </>
        )}

        <button
          onClick={() => setActiveSection('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeSection === 'settings' 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-5 h-5" />
          {sidebarOpen && <span>{t('settings')}</span>}
        </button>
      </nav>

      {sidebarOpen && (
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900 truncate">{userEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                currentRole === 'admin' ? 'bg-red-100 text-red-800' :
                currentRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t('logout')}</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderHeader = () => (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {activeSection === 'dashboard' && t('dashboard')}
              {activeSection === 'links' && t('links')}
              {activeSection === 'analytics' && t('analytics')}
              {activeSection === 'domains' && t('domains')}
              {activeSection === 'users' && t('users')}
              {activeSection === 'settings' && t('settings')}
            </h2>
            <p className="text-sm text-gray-600">{t('welcome')}, {userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          
          {(currentRole === 'admin' || currentRole === 'editor') && (
            <button
              onClick={() => setShowCreateFlow(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('createNewLink')}
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const renderDashboardOverview = () => (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalLinks')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {getFilteredLinks().length}
              </p>
              <p className="text-sm text-green-600 mt-1">+12% this month</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalClicks')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {getFilteredLinks().reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">+8% this week</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('activeDomains')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
              <p className="text-sm text-blue-600 mt-1">2 custom domains</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Links */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Links</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredLinks().slice(0, 5).map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-blue-600">{link.shortUrl}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 truncate max-w-xs block">
                      {link.destinationUrl}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {link.clicks.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      link.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedLink(link);
                          setActiveSection('analytics');
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentRole !== 'viewer' && (
                        <button className="text-gray-600 hover:text-gray-700">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLinksManagement = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">All Links</h3>
          <p className="text-sm text-gray-600">Manage your shortened links</p>
        </div>
        {currentRole !== 'viewer' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Link
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search links..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredLinks().map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-blue-600">{link.shortUrl}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 truncate max-w-xs block">
                      {link.destinationUrl}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.createdBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      link.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {link.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedLink(link);
                          setActiveSection('analytics');
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="View Analytics"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700" title="Copy Link">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700" title="Open Link">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {currentRole !== 'viewer' && (
                        <>
                          <button className="text-gray-600 hover:text-gray-700" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Domain</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option>short.sa</option>
                <option>enterprise.sa</option>
                <option>ministry.gov.sa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as 'en' | 'ar')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (showCreateFlow) {
      return (
        <CreateLinkFlow
          onBack={() => setShowCreateFlow(false)}
          userRole={currentRole}
          language={language}
          getTranslation={t}
        />
      );
    }

    if (selectedLink && activeSection === 'analytics') {
      return (
        <PerLinkAnalytics
          link={selectedLink}
          onBack={() => setSelectedLink(null)}
          userRole={currentRole}
          language={language}
          getTranslation={t}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return renderDashboardOverview();
      case 'links':
        return renderLinksManagement();
      case 'analytics':
        return (
          <GlobalAnalytics
            userRole={currentRole}
            language={language}
            getTranslation={t}
          />
        );
      case 'domains':
        return (
          <DomainManagement
            userRole={currentRole}
            language={language}
            getTranslation={t}
          />
        );
      case 'users':
        return renderUserManagement();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboardOverview();
    }
  };

  const renderUserManagement = () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Ahmed Al-Rashid',
        email: 'admin@gov.sa',
        role: 'admin' as const,
        status: 'active' as const,
        lastLogin: '2024-01-20 09:15:23',
        dateAdded: '2024-01-01',
        linksCreated: 156,
        department: 'IT Administration'
      },
      {
        id: '2',
        name: 'Fatima Al-Zahra',
        email: 'editor@company.sa',
        role: 'editor' as const,
        status: 'active' as const,
        lastLogin: '2024-01-20 14:32:15',
        dateAdded: '2024-01-05',
        linksCreated: 89,
        department: 'Marketing'
      },
      {
        id: '3',
        name: 'Mohammed Al-Faisal',
        email: 'editor@gov.sa',
        role: 'editor' as const,
        status: 'active' as const,
        lastLogin: '2024-01-19 16:45:12',
        dateAdded: '2024-01-08',
        linksCreated: 67,
        department: 'Communications'
      },
      {
        id: '4',
        name: 'Sarah Al-Mansouri',
        email: 'viewer@company.sa',
        role: 'viewer' as const,
        status: 'active' as const,
        lastLogin: '2024-01-20 11:22:45',
        dateAdded: '2024-01-12',
        linksCreated: 0,
        department: 'Analytics'
      },
      {
        id: '5',
        name: 'Omar Al-Khalil',
        email: 'viewer@gov.sa',
        role: 'viewer' as const,
        status: 'inactive' as const,
        lastLogin: '2024-01-15 13:28:33',
        dateAdded: '2024-01-10',
        linksCreated: 0,
        department: 'Research'
      },
      {
        id: '6',
        name: 'Nora Al-Saud',
        email: 'editor2@company.sa',
        role: 'editor' as const,
        status: 'pending' as const,
        lastLogin: 'Never',
        dateAdded: '2024-01-18',
        linksCreated: 0,
        department: 'Content'
      }
    ];

    const getRoleBadge = (role: string) => {
      const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full";
      
      switch (role) {
        case 'admin':
          return (
            <span className={`${baseClasses} bg-red-100 text-red-800`}>
              <Shield className="w-3 h-3" />
              Admin
            </span>
          );
        case 'editor':
          return (
            <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
              <Edit className="w-3 h-3" />
              Editor
            </span>
          );
        case 'viewer':
          return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
              <Eye className="w-3 h-3" />
              Viewer
            </span>
          );
        default:
          return null;
      }
    };

    const getStatusBadge = (status: string) => {
      const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full";
      
      switch (status) {
        case 'active':
          return (
            <span className={`${baseClasses} bg-green-100 text-green-800`}>
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          );
        case 'inactive':
          return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
              <X className="w-3 h-3" />
              Inactive
            </span>
          );
        case 'pending':
          return (
            <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
              <Clock className="w-3 h-3" />
              Pending
            </span>
          );
        default:
          return null;
      }
    };

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add New User
          </button>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{mockUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockUsers.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Editors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockUsers.filter(u => u.role === 'editor').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Viewers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockUsers.filter(u => u.role === 'viewer').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Links Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.linksCreated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin === 'Never' ? (
                        <span className="text-gray-500 italic">Never</span>
                      ) : (
                        new Date(user.lastLogin).toLocaleDateString()
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700" title="Edit User">
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.status === 'inactive' ? (
                          <button className="text-green-600 hover:text-green-700" title="Activate User">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button className="text-yellow-600 hover:text-yellow-700" title="Deactivate User">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {user.email !== userEmail && (
                          <button className="text-red-600 hover:text-red-700" title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-red-600" />
                <h5 className="font-semibold text-red-900">Admin</h5>
              </div>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• Domain management</li>
                <li>• Global analytics</li>
                <li>• System settings</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Edit className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-blue-900">Editor</h5>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Create & edit links</li>
                <li>• View own analytics</li>
                <li>• Manage own links</li>
                <li>• Export data</li>
                <li>• Basic settings</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-gray-600" />
                <h5 className="font-semibold text-gray-900">Viewer</h5>
              </div>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>• View links (read-only)</li>
                <li>• View analytics</li>
                <li>• Export reports</li>
                <li>• Basic profile settings</li>
                <li>• No creation/editing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {renderSidebar()}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderHeader()}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};