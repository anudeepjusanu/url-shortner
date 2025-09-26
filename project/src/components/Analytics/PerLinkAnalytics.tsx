import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Download, 
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Copy,
  Edit,
  ArrowLeft,
  BarChart3,
  PieChart,
  Map,
  Activity,
  Globe,
  Share2
} from 'lucide-react';

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

interface PerLinkAnalyticsProps {
  link: Link;
  onBack: () => void;
  userRole: 'admin' | 'editor' | 'viewer';
  language: 'en' | 'ar';
  getTranslation: (key: string) => string;
}

export const PerLinkAnalytics: React.FC<PerLinkAnalyticsProps> = ({ 
  link, 
  onBack, 
  userRole, 
  language, 
  getTranslation 
}) => {
  const [timeView, setTimeView] = useState('daily');
  const [exportFormat, setExportFormat] = useState('csv');

  const mockLinkData = {
    totalClicks: link.clicks,
    uniqueUsers: Math.floor(link.clicks * 0.73), // Approximate unique users
    avgClicksPerDay: Math.floor(link.clicks / 30),
    lastClickedDate: '2024-01-20 14:32:15',
    clicksOverTime: [
      { date: '2024-01-14', clicks: 45 },
      { date: '2024-01-15', clicks: 67 },
      { date: '2024-01-16', clicks: 89 },
      { date: '2024-01-17', clicks: 56 },
      { date: '2024-01-18', clicks: 78 },
      { date: '2024-01-19', clicks: 92 },
      { date: '2024-01-20', clicks: 134 }
    ],
    deviceBreakdown: [
      { device: 'Desktop', count: Math.floor(link.clicks * 0.65), percentage: 65 },
      { device: 'Mobile', count: Math.floor(link.clicks * 0.30), percentage: 30 },
      { device: 'Tablet', count: Math.floor(link.clicks * 0.05), percentage: 5 }
    ],
    geographicData: [
      { country: 'Saudi Arabia', clicks: Math.floor(link.clicks * 0.68), flag: '🇸🇦', percentage: 68 },
      { country: 'UAE', clicks: Math.floor(link.clicks * 0.15), flag: '🇦🇪', percentage: 15 },
      { country: 'Kuwait', clicks: Math.floor(link.clicks * 0.08), flag: '🇰🇼', percentage: 8 },
      { country: 'Qatar', clicks: Math.floor(link.clicks * 0.06), flag: '🇶🇦', percentage: 6 },
      { country: 'Bahrain', clicks: Math.floor(link.clicks * 0.03), flag: '🇧🇭', percentage: 3 }
    ],
    referrerSources: [
      { source: 'Direct', clicks: Math.floor(link.clicks * 0.35), percentage: 35 },
      { source: 'WhatsApp', clicks: Math.floor(link.clicks * 0.25), percentage: 25 },
      { source: 'LinkedIn', clicks: Math.floor(link.clicks * 0.15), percentage: 15 },
      { source: 'Email', clicks: Math.floor(link.clicks * 0.12), percentage: 12 },
      { source: 'Twitter', clicks: Math.floor(link.clicks * 0.08), percentage: 8 },
      { source: 'Other', clicks: Math.floor(link.clicks * 0.05), percentage: 5 }
    ]
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Link Analytics</h1>
          <p className="text-gray-600">Detailed performance metrics for this link</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="csv">Export CSV</option>
          <option value="pdf">Export PDF</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );

  const renderLinkInfo = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Link Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Short URL</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-blue-600 font-medium">{link.shortUrl}</p>
            <button className="text-gray-400 hover:text-gray-600">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Destination URL</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-900 truncate max-w-48">{link.destinationUrl}</p>
            <button className="text-gray-400 hover:text-gray-600">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Custom Slug</p>
          <p className="text-sm text-gray-900">{link.slug}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              link.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {link.status === 'active' ? 'Active' : 'Disabled'}
            </span>
            {userRole !== 'viewer' && (
              <button className="text-gray-400 hover:text-gray-600">
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderKPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{mockLinkData.totalClicks.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+15% this week</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Unique Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{mockLinkData.uniqueUsers.toLocaleString()}</p>
            <p className="text-sm text-blue-600 mt-1">~73% of total clicks</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg. Clicks/Day</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{mockLinkData.avgClicksPerDay}</p>
            <p className="text-sm text-purple-600 mt-1">Last 30 days</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Created</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{link.createdAt}</p>
            <p className="text-sm text-gray-600 mt-1">Last click: {mockLinkData.lastClickedDate.split(' ')[0]}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderClicksChart = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Clicks Over Time</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeView('daily')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeView === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeView('weekly')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeView === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeView('monthly')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeView === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      
      <div className="h-64 flex items-end justify-between gap-2">
        {mockLinkData.clicksOverTime.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-600 rounded-t-lg transition-all duration-300 hover:bg-blue-700 cursor-pointer"
              style={{ height: `${(data.clicks / 140) * 100}%`, minHeight: '4px' }}
              title={`${data.clicks} clicks on ${data.date}`}
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
        {mockLinkData.deviceBreakdown.map((device, index) => (
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
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{device.count}</p>
                <p className="text-xs text-gray-500">{device.percentage}%</p>
              </div>
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
        {mockLinkData.geographicData.map((country, index) => (
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
              <div className="text-right w-16">
                <p className="text-sm font-medium text-gray-900">{country.clicks}</p>
                <p className="text-xs text-gray-500">{country.percentage}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReferrerSources = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrer Sources</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-sm font-medium text-gray-600">Source</th>
              <th className="text-right py-2 text-sm font-medium text-gray-600">Clicks</th>
              <th className="text-right py-2 text-sm font-medium text-gray-600">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {mockLinkData.referrerSources.map((source, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-b-0">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      source.source === 'Direct' ? 'bg-blue-500' :
                      source.source === 'WhatsApp' ? 'bg-green-500' :
                      source.source === 'LinkedIn' ? 'bg-blue-700' :
                      source.source === 'Email' ? 'bg-red-500' :
                      source.source === 'Twitter' ? 'bg-sky-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-900">{source.source}</span>
                  </div>
                </td>
                <td className="py-3 text-right text-sm font-medium text-gray-900">
                  {source.clicks}
                </td>
                <td className="py-3 text-right text-sm text-gray-600">
                  {source.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {renderHeader()}
      {renderLinkInfo()}
      {renderKPICards()}
      {renderClicksChart()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderDeviceBreakdown()}
        {renderGeographicData()}
      </div>

      {renderReferrerSources()}
    </div>
  );
};