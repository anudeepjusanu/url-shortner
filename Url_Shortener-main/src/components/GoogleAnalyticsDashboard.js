import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { googleAnalyticsAPI } from '../services/api';
import { Users, UserPlus, MousePointer2, FileText, Clock, TrendingUp, RefreshCw, Smartphone, Globe, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

const GoogleAnalyticsDashboard = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasRole } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [dateRange, setDateRange] = useState('30daysAgo');
  const [realtimeData, setRealtimeData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkConfiguration = useCallback(async () => {
    try {
      const response = await googleAnalyticsAPI.checkStatus();
      if (response.success) {
        setIsConfigured(response.data.configured);
        return response.data.configured;
      }
      return false;
    } catch (err) { return false; }
  }, []);

  const loadRealtimeData = useCallback(async () => {
    try {
      const response = await googleAnalyticsAPI.getRealtime();
      if (response.success) setRealtimeData(response.data);
    } catch (err) { console.error(err); }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await googleAnalyticsAPI.getDashboard({ startDate: dateRange, endDate: 'today' });
      if (response.success) setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (await checkConfiguration()) {
        await Promise.all([loadRealtimeData(), loadDashboardData()]);
      }
      setLoading(false);
    };
    if (hasRole(['super_admin'])) init();
    else setLoading(false);
  }, [hasRole, checkConfiguration, loadRealtimeData, loadDashboardData]);

  useEffect(() => {
     if(isConfigured) {
        const interval = setInterval(loadRealtimeData, 30000);
        return () => clearInterval(interval);
     }
  }, [isConfigured, loadRealtimeData]);

  if (!hasRole(['super_admin'])) return null;

  if (loading) return <div className="p-8 text-center text-muted-foreground">{t('googleAnalytics.loading')}</div>;

  if (!isConfigured) {
    return (
      <div className="space-y-6">
         <h1 className="text-3xl font-bold">{t('googleAnalytics.title')}</h1>
         <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
               <div className="bg-orange-100 p-4 rounded-full mb-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
               </div>
               <h2 className="text-xl font-bold text-orange-900 mb-2">{t('googleAnalytics.notConfigured.title')}</h2>
               <p className="text-orange-800 max-w-md mb-6">{t('googleAnalytics.notConfigured.description')}</p>
               <div className="bg-white p-4 rounded border border-orange-200 text-left w-full max-w-lg font-mono text-sm overflow-x-auto">
                  GA_PROPERTY_ID=your_id<br/>
                  GA_CLIENT_EMAIL=email@service.com<br/>
                  GA_PRIVATE_KEY="your_key"
               </div>
            </CardContent>
         </Card>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
     <Card>
        <CardContent className="pt-6 flex items-center gap-4">
           <div className={cn("p-3 rounded-lg", color)}>
              <Icon className="h-6 w-6" />
           </div>
           <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold">{value}</h3>
           </div>
        </CardContent>
     </Card>
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold text-slate-900">{t('googleAnalytics.title')}</h1>
             <p className="text-muted-foreground">{t('googleAnalytics.subtitle')}</p>
          </div>
          <div className="flex gap-2">
             <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
             >
                <option value="7daysAgo">{t('googleAnalytics.dateRange.7days')}</option>
                <option value="30daysAgo">{t('googleAnalytics.dateRange.30days')}</option>
                <option value="90daysAgo">{t('googleAnalytics.dateRange.90days')}</option>
             </select>
             <Button variant="outline" size="icon" onClick={() => { loadRealtimeData(); loadDashboardData(); }} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
             </Button>
          </div>
       </div>

       {realtimeData && (
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
             <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                   <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                   </span>
                   <span className="font-semibold tracking-wider text-blue-100 text-sm uppercase">{t('googleAnalytics.realtime.activeUsers')}</span>
                </div>
                <div className="text-5xl font-bold">{realtimeData.activeUsers}</div>
             </CardContent>
          </Card>
       )}

       {dashboardData?.overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <StatCard icon={Users} title={t('googleAnalytics.metrics.activeUsers')} value={dashboardData.overview.activeUsers.toLocaleString()} color="bg-blue-50 text-blue-600" />
             <StatCard icon={UserPlus} title={t('googleAnalytics.metrics.newUsers')} value={dashboardData.overview.newUsers.toLocaleString()} color="bg-green-50 text-green-600" />
             <StatCard icon={MousePointer2} title={t('googleAnalytics.metrics.sessions')} value={dashboardData.overview.sessions.toLocaleString()} color="bg-purple-50 text-purple-600" />
             <StatCard icon={FileText} title={t('googleAnalytics.metrics.pageViews')} value={dashboardData.overview.pageViews.toLocaleString()} color="bg-orange-50 text-orange-600" />
             <StatCard icon={Clock} title={t('googleAnalytics.metrics.avgDuration')} value={`${Math.round(dashboardData.overview.avgSessionDuration)}s`} color="bg-pink-50 text-pink-600" />
             <StatCard icon={TrendingUp} title={t('googleAnalytics.metrics.engagementRate')} value={`${dashboardData.overview.engagementRate}%`} color="bg-cyan-50 text-cyan-600" />
          </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Over Time */}
          {dashboardData?.trafficOverTime && (
             <Card className="lg:col-span-2">
                <CardHeader><CardTitle>{t('googleAnalytics.charts.trafficOverTime')}</CardTitle></CardHeader>
                <CardContent>
                   <div className="h-64 flex items-end gap-1">
                      {dashboardData.trafficOverTime.slice(-30).map((d, i) => {
                         const max = Math.max(...dashboardData.trafficOverTime.map(x => x.users)) || 1;
                         const h = (d.users / max) * 100;
                         return (
                            <div key={i} className="flex-1 flex flex-col justify-end group relative">
                               <div 
                                  className="bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600 min-h-[4px]" 
                                  style={{ height: `${h}%` }}
                               ></div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                  {d.date}: {d.users} users
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </CardContent>
             </Card>
          )}

          {/* Top Pages */}
          {dashboardData?.topPages && (
             <Card>
                <CardHeader><CardTitle>{t('googleAnalytics.tables.topPages')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader><TableRow><TableHead>{t('googleAnalytics.tables.page')}</TableHead><TableHead className="text-right">{t('googleAnalytics.tables.views')}</TableHead></TableRow></TableHeader>
                      <TableBody>
                         {dashboardData.topPages.slice(0, 8).map((p, i) => (
                            <TableRow key={i}>
                               <TableCell className="font-medium truncate max-w-[200px]" title={p.path}>{p.path}</TableCell>
                               <TableCell className="text-right">{p.pageViews.toLocaleString()}</TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}

          {/* Traffic Sources */}
          {dashboardData?.trafficSources && (
             <Card>
                <CardHeader><CardTitle>{t('googleAnalytics.tables.trafficSources')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader><TableRow><TableHead>{t('googleAnalytics.tables.source')}</TableHead><TableHead className="text-right">{t('googleAnalytics.tables.users')}</TableHead></TableRow></TableHeader>
                      <TableBody>
                         {dashboardData.trafficSources.slice(0, 8).map((s, i) => (
                            <TableRow key={i}>
                               <TableCell className="font-medium">{s.source}</TableCell>
                               <TableCell className="text-right">{s.users.toLocaleString()}</TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}

          {/* Devices & Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
             {dashboardData?.devices && (
                <Card>
                   <CardHeader><CardTitle>{t('googleAnalytics.tables.devices')}</CardTitle></CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {dashboardData.devices.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  {d.device === 'mobile' ? <Smartphone className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
                                  <span className="capitalize">{d.device}</span>
                               </div>
                               <span className="font-bold">{d.users.toLocaleString()}</span>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
             )}
             
             {dashboardData?.geographic && (
                <Card>
                   <CardHeader><CardTitle>{t('googleAnalytics.tables.locations')}</CardTitle></CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                         {dashboardData.geographic.slice(0, 5).map((g, i) => (
                            <div key={i} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>{g.country}</span>
                               </div>
                               <span className="font-bold">{g.users.toLocaleString()}</span>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
             )}
          </div>
       </div>
    </div>
  );
};

export default GoogleAnalyticsDashboard;
