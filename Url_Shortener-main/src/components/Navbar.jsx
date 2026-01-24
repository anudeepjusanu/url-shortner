import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu, X, Globe, User, LogOut, Sun, Moon,
  LayoutDashboard, Link as LinkIcon, BarChart3, QrCode, Globe2, Shield, Settings, Users, FileText
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/DropdownMenu';
import { cn } from '../lib/utils';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { hasRole } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Navigation Items
  const navItems = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('sidebar.myLinks'), path: '/my-links', icon: LinkIcon },
    { label: t('sidebar.analytics'), path: '/analytics', icon: BarChart3 },
    { label: t('sidebar.qrCodes'), path: '/qr-codes', icon: QrCode },
    { label: t('sidebar.customDomains'), path: '/custom-domains', icon: Globe2 },
  ];

  // Admin Items
  const adminItems = [
    { label: t('sidebar.userManagement') || 'User Management', path: '/user-management', icon: Users, role: ['super_admin'] },
    { label: t('sidebar.urlManagement') || 'URL Management', path: '/admin-urls', icon: LinkIcon, role: ['admin', 'super_admin'] },
    { label: t('sidebar.googleAnalytics') || 'Google Analytics', path: '/google-analytics', icon: BarChart3, role: ['super_admin'] },
  ];

  // Helper to get initials
  const getUserInitials = () => {
    const name = user?.name || user?.username || user?.email || 'U';
    return name.substring(0, 2).toUpperCase();
  };
  
  const handleLogout = async () => {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error("Logout error", error);
        navigate('/login');
      }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
           <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
           </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
             <Link
               key={item.path}
               to={item.path}
               className={cn(
                 "transition-colors hover:text-foreground/80 flex items-center gap-1",
                 isActive(item.path) ? "text-primary font-bold" : "text-muted-foreground"
               )}
             >
               {item.label}
             </Link>
          ))}
          {/* Admin Dropdown */}
          {hasRole(['admin', 'super_admin']) && (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className={cn(
                    "flex items-center gap-1 transition-colors hover:text-foreground outline-none",
                    location.pathname.includes('admin') || location.pathname.includes('management') ? "text-primary font-bold" : "text-muted-foreground"
                 )}>
                    {t('sidebar.admin') || 'Admin'}
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 {adminItems.filter(i => hasRole(i.role)).map(item => (
                    <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold">
                {currentLanguage === 'ar' ? 'English' : 'العربية'}
            </Button>
            
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
               {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {getUserInitials()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('sidebar.profile')}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => navigate('/api-docs')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t('sidebar.apiDocs') || 'API Docs'}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => navigate('/subscription')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{t('sidebar.upgradePlan') || 'Subscription'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
                variant="ghost"
                className="md:hidden ml-1"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background absolute w-full shadow-lg">
             <nav className="flex flex-col space-y-2">
                 {navItems.map((item) => (
                    <Link
                       key={item.path}
                       to={item.path}
                       className={cn(
                          "flex items-center gap-3 text-sm font-medium px-3 py-2 rounded-md hover:bg-muted transition-colors",
                          isActive(item.path) ? "bg-muted text-foreground" : "text-muted-foreground"
                       )}
                       onClick={() => setIsMobileMenuOpen(false)}
                    >
                       <item.icon className="h-4 w-4" />
                       {item.label}
                    </Link>
                 ))}
                  {hasRole(['admin', 'super_admin']) && (
                    <>
                    <div className="px-3 text-xs font-semibold text-muted-foreground mt-4 mb-1 uppercase tracking-wider">Admin</div>
                     {adminItems.filter(i => hasRole(i.role)).map(item => (
                        <Link
                           key={item.path}
                           to={item.path}
                           className={cn(
                              "flex items-center gap-3 text-sm font-medium px-3 py-2 rounded-md hover:bg-muted transition-colors",
                              isActive(item.path) ? "bg-muted text-foreground" : "text-muted-foreground"
                           )}
                           onClick={() => setIsMobileMenuOpen(false)}
                        >
                           <item.icon className="h-4 w-4" />
                           {item.label}
                        </Link>
                     ))}
                     </>
                  )}
             </nav>
        </div>
      )}
    </header>
  );
};
export default Navbar;
