import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { urlsAPI, analyticsAPI } from '../services/api';
import { getCurrentDomain, isSystemDomain } from '../utils/domainUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, MousePointer2, Link as LinkIcon, QrCode, Globe, ArrowUpRight, Copy, Edit, Trash2, Check, Zap, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [longUrl, setLongUrl] = useState('');
  const [customBackhalf, setCustomBackhalf] = useState('');
  const [campaign, setCampaign] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Last 7 days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    qrScans: 0,
    clickRate: 0,
    totalLinks: 0,
    totalCustomDomains: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, linkId: null, linkUrl: '' });
  const [editDialog, setEditDialog] = useState({ isOpen: false, link: null }); 
  const [copySuccess, setCopySuccess] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboardData();
    fetchAvailableDomains();
  }, [timeFilter]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}-\d{2}$/)) {
        const [year, month, day, hour] = dateStr.split('-');
        return `${hour}:00`;
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let period = timeFilter;
      const periodMap = {
        'Last 24 hours': '24h', 'Last 7 days': '7d', 'Last 30 days': '30d',
        'Last 90 days': '90d', 'Last 1 year': '1y',
        '24h': '24h', '7d': '7d', '30d': '30d', '90d': '90d', '1y': '1y'
      };
      if (periodMap[timeFilter]) period = periodMap[timeFilter];

      const analyticsResponse = await analyticsAPI.getOverview({ period });
      const data = analyticsResponse.data;
      const overviewData = data.overview || data.summary || data;

      const urlsResponse = await urlsAPI.getUrls();
      const urls = urlsResponse.data?.urls || [];
      const totalQRScans = urls.reduce((sum, url) => sum + (url.qrScanCount || 0), 0);

      const totalClicks = overviewData.totalClicks || data.totalClicks || overviewData.total || 0;
      const totalLinks = overviewData.totalUrls || data.totalUrls || overviewData.totalLinks || data.totalLinks || 0;
      let clickRate = 0;
      if (overviewData.clickThroughRate) {
        clickRate = parseFloat(overviewData.clickThroughRate);
      } else if (totalClicks > 0 && totalLinks > 0) {
        clickRate = ((totalClicks / totalLinks)).toFixed(1);
      }

      setStats({
        totalClicks,
        qrScans: totalQRScans,
        clickRate,
        totalLinks,
        totalCustomDomains: overviewData.totalCustomDomains || data.totalCustomDomains || 0
      });

      let clicksByDay = data.chartData?.clicksByDay || data.clickActivity || data.timeSeries || [];
      const transformedChartData = clicksByDay.map(item => ({
        date: item.date || item._id,
        label: formatDateLabel(item.date || item._id),
        clicks: item.clicks || item.totalClicks || 0,
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      setChartData(transformedChartData);
      setRecentLinks(urls.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await urlsAPI.getAvailableDomains();
      const domains = response.data?.domains || response.domains || [];
      setAvailableDomains(domains);
      const defaultDomain = domains.find(d => d.isDefault);
      if (defaultDomain) setSelectedDomainId(defaultDomain.id || defaultDomain._id);
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleShortenUrl = async (e) => {
    e.preventDefault();
    try {
      const response = await urlsAPI.createUrl({
        originalUrl: longUrl,
        customCode: customBackhalf || undefined,
        title: campaign || undefined,
        domainId: selectedDomainId || undefined,
      });

      if (response.success) {
        setLongUrl('');
        setCustomBackhalf('');
        setCampaign('');
        fetchDashboardData();
        navigate('/my-links');
      }
    } catch (err) {
      console.error('Error creating short link:', err);
      // Ideally use Toast here
      alert(err.message || 'Failed to create short link');
    }
  };

  const handleCopyLink = async (link) => {
    try {
      const shortUrl = getShortUrl(link);
      await navigator.clipboard.writeText(`https://${shortUrl}`);
      setCopySuccess(link.id || link._id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeleteClick = (link) => {
    setDeleteDialog({
      isOpen: true,
      linkId: link.id || link._id,
      linkUrl: getShortUrl(link)
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await urlsAPI.deleteUrl(deleteDialog.linkId);
      if (response.success || response.data) {
        await fetchDashboardData();
        setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      alert(err.message || 'Failed to delete link');
    }
  };

  const getShortUrl = (link) => {
    const currentDomain = getCurrentDomain();
    if (link.domain && !isSystemDomain(link.domain)) {
      return `${link.domain}/${link.shortCode}`;
    }
    return `${currentDomain}/${link.shortCode}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

    return (
    <div className="space-y-6">
      {/* Welcome & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                 <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard.welcome')}, {user?.name || 'User'}!</h1>
                 <p className="text-muted-foreground">{t('dashboard.welcomeMessage') || "Here's what's happening with your links."}</p>
             </div>
             <div className="flex items-center gap-2">
                 {/* Time Filter could go here or in Tabs */}
             </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalClicks')}</CardTitle>
                  <MousePointer2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.fromLastPeriod')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.activeLinks')}</CardTitle>
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLinks.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.qrScans')}</CardTitle>
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.qrScans.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalCustomDomains')}</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomDomains}</div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Chart Section */}
        <Card className="col-span-4 lg:col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{t('dashboard.analytics.clickActivity')}</CardTitle>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="text-sm border rounded p-1 bg-transparent"
                    >
                        <option value="Last 7 days">{t('dashboard.timeFilters.7days')}</option>
                        <option value="Last 30 days">{t('dashboard.timeFilters.30days')}</option>
                        <option value="Last 90 days">{t('dashboard.timeFilters.90days')}</option>
                    </select>
                </div>
                <CardDescription>{t('dashboard.chartDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="label" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="clicks" 
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorClicks)" 
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Create Link Section */}
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>{t('dashboard.shortenYourURL')}</CardTitle>
                <CardDescription>{t('dashboard.createLinkDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleShortenUrl} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="longUrl">{t('dashboard.longURL')}</Label>
                        <Input
                            id="longUrl"
                            placeholder={t('dashboard.longURLPlaceholderExample')}
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            required
                        />
                    </div>
                    
                    {availableDomains.length > 0 && (
                        <div className="space-y-2">
                           <Label htmlFor="domain">{t('dashboard.domain')}</Label>
                           <div className="relative">
                               <select
                                   id="domain"
                                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                   value={selectedDomainId}
                                   onChange={(e) => setSelectedDomainId(e.target.value)}
                                   disabled={loadingDomains}
                               >
                                  {availableDomains.map(d => (
                                      <option key={d.id} value={d.id}>{d.fullDomain}</option>
                                  ))}
                               </select>
                           </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customBackhalf">{t('dashboard.customBackhalf')}</Label>
                            <Input
                                id="customBackhalf"
                                placeholder={t('dashboard.customBackhalfPlaceholderExample')}
                                value={customBackhalf}
                                onChange={(e) => setCustomBackhalf(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="campaign">{t('dashboard.campaign')}</Label>
                            <Input
                                id="campaign"
                                placeholder={t('dashboard.campaignPlaceholderExample')}
                                value={campaign}
                                onChange={(e) => setCampaign(e.target.value)}
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button onClick={handleShortenUrl} className="w-full" disabled={!longUrl}>
                   <Zap className="mr-2 h-4 w-4" />
                   {t('dashboard.shortenURL')}
                </Button>
            </CardFooter>
        </Card>
      </div>

      {/* Recent Links */}
      <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle>{t('dashboard.recentLinks.title')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate('/my-links')}>
                      {t('dashboard.recentLinks.viewAll')} <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
              </div>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>{t('dashboard.recentLinks.shortLink')}</TableHead>
                          <TableHead className="hidden md:table-cell">{t('dashboard.recentLinks.originalUrl')}</TableHead>
                          <TableHead className="hidden sm:table-cell">{t('dashboard.recentLinks.date')}</TableHead>
                          <TableHead>{t('dashboard.recentLinks.clicks')}</TableHead>
                          <TableHead className="text-right">{t('dashboard.recentLinks.actions')}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {recentLinks.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                  {t('dashboard.recentLinks.noLinksYet')}
                              </TableCell>
                          </TableRow>
                      ) : (
                          recentLinks.map((link) => (
                              <TableRow key={link.id || link._id}>
                                  <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                          <span className="text-primary truncate max-w-[150px]">
                                              {getShortUrl(link)}
                                          </span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                      <div className="truncate max-w-[200px] text-muted-foreground" title={link.originalUrl}>
                                          {link.originalUrl}
                                      </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                                      {formatDate(link.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex items-center gap-1">
                                          <Activity className="h-3 w-3 text-muted-foreground" />
                                          {link.clicks || 0}
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                          <Button variant="ghost" size="icon" onClick={() => handleCopyLink(link)}>
                                              {copySuccess === (link.id || link._id) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => navigate(`/analytics/${link.id || link._id}`)}>
                                              <BarChart3 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      
       {/* Delete Confirmation Dialog */}
       <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ ...deleteDialog, isOpen: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('dashboard.deleteDialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('dashboard.deleteDialog.confirmMessage')} {deleteDialog.linkUrl}? {t('dashboard.deleteDialog.cannotUndo')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}>{t('common.cancel')}</Button>
                    <Button variant="destructive" onClick={handleConfirmDelete}>{t('common.delete')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
};

export default Dashboard;