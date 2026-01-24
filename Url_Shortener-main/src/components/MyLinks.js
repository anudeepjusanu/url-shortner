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
  ExternalLink, Calendar, MoreHorizontal, Check, Link as LinkIcon 
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
      setToast({ type: 'success', message: 'Copied to clipboard' });
    } catch {
      setToast({ type: 'error', message: 'Failed to copy' });
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

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('myLinks.title')}</h1>
          <p className="text-muted-foreground">{t('myLinks.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> {t('dashboard.createShortLink')}
        </Button>
      </div>

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
              {/* <Button variant="outline" size="icon">
                 <Filter className="h-4 w-4" />
              </Button> */}
           </div>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                 <TableRow>
                    <TableHead>Short Link</TableHead>
                    <TableHead className="hidden md:table-cell">Original URL</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                 ) : filteredLinks.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No links found.</TableCell></TableRow>
                 ) : (
                    filteredLinks.map(link => (
                       <TableRow key={link.id || link._id}>
                          <TableCell>
                             <div className="flex flex-col gap-1">
                                <span className="font-medium text-primary flex items-center gap-2">
                                   {link.domain && !isSystemDomain(link.domain) ? `${link.domain}/${link.shortCode}` : `${getCurrentDomain()}/${link.shortCode}`}
                                   {/* <ExternalLink className="h-3 w-3 opacity-50" /> */}
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
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleCopy(link)}>
                                         <Copy className="mr-2 h-4 w-4" /> Copy Link
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigate(`/qr-codes`)}>
                                         <QrCode className="mr-2 h-4 w-4" /> QR Code
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
                                         <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                  <Label htmlFor="domain">Domain</Label>
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
                     <Label htmlFor="customName">Custom Alias (Optional)</Label>
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
                        <span className="text-sm font-medium">Generate QR Code</span>
                     </label>
                  </div>
               </div>
               
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoading}>
                     {createLoading ? 'Creating...' : 'Create Link'}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Delete Link</DialogTitle>
               <DialogDescription>
                  Are you sure you want to delete {deleteDialog.linkUrl}? This action cannot be undone.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button variant="outline" onClick={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
               <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting...' : 'Delete'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyLinks;
