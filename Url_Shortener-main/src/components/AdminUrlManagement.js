import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { adminAPI } from '../services/api';
import Toast from './Toast';
import { Link as LinkIcon, ExternalLink, User, Calendar, MousePointer2, Settings, Trash2, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { cn } from '../lib/utils';

const AdminUrlManagement = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasRole } = usePermissions();
  
  const [urls, setUrls] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showUrlDetails, setShowUrlDetails] = useState(false);
  const [stats, setStats] = useState(null);

  const loadUrls = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: searchTerm || undefined,
        isActive: statusFilter !== 'all' ? (statusFilter === 'active') : undefined,
        creator: selectedUser || undefined
      };

      const response = await adminAPI.getAllUrls(params);
      if (response.success) {
        setUrls(response.data.urls);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load URLs' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, selectedUser]);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ limit: 100 });
      if (response.success) setUsers(response.data.users);
    } catch (err) { console.error(err); }
  };

  const loadStats = async () => {
    try {
       const response = await adminAPI.getSystemStats();
       if (response.success) setStats(response.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
       loadUsers();
       loadStats();
    }
  }, [hasRole]);

  useEffect(() => {
     if (hasRole(['admin', 'super_admin'])) {
        const delay = setTimeout(loadUrls, 500);
        return () => clearTimeout(delay);
     }
  }, [loadUrls, hasRole, searchTerm, statusFilter, selectedUser]);

  const handleToggleStatus = async (urlId, currentStatus) => {
     try {
        await adminAPI.updateUrl(urlId, { isActive: !currentStatus });
        setToast({ type: 'success', message: currentStatus ? 'URL Deactivated' : 'URL Activated' });
        loadUrls();
     } catch (err) {
        setToast({ type: 'error', message: 'Failed to update status' });
     }
  };

  const handleDeleteUrl = async (urlId) => {
     if(!window.confirm("Delete this URL? This cannot be undone.")) return;
     try {
        await adminAPI.deleteUrl(urlId);
        setToast({ type: 'success', message: 'URL Deleted' });
        loadUrls();
        setShowUrlDetails(false);
     } catch (err) {
        setToast({ type: 'error', message: 'Failed to delete URL' });
     }
  };

  if (!hasRole(['admin', 'super_admin'])) return null;

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('adminUrlManagement.title')}</h1>
          <p className="text-muted-foreground">{t('adminUrlManagement.subtitle')}</p>
        </div>
      </div>

      {stats && (
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
               <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><LinkIcon className="h-6 w-6" /></div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.stats.totalUrls')}</p>
                     <h3 className="text-2xl font-bold">{stats.overview?.totalUrls?.toLocaleString() || 0}</h3>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><MousePointer2 className="h-6 w-6" /></div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.stats.totalClicks')}</p>
                     <h3 className="text-2xl font-bold">{stats.overview?.totalClicks?.toLocaleString() || 0}</h3>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Calendar className="h-6 w-6" /></div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.stats.newUrls30d')}</p>
                     <h3 className="text-2xl font-bold">{stats.growth?.newUrlsLast30Days?.toLocaleString() || 0}</h3>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><User className="h-6 w-6" /></div>
                  <div>
                     <p className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.stats.totalUsers')}</p>
                     <h3 className="text-2xl font-bold">{stats.overview?.totalUsers?.toLocaleString() || 0}</h3>
                  </div>
               </CardContent>
            </Card>
         </div>
      )}

      <Card>
         <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
               <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder={t('adminUrlManagement.filters.searchPlaceholder')}
                      className="pl-9"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex gap-2">
                   <select 
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                   >
                      <option value="all">{t('adminUrlManagement.filters.allStatus')}</option>
                      <option value="active">{t('adminUrlManagement.filters.active')}</option>
                      <option value="inactive">{t('adminUrlManagement.filters.inactive')}</option>
                   </select>
                   <select 
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[200px]"
                      value={selectedUser}
                      onChange={e => setSelectedUser(e.target.value)}
                   >
                      <option value="">{t('adminUrlManagement.filters.allUsers')}</option>
                      {users.map(u => (
                         <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                      ))}
                   </select>
               </div>
            </div>
         </CardHeader>
         <CardContent>
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>{t('adminUrlManagement.table.shortCode')}</TableHead>
                     <TableHead className="hidden md:table-cell">{t('adminUrlManagement.table.originalUrl')}</TableHead>
                     <TableHead>{t('adminUrlManagement.table.creator')}</TableHead>
                     <TableHead>{t('adminUrlManagement.table.clicks')}</TableHead>
                     <TableHead>{t('adminUrlManagement.table.status')}</TableHead>
                     <TableHead className="text-right">{t('adminUrlManagement.table.actions')}</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : urls.length === 0 ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('adminUrlManagement.noUrls')}</TableCell></TableRow>
                  ) : (
                     urls.map(url => (
                        <TableRow key={url._id}>
                           <TableCell className="font-medium">
                              <a href={`https://snip.sa/${url.shortCode}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                 {url.shortCode} <ExternalLink className="h-3 w-3" />
                              </a>
                           </TableCell>
                           <TableCell className="hidden md:table-cell">
                              <div className="truncate max-w-[200px] text-muted-foreground text-sm" title={url.originalUrl}>
                                 {url.originalUrl}
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col text-sm">
                                 <span className="font-medium">{url.creator?.firstName} {url.creator?.lastName}</span>
                                 <span className="text-xs text-muted-foreground">{url.creator?.email}</span>
                              </div>
                           </TableCell>
                           <TableCell>{url.clickCount?.toLocaleString() || 0}</TableCell>
                           <TableCell>
                              {url.isActive ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                               ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Inactive</Badge>
                               )}
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedUrl(url); setShowUrlDetails(true); }}>
                                    {t('adminUrlManagement.actions.view')}
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(url._id, url.isActive)}>
                                    {url.isActive ? <XCircle className="h-4 w-4 text-orange-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteUrl(url._id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {pagination.pages > 1 && (
               <div className="flex items-center justify-between mt-4">
                  <Button 
                     variant="outline" 
                     onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
                     disabled={pagination.page === 1}
                  >
                     Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                     Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button 
                     variant="outline" 
                     onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                     disabled={pagination.page === pagination.pages}
                  >
                     Next
                  </Button>
               </div>
            )}
         </CardContent>
      </Card>

      {/* URL Details Modal */}
      <Dialog open={showUrlDetails} onOpenChange={setShowUrlDetails}>
         <DialogContent className="max-w-2xl">
            <DialogHeader>
               <DialogTitle>{t('adminUrlManagement.modal.title')}</DialogTitle>
               <DialogDescription>Detailed information about this URL.</DialogDescription>
            </DialogHeader>
            {selectedUrl && (
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.modal.shortCode')}</h4>
                        <p className="font-mono bg-slate-100 p-2 rounded-md">{selectedUrl.shortCode}</p>
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.modal.clicks')}</h4>
                        <p className="text-lg font-bold">{selectedUrl.clickCount?.toLocaleString() || 0}</p>
                     </div>
                     <div className="col-span-2 space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('adminUrlManagement.modal.originalUrl')}</h4>
                        <p className="break-all text-sm bg-slate-50 p-2 rounded border">{selectedUrl.originalUrl}</p>
                     </div>
                  </div>

                  <div className="border-t pt-4">
                     <h4 className="text-sm font-medium mb-3">{t('adminUrlManagement.modal.creatorInfo')}</h4>
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                           {selectedUrl.creator?.firstName?.[0]}
                        </div>
                        <div>
                           <p className="font-medium">{selectedUrl.creator?.firstName} {selectedUrl.creator?.lastName}</p>
                           <p className="text-sm text-muted-foreground">{selectedUrl.creator?.email}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                     <Button variant={selectedUrl.isActive ? "destructive" : "default"} onClick={() => { handleToggleStatus(selectedUrl._id, selectedUrl.isActive); setShowUrlDetails(false); }}>
                        {selectedUrl.isActive ? t('adminUrlManagement.modal.deactivateUrl') : t('adminUrlManagement.modal.activateUrl')}
                     </Button>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUrlManagement;
