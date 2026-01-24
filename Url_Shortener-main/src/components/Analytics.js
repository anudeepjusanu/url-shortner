import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { analyticsAPI, urlsAPI } from "../services/api";
import { usePermissions } from "../contexts/PermissionContext";
import { getCurrentDomain, getShortUrlWithProtocol, isSystemDomain } from "../utils/domainUtils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MousePointer2, QrCode, Globe, Clock, Smartphone, Monitor, Download, Link as LinkIcon, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { cn } from "../lib/utils";

const Analytics = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasPermission } = usePermissions();
  const { id } = useParams();
  const [timeFilter, setTimeFilter] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkData, setLinkData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchAnalyticsData();
    } else {
      fetchDashboardAnalytics();
    }
  }, [id, timeFilter]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsAPI.getUrlAnalytics(id, {
        period: timeFilter,
        groupBy: 'day'
      });

      const backendData = response.data;
      const recentClicks = backendData.recentClicks || backendData.clicks || [];
      
      const overviewTotals = {
        totalClicks: backendData.overview?.totalClicks || backendData.url?.clickCount || 0,
        uniqueClicks: backendData.overview?.uniqueClicks || backendData.url?.uniqueClickCount || 0,
        qrScans: backendData.url?.qrScanCount || backendData.overview?.qrScans || 0,
        averageTime: backendData.overview?.averageClicksPerDay ? `${backendData.overview.averageClicksPerDay}/day` : '0/day'
      };

      let timeSeries = backendData.timeSeries || backendData.clickActivity || backendData.activity || [];
      
      let clickActivity = timeSeries.map(item => ({
        label: formatDateLabel(item.date || item._id),
        date: item.date || item._id,
        clicks: item.clicks || item.totalClicks || 0,
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (clickActivity.length === 0 && overviewTotals.totalClicks > 0) {
         clickActivity = [{ label: 'Historical', date: new Date().toISOString(), clicks: overviewTotals.totalClicks }];
      }

      // Process Stats
      const processStats = (data, key, nameKey = '_id') => {
         return (data || []).map(item => ({
            name: item[nameKey]?.country || item[nameKey] || item.country || item.name || 'Unknown',
            value: item.count || item.clicks || 0
         })).sort((a, b) => b.value - a.value).slice(0, 5);
      };

      const topCountries = processStats(backendData.topStats?.countries, 'countries');
      const topDevices = processStats(backendData.topStats?.devices, 'devices', 'type');
      const topBrowsers = processStats(backendData.topStats?.browsers, 'browsers', 'browser');
      const topReferrers = processStats(backendData.topStats?.referrers, 'referrers', 'domain');

      setAnalyticsData({
        ...overviewTotals,
        clickActivity,
        topCountries,
        topDevices,
        topBrowsers,
        topReferrers,
        url: backendData.url || null
      });

      if (backendData.url) setLinkData(backendData.url);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const linksResponse = await urlsAPI.list({ page: 1, limit: 1 });
      const totalUrls = linksResponse.data?.total || 0;

      const response = await analyticsAPI.getOverview({ period: timeFilter });
      const backendData = response.data;
      const data = backendData.overview || backendData;

      let clickActivity = (backendData.chartData?.clicksByDay || []).map(item => ({
          date: item.date,
          label: formatDateLabel(item.date),
          clicks: item.clicks || 0
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      setAnalyticsData({
        totalClicks: data.totalClicks || 0,
        uniqueClicks: data.uniqueClicks || 0,
        qrScans: data.qrScans || 0,
        totalUrls: totalUrls,
        clickActivity,
        topCountries: (backendData.topStats?.countries || []).map(i => ({ name: i._id, value: i.count })).slice(0, 5),
        topDevices: (backendData.topStats?.devices || []).map(i => ({ name: i._id, value: i.count })).slice(0, 5),
        topBrowsers: (backendData.topStats?.browsers || []).map(i => ({ name: i._id, value: i.count })).slice(0, 5),
        topReferrers: (backendData.topStats?.referrers || []).map(i => ({ name: i._id, value: i.count })).slice(0, 5),
      });

    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
      if (!analyticsData) return;
      
      const csvContent = [
          ['Metric', 'Value'],
          ['Total Clicks', analyticsData.totalClicks],
          ['Unique Clicks', analyticsData.uniqueClicks],
          ['QR Scans', analyticsData.qrScans],
          [],
          ['Date', 'Clicks'],
          ...analyticsData.clickActivity.map(d => [d.date, d.clicks])
      ].map(e => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500 flex-col gap-2"><AlertCircle className="h-8 w-8" /><p>{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{id ? t('analytics.title') : t('dashboard.analytics.title')}</h1>
          <p className="text-muted-foreground">{id ? linkData?.originalUrl : t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
            <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
            </select>
            <Button variant="outline" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalClicks.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Clicks</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.uniqueClicks.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.qrScans.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Clicks/Day</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.averageTime || '0'}</div>
            </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="col-span-4">
        <CardHeader>
            <CardTitle>Click Performance</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analyticsData.clickActivity}>
                    <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Top Countries */}
         <Card>
            <CardHeader>
                <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analyticsData.topCountries.length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        ) : (
                            analyticsData.topCountries.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" /> {item.name}
                                    </TableCell>
                                    <TableCell className="text-right">{item.value}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>

         {/* Top Devices */}
         <Card>
            <CardHeader>
                <CardTitle>Top Devices</CardTitle>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.topDevices} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} interval={0} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
         {/* Top Browsers */}
         <Card>
            <CardHeader>
                <CardTitle>Browsers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Browser</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analyticsData.topBrowsers.length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        ) : (
                            analyticsData.topBrowsers.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.value}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>

         {/* Top Referrers */}
         <Card>
            <CardHeader>
                <CardTitle>Referrers</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analyticsData.topReferrers.length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        ) : (
                            analyticsData.topReferrers.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium truncate max-w-[150px]">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.value}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

export default Analytics;
