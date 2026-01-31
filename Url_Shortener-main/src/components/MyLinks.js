import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { urlsAPI, qrCodeAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { getCurrentDomain, getShortUrlWithProtocol, isSystemDomain } from '../utils/domainUtils';
import { 
  Copy, Trash2, BarChart3, QrCode, Search, Plus, Filter, ArrowUpRight, 
  ExternalLink, Calendar, MoreHorizontal, Check, Link as LinkIcon,
  List, Grid, Eye, Download, Share2, Settings, ChevronDown, Globe,
  MousePointer, Smartphone, Monitor, MapPin, TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

// Reserved aliases (kept simpler for brevity, ideally imported)
const RESERVED_ALIASES = ['admin', 'dashboard', 'login', 'register', 'api'];

const MyLinks = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  
  // State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View Mode State
  const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'detailed'
  const [selectedLink, setSelectedLink] = useState(null);
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [generateQR, setGenerateQR] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [customCodeError, setCustomCodeError] = useState('');

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, linkId: null, linkUrl: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Other
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchLinks();
    fetchAvailableDomains();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await urlsAPI.list({ page: 1, limit: 100 });
      const linksData = response.data?.urls || response.data?.data?.urls || [];
      setLinks(linksData);
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', message: t('errors.failedToLoadLinks') });
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
      console.error('Failed to fetch domains', err);
    } finally {
      setLoadingDomains(false);
    }
  };

  const validateUrl = (url) => {
    if (!url || !url.trim()) return { valid: false, error: t('createLink.errors.urlRequired') };
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) return { valid: false, error: t('createLink.errors.invalidUrl') };
      return { valid: true };
    } catch {
      return { valid: false, error: t('createLink.errors.invalidUrl') };
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setUrlError(''); setCustomCodeError('');

    const urlValidation = validateUrl(longUrl);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error);
      setCreateLoading(false);
      return;
    }

    try {
      const response = await urlsAPI.createUrl({
        originalUrl: longUrl,
        customCode: customName || undefined,
        title: customName || undefined,
        domainId: selectedDomainId || undefined,
      });

      if (response.success && response.data?.url) {
        const createdUrl = response.data.url;
        
        if (generateQR && (createdUrl._id || createdUrl.id)) {
           await qrCodeAPI.generate(createdUrl._id || createdUrl.id, { size: 300, format: 'png' }).catch(console.error);
        }

        await fetchLinks();
        setIsCreateOpen(false);
        setLongUrl(''); setCustomName(''); setGenerateQR(false);
        setToast({ type: 'success', message: t('createLink.success.created') });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || t('createLink.errors.general');
      if (errorMsg.includes('alias')) setCustomCodeError(errorMsg);
      else setUrlError(errorMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await urlsAPI.delete(deleteDialog.linkId);
      setLinks(links.filter(l => (l.id || l._id) !== deleteDialog.linkId));
      setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
      setToast({ type: 'success', message: t('myLinks.deleteSuccess') });
    } catch (err) {
      setToast({ type: 'error', message: t('errors.generic') });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopy = async (link) => {
    try {
      const url = getShortUrlWithProtocol(link);
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id || link._id);
      setTimeout(() => setCopiedId(null), 2000);
      setToast({ type: 'success', message: t('myLinks.copiedToClipboard') });
    } catch {
      setToast({ type: 'error', message: t('myLinks.failedToCopy') });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredLinks = links.filter(link => 
    link.shortCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    link.originalUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple View Component
  const SimpleView = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('common.search') || "Search links..."} 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('myLinks.table.shortLink')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('myLinks.table.originalUrl')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('myLinks.table.created')}</TableHead>
              <TableHead>{t('myLinks.table.clicks')}</TableHead>
              <TableHead className="text-right">{t('myLinks.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">{t('myLinks.emptyState.loading')}</TableCell></TableRow>
            ) : filteredLinks.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('myLinks.emptyState.noLinks')}</TableCell></TableRow>
            ) : (
              filteredLinks.map(link => (
                <TableRow key={link.id || link._id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-primary flex items-center gap-2">
                        {link.domain && !isSystemDomain(link.domain) ? `${link.domain}/${link.shortCode}` : `${getCurrentDomain()}/${link.shortCode}`}
                      </span>
                      {link.title && <span className="text-xs text-muted-foreground">{link.title}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="truncate max-w-[250px] text-muted-foreground text-sm" title={link.originalUrl}>
                      {link.originalUrl}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> {formatDate(link.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {link.clicks || link.clickCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(link)}>
                        {copiedId === (link.id || link._id) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/analytics/${link.id || link._id}`)}>
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('myLinks.actions.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleCopy(link)}>
                            <Copy className="mr-2 h-4 w-4" /> {t('myLinks.actions.copyLink')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/qr-codes`)}>
                            <QrCode className="mr-2 h-4 w-4" /> {t('myLinks.actions.qrCode')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setDeleteDialog({ 
                                isOpen: true, 
                                linkId: link.id || link._id, 
                                linkUrl: `${getCurrentDomain()}/${link.shortCode}` 
                              });
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> {t('myLinks.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Detailed View Component
  const DetailedView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar - Links List */}
      <div className="lg:col-span-4 xl:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('myLinks.searchLinks')} 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">{t('myLinks.emptyState.loading')}</div>
              ) : filteredLinks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">{t('myLinks.emptyState.noLinks')}</div>
              ) : (
                filteredLinks.map(link => (
                  <div
                    key={link.id || link._id}
                    onClick={() => setSelectedLink(link)}
                    className={cn(
                      "p-4 border-b cursor-pointer transition-colors hover:bg-slate-50",
                      selectedLink?.id === link.id || selectedLink?._id === link._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-blue-600">
                          {link.domain && !isSystemDomain(link.domain) ? `${link.domain}/${link.shortCode}` : `${getCurrentDomain()}/${link.shortCode}`}
                        </div>
                        {link.title && (
                          <div className="text-xs text-slate-600 mt-1 truncate">{link.title}</div>
                        )}
                        <div className="text-xs text-slate-400 mt-1 truncate">{link.originalUrl}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {link.clicks || link.clickCount || 0}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Link Details */}
      <div className="lg:col-span-8 xl:col-span-9">
        {selectedLink ? (
          <div className="space-y-6">
            {/* Link Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                      <h2 className="text-xl font-semibold text-slate-900">
                        {selectedLink.domain && !isSystemDomain(selectedLink.domain) 
                          ? `${selectedLink.domain}/${selectedLink.shortCode}` 
                          : `${getCurrentDomain()}/${selectedLink.shortCode}`}
                      </h2>
                    </div>
                    <a 
                      href={selectedLink.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {selectedLink.originalUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleCopy(selectedLink)}>
                      {copiedId === (selectedLink.id || selectedLink._id) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeleteDialog({ 
                          isOpen: true, 
                          linkId: selectedLink.id || selectedLink._id, 
                          linkUrl: `${getCurrentDomain()}/${selectedLink.shortCode}` 
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(selectedLink.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointer className="h-4 w-4" />
                    <span>{selectedLink.clicks || selectedLink.clickCount || 0} clicks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t('myLinks.performance.title')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/analytics/${selectedLink.id || selectedLink._id}`)}>
                    {t('myLinks.performance.viewFullReport')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                      <MousePointer className="h-4 w-4" />
                      <span>{t('myLinks.performance.totalClicks')}</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedLink.clicks || selectedLink.clickCount || 0}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                      <Globe className="h-4 w-4" />
                      <span>{t('myLinks.performance.allClicks')}</span>
                    </div>
                    <div className="text-2xl font-bold">{selectedLink.clicks || selectedLink.clickCount || 0}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{t('myLinks.performance.ctr')}</span>
                    </div>
                    <div className="text-2xl font-bold">-</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>{t('myLinks.performance.lastClick')}</span>
                    </div>
                    <div className="text-sm font-medium">-</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Link Preview & QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {t('myLinks.linkPreview.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <Globe className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">{t('myLinks.linkPreview.notAvailable')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {t('myLinks.actions.qrCode')}
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      {t('common.download')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <QrCode className="h-24 w-24 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">{t('myLinks.actions.qrCode')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimize Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('myLinks.optimize.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <details className="group">
                  <summary className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <span className="font-medium text-sm">{t('myLinks.optimize.utmBuilder')}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 p-3 border rounded-lg text-sm text-slate-600">
                    {t('myLinks.optimize.utmDescription')}
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <span className="font-medium text-sm">{t('myLinks.optimize.trafficRouting')}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 p-3 border rounded-lg text-sm text-slate-600">
                    {t('myLinks.optimize.trafficDescription')}
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <span className="font-medium text-sm">{t('myLinks.optimize.deepLinks')}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 p-3 border rounded-lg text-sm text-slate-600">
                    {t('myLinks.optimize.deepLinksDescription')}
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <span className="font-medium text-sm">{t('myLinks.optimize.retargeting')}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 p-3 border rounded-lg text-sm text-slate-600">
                    {t('myLinks.optimize.retargetingDescription')}
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <LinkIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{t('myLinks.emptyState.selectLink')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('myLinks.title')}</h1>
          <p className="text-muted-foreground">{t('myLinks.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button 
              variant={viewMode === 'simple' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('simple')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              {t('myLinks.viewModes.simple')}
            </Button>
            <Button 
              variant={viewMode === 'detailed' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('detailed')}
              className="h-8"
            >
              <Grid className="h-4 w-4 mr-1" />
              {t('myLinks.viewModes.detailed')}
            </Button>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> {t('dashboard.createShortLink')}
          </Button>
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === 'simple' ? <SimpleView /> : <DetailedView />}

      {/* Create Link Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
         <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
               <DialogTitle>{t('dashboard.createShortLink')}</DialogTitle>
               <DialogDescription>{t('dashboard.createShortLinkDesc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label htmlFor="longUrl">{t('dashboard.longURL')}</Label>
                  <Input 
                     id="longUrl" 
                     placeholder="https://example.com/very-long-url" 
                     value={longUrl} 
                     onChange={(e) => setLongUrl(e.target.value)}
                     className={urlError ? "border-red-500" : ""}
                  />
                  {urlError && <p className="text-xs text-red-500">{urlError}</p>}
               </div>
               
               <div className="space-y-2">
                  <Label htmlFor="domain">{t('myLinks.dialogs.createLink.domain')}</Label>
                  <select 
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     value={selectedDomainId}
                     onChange={(e) => setSelectedDomainId(e.target.value)}
                  >
                     {availableDomains.map(d => (
                        <option key={d.id} value={d.id}>{d.fullDomain}</option>
                     ))}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label htmlFor="customName">{t('myLinks.dialogs.createLink.customAlias')}</Label>
                     <Input 
                        id="customName" 
                        placeholder="my-link" 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className={customCodeError ? "border-red-500" : ""}
                     />
                     {customCodeError && <p className="text-xs text-red-500">{customCodeError}</p>}
                  </div>
                  <div className="flex items-end pb-2">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={generateQR}
                           onChange={(e) => setGenerateQR(e.target.checked)}
                           className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{t('myLinks.dialogs.createLink.generateQR')}</span>
                     </label>
                  </div>
               </div>
               
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createLoading}>
                     {createLoading ? t('myLinks.dialogs.createLink.creating') : t('myLinks.dialogs.createLink.createButton')}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{t('myLinks.dialogs.deleteLink.title')}</DialogTitle>
               <DialogDescription>
                  {t('myLinks.dialogs.deleteLink.message', { url: deleteDialog.linkUrl })}
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button variant="outline" onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>{t('common.cancel')}</Button>
               <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? t('common.delete') + '...' : t('common.delete')}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyLinks;
