import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI, userManagementAPI } from '../services/api';
import Toast from './Toast';
import { 
  User, Shield, CheckCircle2, XCircle, MoreHorizontal, Search, Trash2, Edit,
  Mail, Calendar, Activity, UserCheck, UserX, Crown, Grid, List, Filter,
  ChevronDown, Eye, Lock, Unlock, AlertCircle, TrendingUp, Users, MapPin, Globe
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/Dialog';
import { cn } from '../lib/utils';

const UserManagement = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasRole } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    if (hasRole(['admin', 'super_admin'])) {
      loadUsers();
      loadStats();
    }
  }, [hasRole]);

  useEffect(() => {
     const delayData = setTimeout(() => {
        if (hasRole(['admin', 'super_admin'])) loadUsers();
     }, 500);
     return () => clearTimeout(delayData);
  }, [searchTerm, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (searchTerm) params.search = searchTerm;
      if (filter !== 'all') params.role = filter;
      
      const response = await rolesAPI.getUsersWithRoles(params);
      if (response.success) setUsers(response.data.users);
    } catch (err) {
      setToast({ type: 'error', message: t('userManagement.messages.failedToLoad') });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userManagementAPI.getUserStats();
      if (response.success) setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
     if(!window.confirm(t('userManagement.messages.confirmRoleChange', { role: newRole }))) return;
     try {
        await rolesAPI.updateUserRole(userId, newRole);
        setToast({ type: 'success', message: t('userManagement.messages.roleUpdated') });
        loadUsers();
     } catch (err) {
        setToast({ type: 'error', message: t('userManagement.messages.failedToUpdateRole') });
     }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
     const action = currentStatus ? 'deactivate' : 'activate';
     if(!window.confirm(t('userManagement.messages.confirmStatusChange', { action }))) return;
     try {
        await userManagementAPI.updateUserStatus(userId, { isActive: !currentStatus });
        setToast({ type: 'success', message: t(`userManagement.messages.userStatusUpdated.${action}`) });
        loadUsers();
        loadStats();
     } catch (err) {
        setToast({ type: 'error', message: t('userManagement.messages.failedToUpdateStatus') });
     }
  };

  const handleDeleteUser = async (userId) => {
     if(!window.confirm(t('userManagement.messages.confirmDelete'))) return;
     try {
        await userManagementAPI.deleteUser(userId);
        setToast({ type: 'success', message: t('userManagement.messages.userDeleted') });
        loadUsers();
        loadStats();
     } catch (err) {
        setToast({ type: 'error', message: t('userManagement.messages.failedToDelete') });
     }
  };

  if (!hasRole(['admin', 'super_admin'])) return null;

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map(user => (
        <Card key={user._id} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('userManagement.actions.title')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowUserDetails(true); }}>
                    <Eye className="mr-2 h-4 w-4" /> {t('userManagement.actions.view')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}>
                    <Shield className="mr-2 h-4 w-4" /> {user.role === 'admin' ? t('userManagement.actions.removeAdmin') : t('userManagement.actions.makeAdmin')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusToggle(user._id, user.isActive)}>
                    {user.isActive ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                    {user.isActive ? t('userManagement.actions.deactivate') : t('userManagement.actions.activate')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user._id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> {t('userManagement.actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('userManagement.table.role')}</span>
                <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                  {user.role === 'super_admin' && <Crown className="h-3 w-3" />}
                  {user.role === 'admin' && <Shield className="h-3 w-3" />}
                  {user.role}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('userManagement.table.status')}</span>
                {user.isActive ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t('userManagement.userCard.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {t('userManagement.userCard.inactive')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('userManagement.userCard.joined')} {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('userManagement.table.name')}</TableHead>
          <TableHead>{t('userManagement.table.role')}</TableHead>
          <TableHead>{t('userManagement.table.status')}</TableHead>
          <TableHead>{t('userManagement.table.joined')}</TableHead>
          <TableHead className="text-right">{t('userManagement.table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={5} className="text-center py-8">{t('userManagement.loading')}</TableCell></TableRow>
        ) : users.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('userManagement.noUsersFound')}</TableCell></TableRow>
        ) : (
          users.map(user => (
            <TableRow key={user._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                  {user.role === 'super_admin' && <Crown className="h-3 w-3" />}
                  {user.role === 'admin' && <Shield className="h-3 w-3" />}
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{t('userManagement.userCard.active')}</Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{t('userManagement.userCard.inactive')}</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('userManagement.actions.title')}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowUserDetails(true); }}>
                      <Eye className="mr-2 h-4 w-4" /> {t('userManagement.actions.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}>
                      <Shield className="mr-2 h-4 w-4" /> {user.role === 'admin' ? t('userManagement.actions.removeAdmin') : t('userManagement.actions.makeAdmin')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusToggle(user._id, user.isActive)}>
                      {user.isActive ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                      {user.isActive ? t('userManagement.actions.deactivate') : t('userManagement.actions.activate')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user._id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> {t('userManagement.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
       {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold text-slate-900">{t('userManagement.title')}</h1>
             <p className="text-muted-foreground">{t('userManagement.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <Grid className="h-4 w-4 mr-1" />
                {t('userManagement.viewMode.grid')}
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <List className="h-4 w-4 mr-1" />
                {t('userManagement.viewMode.table')}
              </Button>
            </div>
          </div>
       </div>

       {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.totalUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-green-50 text-green-600 rounded-lg"><UserCheck className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.activeUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.activeUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-red-50 text-red-600 rounded-lg"><UserX className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.inactiveUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.inactiveUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.newUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.recentSignups}</h3>
                   </div>
                </CardContent>
             </Card>
          </div>
       )}

       <Card>
          <CardHeader className="pb-3">
             <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder={t('userManagement.searchPlaceholder')}
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <div className="flex gap-2">
                   {['all', 'admin', 'user'].map(role => (
                      <Button 
                         key={role} 
                         variant={filter === role ? 'default' : 'outline'} 
                         size="sm"
                         onClick={() => setFilter(role)}
                         className="capitalize"
                      >
                         {role === 'all' && <Filter className="h-3 w-3 mr-1" />}
                         {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                         {role === 'user' && <User className="h-3 w-3 mr-1" />}
                         {role}
                      </Button>
                   ))}
                </div>
             </div>
          </CardHeader>
          <CardContent>
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
             ) : viewMode === 'grid' ? <GridView /> : <TableView />}
          </CardContent>
       </Card>

       {/* User Details Modal */}
       <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{t('userManagement.modal.title')}</DialogTitle>
             <DialogDescription>{t('userManagement.modal.description')}</DialogDescription>
           </DialogHeader>
           {selectedUser && (
             <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                 <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                   {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                 </div>
                 <div className="flex-1">
                   <h3 className="text-xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                   <p className="text-sm text-muted-foreground flex items-center gap-1">
                     <Mail className="h-3 w-3" />
                     {selectedUser.email}
                   </p>
                   <div className="flex gap-2 mt-2">
                     <Badge variant={selectedUser.role === 'admin' || selectedUser.role === 'super_admin' ? 'default' : 'secondary'}>
                       {selectedUser.role}
                     </Badge>
                     {selectedUser.isActive ? (
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('userManagement.userCard.active')}</Badge>
                     ) : (
                       <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{t('userManagement.userCard.inactive')}</Badge>
                     )}
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <h4 className="text-sm font-medium text-muted-foreground">{t('userManagement.modal.accountCreated')}</h4>
                   <p className="text-sm flex items-center gap-1">
                     <Calendar className="h-3 w-3" />
                     {new Date(selectedUser.createdAt).toLocaleDateString()}
                   </p>
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-sm font-medium text-muted-foreground">{t('userManagement.modal.lastUpdated')}</h4>
                   <p className="text-sm flex items-center gap-1">
                     <Activity className="h-3 w-3" />
                     {new Date(selectedUser.updatedAt).toLocaleDateString()}
                   </p>
                 </div>
               </div>

               {/* Location Information */}
               {selectedUser.registrationLocation && (
                 <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                     <MapPin className="h-4 w-4" />
                     {t('userManagement.modal.registrationLocation')}
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {selectedUser.registrationLocation.country && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.country')}</p>
                         <p className="text-sm text-blue-900 flex items-center gap-1">
                           <Globe className="h-3 w-3" />
                           {selectedUser.registrationLocation.country}
                         </p>
                       </div>
                     )}
                     {selectedUser.registrationLocation.city && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.city')}</p>
                         <p className="text-sm text-blue-900 flex items-center gap-1">
                           <MapPin className="h-3 w-3" />
                           {selectedUser.registrationLocation.city}
                         </p>
                       </div>
                     )}
                     {selectedUser.registrationLocation.region && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.region')}</p>
                         <p className="text-sm text-blue-900">{selectedUser.registrationLocation.region}</p>
                       </div>
                     )}
                     {selectedUser.registrationLocation.ip && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.ipAddress')}</p>
                         <p className="text-sm text-blue-900 font-mono">{selectedUser.registrationLocation.ip}</p>
                       </div>
                     )}
                     {selectedUser.registrationLocation.timezone && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.timezone')}</p>
                         <p className="text-sm text-blue-900">{selectedUser.registrationLocation.timezone}</p>
                       </div>
                     )}
                     {selectedUser.registrationLocation.countryCode && (
                       <div className="space-y-1">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.countryCode')}</p>
                         <p className="text-sm text-blue-900 font-mono">{selectedUser.registrationLocation.countryCode}</p>
                       </div>
                     )}
                     {(selectedUser.registrationLocation.latitude && selectedUser.registrationLocation.longitude) && (
                       <div className="space-y-1 md:col-span-2">
                         <p className="text-xs text-blue-700 font-medium">{t('userManagement.modal.coordinates')}</p>
                         <p className="text-sm text-blue-900 font-mono">
                           {selectedUser.registrationLocation.latitude}, {selectedUser.registrationLocation.longitude}
                         </p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Additional User Stats */}
               {(selectedUser.urlCount || selectedUser.totalClicks || selectedUser.lastLogin) && (
                 <div className="grid grid-cols-3 gap-4">
                   {selectedUser.urlCount !== undefined && (
                     <div className="p-3 bg-slate-50 rounded-lg text-center">
                       <div className="text-2xl font-bold text-slate-900">{selectedUser.urlCount || 0}</div>
                       <div className="text-xs text-muted-foreground">{t('userManagement.modal.urlsCreated')}</div>
                     </div>
                   )}
                   {selectedUser.totalClicks !== undefined && (
                     <div className="p-3 bg-slate-50 rounded-lg text-center">
                       <div className="text-2xl font-bold text-slate-900">{selectedUser.totalClicks || 0}</div>
                       <div className="text-xs text-muted-foreground">{t('userManagement.modal.totalClicks')}</div>
                     </div>
                   )}
                   {selectedUser.lastLogin && (
                     <div className="p-3 bg-slate-50 rounded-lg text-center">
                       <div className="text-sm font-bold text-slate-900">{new Date(selectedUser.lastLogin).toLocaleDateString()}</div>
                       <div className="text-xs text-muted-foreground">{t('userManagement.modal.lastLogin')}</div>
                     </div>
                   )}
                 </div>
               )}

               <div className="flex gap-2 justify-end pt-4 border-t">
                 <Button variant="outline" onClick={() => setShowUserDetails(false)}>{t('userManagement.modal.close')}</Button>
                 <Button 
                   variant={selectedUser.isActive ? "destructive" : "default"}
                   onClick={() => { 
                     handleStatusToggle(selectedUser._id, selectedUser.isActive); 
                     setShowUserDetails(false); 
                   }}
                 >
                   {selectedUser.isActive ? t('userManagement.modal.deactivateUser') : t('userManagement.modal.activateUser')}
                 </Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
    </div>
  );
};

export default UserManagement;
