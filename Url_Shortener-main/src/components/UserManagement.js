import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { rolesAPI, userManagementAPI } from '../services/api';
import Toast from './Toast';
import { User, Shield, CheckCircle2, XCircle, MoreHorizontal, Search, Trash2, Edit } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
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
  const [viewMode, setViewMode] = useState('table');

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
      setToast({ type: 'error', message: 'Failed to load users' });
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
     if(!window.confirm(`Change role to ${newRole}?`)) return;
     try {
        await rolesAPI.updateUserRole(userId, newRole);
        setToast({ type: 'success', message: 'Role updated' });
        loadUsers();
     } catch (err) {
        setToast({ type: 'error', message: 'Failed to update role' });
     }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
     const action = currentStatus ? 'deactivate' : 'activate';
     if(!window.confirm(`Are you sure you want to ${action} this user?`)) return;
     try {
        await userManagementAPI.updateUserStatus(userId, { isActive: !currentStatus });
        setToast({ type: 'success', message: `User ${action}d` });
        loadUsers();
        loadStats();
     } catch (err) {
        setToast({ type: 'error', message: `Failed to ${action} user` });
     }
  };

  const handleDeleteUser = async (userId) => {
     if(!window.confirm("Delete this user? This cannot be undone.")) return;
     try {
        await userManagementAPI.deleteUser(userId);
        setToast({ type: 'success', message: 'User deleted' });
        loadUsers();
        loadStats();
     } catch (err) {
        setToast({ type: 'error', message: 'Failed to delete user' });
     }
  };

  if (!hasRole(['admin', 'super_admin'])) return null;

  return (
    <div className="space-y-6">
       {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold text-slate-900">{t('userManagement.title')}</h1>
             <p className="text-muted-foreground">{t('userManagement.subtitle')}</p>
          </div>
       </div>

       {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><User className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.totalUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.activeUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.activeUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-red-50 text-red-600 rounded-lg"><XCircle className="h-6 w-6" /></div>
                   <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('userManagement.stats.inactiveUsers')}</p>
                      <h3 className="text-2xl font-bold">{stats.inactiveUsers}</h3>
                   </div>
                </CardContent>
             </Card>
             <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                   <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><User className="h-6 w-6" /></div>
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
                         {role}
                      </Button>
                   ))}
                </div>
             </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                   ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                   ) : (
                      users.map(user => (
                         <TableRow key={user._id}>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                                  <span className="text-sm text-muted-foreground">{user.email}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'}>
                                  {user.role}
                               </Badge>
                            </TableCell>
                            <TableCell>
                               {user.isActive ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                               ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Inactive</Badge>
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
                                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                     <DropdownMenuItem onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}>
                                        <Shield className="mr-2 h-4 w-4" /> {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleStatusToggle(user._id, user.isActive)}>
                                        {user.isActive ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                     </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user._id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                     </DropdownMenuItem>
                                  </DropdownMenuContent>
                               </DropdownMenu>
                            </TableCell>
                         </TableRow>
                      ))
                   )}
                </TableBody>
             </Table>
          </CardContent>
       </Card>
    </div>
  );
};

export default UserManagement;
