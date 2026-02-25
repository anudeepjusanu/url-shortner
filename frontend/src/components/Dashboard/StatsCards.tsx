import React, { useState, useEffect } from 'react';
import { BarChart3, Link2, MousePointer, TrendingUp } from 'lucide-react';
import { urlsAPI } from '../../services/api';

interface Stats {
  totalUrls: number;
  totalClicks: number;
  clicksToday: number;
  averageClicks: number;
}

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUrls: 0,
    totalClicks: 0,
    clicksToday: 0,
    averageClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await urlsAPI.getUrlStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    change 
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    change?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? '...' : typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <p className="ml-2 text-sm text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {change}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total URLs"
        value={stats.totalUrls}
        icon={Link2}
        color="bg-blue-500"
        change="+12%"
      />
      
      <StatCard
        title="Total Clicks"
        value={stats.totalClicks}
        icon={MousePointer}
        color="bg-green-500"
        change="+18%"
      />
      
      <StatCard
        title="Clicks Today"
        value={stats.clicksToday}
        icon={BarChart3}
        color="bg-purple-500"
        change="+8%"
      />
      
      <StatCard
        title="Avg. Clicks per URL"
        value={stats.averageClicks}
        icon={TrendingUp}
        color="bg-orange-500"
        change="+5%"
      />
    </div>
  );
};

export default StatsCards;