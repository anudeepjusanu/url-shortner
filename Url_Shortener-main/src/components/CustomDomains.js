import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from './Toast';
import { domainsAPI } from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';
import { Globe, CheckCircle2, AlertCircle, Trash2, RefreshCw, Copy, Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/Dialog';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

const CustomDomains = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [baseDomain, setBaseDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [addedDomain, setAddedDomain] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); 
  const [toast, setToast] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await domainsAPI.getDomains();
      const domainsData = response.data?.domains || response.domains || [];
      setDomains(domainsData);
    } catch (err) {
      setToast({ type: 'error', message: t('errors.failedToLoadDomainsAlt') });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!baseDomain.trim()) return;
    
    try {
      const fullDomain = subdomain.trim() ? `${subdomain}.${baseDomain}` : baseDomain;
      const response = await domainsAPI.createDomain({
        domain: baseDomain,
        subdomain: subdomain || undefined,
        fullDomain,
        isDefault: false
      });
      
      setAddedDomain(response.data?.data || response.data || { id: Date.now(), fullDomain });
      setStep(2);
      fetchDomains();
    } catch (err) {
      setToast({ type: 'error', message: err.message || t('errors.failedToAddDomainAlt') });
    }
  };

  const verifyDomain = async () => {
    if (!addedDomain) return;
    setVerificationStatus('checking');
    try {
      const response = await domainsAPI.verifyDomain(addedDomain.id);
      if (response.success || response.data?.success) {
        setVerificationStatus('success');
        fetchDomains();
      } else {
        setVerificationStatus('failed');
      }
    } catch (err) {
      setVerificationStatus('failed');
    }
  };

  const handleDelete = async () => {
    try {
      await domainsAPI.deleteDomain(deleteDialog.id);
      fetchDomains();
      setDeleteDialog({ isOpen: false, id: null });
      setToast({ type: 'success', message: t('customDomains.deleteSuccess') });
    } catch {
      setToast({ type: 'error', message: t('errors.failedToDelete') });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ type: 'success', message: t('common.copied') });
  };

  const resetWizard = () => {
    setStep(1);
    setBaseDomain('');
    setSubdomain('');
    setAddedDomain(null);
    setVerificationStatus('idle');
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('customDomains.title')}</h1>
          <p className="text-muted-foreground">{t('customDomains.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('customDomains.addDomain.title')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customDomains.table.domain')}</TableHead>
                <TableHead>{t('customDomains.table.status')}</TableHead>
                <TableHead>{t('customDomains.status.default')}</TableHead>
                <TableHead className="text-right">{t('customDomains.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">{t('common.loading')}</TableCell></TableRow>
              ) : domains.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.noCustomDomainsConnected')}</TableCell></TableRow>
              ) : (
                domains.map(domain => (
                  <TableRow key={domain.id || domain._id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-400" />
                      {domain.fullDomain || domain.domain}
                    </TableCell>
                    <TableCell>
                      {domain.verified ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{t('customDomains.status.verified')}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">{t('customDomains.verification.unverified')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {domain.isDefault && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!domain.verified && (
                          <Button variant="ghost" size="sm" onClick={() => { setAddedDomain(domain); setShowAddDialog(true); setStep(2); }}>
                            {t('customDomains.actions.verify')}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, id: domain.id || domain._id })}>
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Add Domain Wizard Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetWizard()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? t('customDomains.wizard.connectDomain') : t('customDomains.verification.title')}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? t('customDomains.wizard.enterDomain') : t('customDomains.verification.instructions')}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('customDomains.wizard.domainNameLabel')}</Label>
                <Input value={baseDomain} onChange={(e) => setBaseDomain(e.target.value)} placeholder="example.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('customDomains.wizard.subdomainLabel')}</Label>
                <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="link" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('customDomains.verification.recordType')}</span>
                  <span className="font-mono font-bold">CNAME</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('customDomains.verification.name')}</span>
                  <span className="font-mono font-bold">{subdomain || '@'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('customDomains.verification.value')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">snip.sa</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('snip.sa')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {verificationStatus === 'failed' && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {t('customDomains.verification.failed')}
                </div>
              )}
              {verificationStatus === 'success' && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm border border-green-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {t('customDomains.verificationSuccess')}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {step === 1 ? (
              <Button onClick={handleAddDomain} disabled={!baseDomain}>{t('common.next')}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>{t('common.back')}</Button>
                {verificationStatus !== 'success' ? (
                  <Button onClick={verifyDomain} disabled={verificationStatus === 'checking'}>
                    {verificationStatus === 'checking' ? t('customDomains.dnsModal.checking') : t('customDomains.verification.verifyButton')}
                  </Button>
                ) : (
                  <Button onClick={resetWizard}>{t('customDomains.wizard.done')}</Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, id: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customDomains.dialogs.remove.title')}</DialogTitle>
            <DialogDescription>
              {t('customDomains.dialogs.remove.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ isOpen: false, id: null })}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('customDomains.dialogs.remove.button')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomDomains;
