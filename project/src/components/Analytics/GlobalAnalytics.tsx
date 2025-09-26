import React, { useState } from 'react';
import { 
  TrendingUp, 
  Link2, 
  Eye, 
  EyeOff, 
  Download, 
  Filter, 
  Calendar,
  BarChart3,
  PieChart,
  Map,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Activity
} from 'lucide-react';

interface GlobalAnalyticsProps {
  userRole: 'admin' | 'editor' | 'viewer';
  language: 'en' | 'ar';
  getTranslation: (key: string) => string;
}

export const GlobalAnalytics: React.FC<GlobalAnalyticsProps> = ({ 
  userRole, 
  language, 
  getTranslation 
}) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartView, setChartView] = useState('daily');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState('all');

  const mockGlobalData = {
    totalLinks: 2847,
    totalClicks7d: 18456,
    totalClicks30d: 89234,
    activeLinks: 2654,
    disabledLinks: 193,
    topPerformingLinks: [
      { id: '1', shortUrl: 'short.sa/gov-portal', clicks: 1250, destination: 'saudi.gov.sa/portal' },
      { id: '2', shortUrl: 'enterprise.sa/vision2030', clicks: 890, destination: 'vision2030.gov.sa' },
      { id: '3', shortUrl: 'short.sa/neom-info', clicks: 756, destination: 'neom.com' },
      { id: '4', shortUrl: 'ministry.gov.sa/services', clicks: 634, destination: 'services.gov.sa' },
      { id: '5', shortUrl: 'short.sa/digital-gov', clicks: 523, destination: 'digital.gov.sa' }
    ],
    clicksOverTime: [
      { date: '2024-01-14', clicks: 2340 },
      { date: '2024-01-15', clicks: 2890 },
      { date: '2024-01-16', clicks: 3120 },
      { date: '2024-01-17', clicks: 2756 },
      { date: '2024-01-18', clicks: 3456 },
      { date: '2024-01-19', clicks: 2987 },
      { date: '2024-01-20', clicks: 3234 }
    ],
    deviceBreakdown: [
      { device: 'Desktop', count: 12456, percentage: 67.5 },
      { device: 'Mobile', count: 5234, percentage: 28.4 },
      { device: 'Tablet', count: 766, percentage: 4.1 }
    ],
    geographicData: [
      { country: 'Saudi Arabia', clicks: 12456, flag: '🇸🇦', percentage: 67.5 },
      { country: 'UAE', clicks: 2345, flag: '🇦🇪', percentage: 12.7 },
      { country: 'Kuwait', clicks: 1567, flag: '🇰🇼', percentage: 8.5 },
      { country: 'Qatar', clicks: 1234, flag: '🇶🇦', percentage: 6.7 },
      { country: 'Bahrain', clicks: 854, flag: '🇧🇭', percentage: 4.6 }
    ],
    securityStats: {
      totalScanned: 2847,
      flaggedSuspicious: 23,
      brokenLinks: 12,
      suspiciousPercentage: 0.8
    }
  };

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Short Links</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{mockGlobalData.totalLinks.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+12% from last month</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Link2 className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Clicks ({timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(timeRange === '7d' ? mockGlobalData.totalClicks7d : mockGlobalData.totalClicks30d).toLocaleString()}
            </p>
            <p className="text-sm text-green-600 mt-1">+8% from previous period</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active vs Disabled</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-lg font-bold text-gray-900">{mockGlobalData.activeLinks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-lg font-bold text-gray-900">{mockGlobalData.disabledLinks}</span>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-1">93.2% active rate</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Security Status</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{mockGlobalData.securityStats.suspiciousPercentage}%</p>
            <p className="text-sm text-yellow-600 mt-1">{mockGlobalData.securityStats.flaggedSuspicious} flagged links</p>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-500" />
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Domains</option>
            <option value="short.sa">short.sa</option>
            <option value="enterprise.sa">enterprise.sa</option>
            <option value="ministry.gov.sa">ministry.gov.sa</option>
          </select>
        </div>

        {userRole === 'admin' && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <select
              value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Creators</option>
              <option value="admin@gov.sa">admin@gov.sa</option>
              <option value="editor@company.sa">editor@company.sa</option>
              <option value="editor@gov.sa">editor@gov.sa</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );

  const renderTopPerformingLinks = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Performing Links</h3>
      <div className="space-y-4">
        {mockGlobalData.topPerformingLinks.map((link, index) => (
          <div key={link.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-600 truncate">{link.shortUrl}</p>
                <p className="text-xs text-gray-500 truncate">{link.destination}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{link.clicks.toLocaleString()}</p>
              <p className="text-xs text-gray-500">clicks</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClicksChart = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Clicks Over Time</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartView('daily')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              chartView === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setChartView('weekly')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              chartView === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>
      
      <div className="h-64 flex items-end justify-between gap-2">
        {mockGlobalData.clicksOverTime.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-600 rounded-t-lg transition-all duration-300 hover:bg-blue-700"
              style={{ height: `${(data.clicks / 3500) * 100}%`, minHeight: '4px' }}
            ></div>
            <p className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
              {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeviceBreakdown = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
      <div className="space-y-4">
        {mockGlobalData.deviceBreakdown.map((device, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {device.device === 'Desktop' && <Monitor className="w-5 h-5 text-gray-500" />}
              {device.device === 'Mobile' && <Smartphone className="w-5 h-5 text-gray-500" />}
              {device.device === 'Tablet' && <Tablet className="w-5 h-5 text-gray-500" />}
              <span className="text-sm text-gray-700">{device.device}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    device.device === 'Desktop' ? 'bg-blue-600' :
                    device.device === 'Mobile' ? 'bg-green-600' : 'bg-purple-600'
                  }`}
                  style={{ width: `${device.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">
                {device.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGeographicData = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Breakdown</h3>
      <div className="space-y-3">
        {mockGlobalData.geographicData.map((country, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{country.flag}</span>
              <span className="text-sm text-gray-700">{country.country}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${country.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-16 text-right">
                {country.clicks.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurityPanel = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Analytics</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Suspicious Links</p>
              <p className="text-xs text-yellow-600">
                {mockGlobalData.securityStats.flaggedSuspicious} links flagged during creation
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-yellow-800">
            {mockGlobalData.securityStats.suspiciousPercentage}%
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Broken Links</p>
              <p className="text-xs text-red-600">
                {mockGlobalData.securityStats.brokenLinks} destinations not reachable
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-red-800">
            {mockGlobalData.securityStats.brokenLinks}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Healthy Links</p>
              <p className="text-xs text-green-600">
                {mockGlobalData.securityStats.totalScanned - mockGlobalData.securityStats.flaggedSuspicious - mockGlobalData.securityStats.brokenLinks} links verified safe
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-green-800">
            {((mockGlobalData.securityStats.totalScanned - mockGlobalData.securityStats.flaggedSuspicious - mockGlobalData.securityStats.brokenLinks) / mockGlobalData.securityStats.totalScanned * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Global Analytics Dashboard</h1>
          <p className="text-gray-600">
            {userRole === 'admin' 
              ? 'Complete organizational analytics across all users and domains'
              : userRole === 'editor'
              ? 'Analytics for links you have created'
              : 'View-only analytics dashboard'
            }
          </p>
        </div>
      </div>

      {renderKPICards()}
      {renderFilters()}
      {renderTopPerformingLinks()}
      {renderClicksChart()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderDeviceBreakdown()}
        {renderGeographicData()}
      </div>

      {userRole === 'admin' && renderSecurityPanel()}
    </div>
  );
};