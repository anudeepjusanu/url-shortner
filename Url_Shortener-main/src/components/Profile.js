import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import api, { analyticsAPI, domainsAPI } from "../services/api";
import Toast from './Toast';
import { User, Lock, Key, Globe, Bell, Shield, Save, Copy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

const Profile = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [toast, setToast] = useState(null);

  // States
  const [personalInfo, setPersonalInfo] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [apiKey, setApiKey] = useState("");
  const [preferences, setPreferences] = useState({ emailNotifications: true, marketingEmails: false, language: "en" });
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, customDomains: 0, plan: "Free" });
  
  // Loading states
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, statsRes, domainsRes, keyRes, prefsRes] = await Promise.allSettled([
        api.get("/auth/profile"),
        api.get("/urls/stats"),
        domainsAPI.getDomains(),
        api.get("/auth/api-key"),
        api.get("/auth/preferences")
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value;
        setPersonalInfo({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          email: p.email || "",
          jobTitle: p.jobTitle || ""
        });
      }

      if (statsRes.status === 'fulfilled') {
         setStats(prev => ({ ...prev, ...statsRes.value, totalLinks: statsRes.value.totalLinks || 0 }));
      }
      
      if (keyRes.status === 'fulfilled' && keyRes.value.apiKey) {
         setApiKey(keyRes.value.apiKey);
      }

      if (prefsRes.status === 'fulfilled') {
         setPreferences({
            emailNotifications: prefsRes.value.emailNotifications !== false,
            marketingEmails: prefsRes.value.marketingEmails || false,
            language: prefsRes.value.language || "en"
         });
      }

    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", personalInfo);
      if (res) {
        updateUser(res);
        setToast({ type: 'success', message: t('profile.messages.profileUpdated') });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || t('profile.messages.failedToUpdate') });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      setToast({ type: 'error', message: t('profile.messages.passwordsDoNotMatch') });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword
      });
      setToast({ type: 'success', message: t('profile.messages.passwordUpdated') });
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setToast({ type: 'error', message: err.message || t('profile.messages.failedToUpdatePassword') });
    } finally {
      setLoading(false);
    }
  };

  const regenerateKey = async () => {
    if (!window.confirm(t('profile.apiKeys.confirmRegenerate'))) return;
    try {
      const res = await api.post("/auth/regenerate-api-key");
      if (res.apiKey) {
        setApiKey(res.apiKey);
        setToast({ type: 'success', message: t('profile.messages.apiKeyRegenerated') });
      }
    } catch (err) {
      setToast({ type: 'error', message: t('profile.messages.failedToRegenerateKey') });
    }
  };

  const updatePreferences = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/preferences", preferences);
      setToast({ type: 'success', message: t('profile.messages.preferencesUpdated') });
    } catch (err) {
        setToast({ type: 'error', message: t('profile.messages.failedToUpdatePreferences') });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Sidebar Navigation for Profile */}
         <Card className="h-fit">
            <CardContent className="p-4 space-y-1">
               {['general', 'security', 'api', 'preferences'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      activeTab === tab ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                     {tab === 'general' && <User className="h-4 w-4" />}
                     {tab === 'security' && <Lock className="h-4 w-4" />}
                     {tab === 'api' && <Key className="h-4 w-4" />}
                     {tab === 'preferences' && <Bell className="h-4 w-4" />}
                     <span className="capitalize">{t(`profile.tabs.${tab}`)}</span>
                  </button>
               ))}
            </CardContent>
         </Card>

         <div className="col-span-1 md:col-span-3 space-y-6">
            
            {/* General Tab */}
            {activeTab === 'general' && (
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.general.personalInfo')}</CardTitle>
                     <CardDescription>{t('profile.general.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={updateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>{t('profile.general.firstName')}</Label>
                              <Input value={personalInfo.firstName} onChange={e => setPersonalInfo({...personalInfo, firstName: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <Label>{t('profile.general.lastName')}</Label>
                              <Input value={personalInfo.lastName} onChange={e => setPersonalInfo({...personalInfo, lastName: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label>{t('profile.general.email')}</Label>
                           <Input value={personalInfo.email} disabled className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                           <Label>{t('profile.general.jobTitle')}</Label>
                           <Input value={personalInfo.jobTitle} placeholder="e.g. Marketing Manager" onChange={e => setPersonalInfo({...personalInfo, jobTitle: e.target.value})} />
                        </div>
                        <div className="pt-4 flex justify-end">
                           <Button type="submit" disabled={loading}>
                              {loading ? t('profile.general.updating') : t('profile.general.saveChanges')}
                           </Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.security.changePassword')}</CardTitle>
                     <CardDescription>{t('profile.security.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={updatePassword} className="space-y-4">
                        <div className="space-y-2">
                           <Label>{t('profile.security.currentPassword')}</Label>
                           <Input type="password" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <Label>{t('profile.security.newPassword')}</Label>
                           <Input type="password" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <Label>{t('profile.security.confirmPassword')}</Label>
                           <Input type="password" value={security.confirmPassword} onChange={e => setSecurity({...security, confirmPassword: e.target.value})} />
                        </div>
                        <div className="pt-4 flex justify-end">
                           <Button type="submit" disabled={loading}>{t('profile.security.updatePassword')}</Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.apiKeys.title')}</CardTitle>
                     <CardDescription>{t('profile.apiKeys.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label>{t('profile.apiKeys.key')}</Label>
                        <div className="flex gap-2">
                           <Input value={apiKey} readOnly className="font-mono bg-slate-50" type="password" />
                           <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(apiKey); setToast({type: 'success', message: t('myLinks.copiedToClipboard')}); }}>
                              <Copy className="h-4 w-4" />
                           </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('profile.apiKeys.warning')}</p>
                     </div>
                     <div className="flex justify-end">
                        <Button variant="destructive" variantType="outline" onClick={regenerateKey}>{t('profile.apiKeys.regenerateButton')}</Button>
                     </div>
                  </CardContent>
               </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.preferences.title')}</CardTitle>
                     <CardDescription>{t('profile.preferences.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <form onSubmit={updatePreferences} className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div className="space-y-0.5">
                              <Label className="text-base">{t('profile.preferences.emailNotifications')}</Label>
                              <p className="text-sm text-muted-foreground">{t('profile.preferences.emailNotificationsDesc')}</p>
                           </div>
                           <input type="checkbox" checked={preferences.emailNotifications} onChange={e => setPreferences({...preferences, emailNotifications: e.target.checked})} className="toggle" />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <div className="space-y-0.5">
                              <Label className="text-base">{t('profile.preferences.marketingEmails')}</Label>
                              <p className="text-sm text-muted-foreground">{t('profile.preferences.marketingEmailsDesc')}</p>
                           </div>
                           <input type="checkbox" checked={preferences.marketingEmails} onChange={e => setPreferences({...preferences, marketingEmails: e.target.checked})} className="toggle" />
                        </div>
                        <div className="pt-4 flex justify-end">
                           <Button type="submit">{t('profile.preferences.savePreferences')}</Button>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            )}
         </div>
      </div>
    </div>
  );
};

export default Profile;
