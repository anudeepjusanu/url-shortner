import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Toast from "./Toast";
import { qrCodeAPI, urlsAPI } from "../services/api";
import { usePermissions } from "../contexts/PermissionContext";
import { getCurrentDomain, isSystemDomain } from "../utils/domainUtils";
import { QrCode, Download, Settings, Trash2, Plus, RefreshCw, CheckSquare, Square, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Badge } from './ui/Badge';
import { cn } from "../lib/utils";

const QRCodes = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [qrOptions, setQrOptions] = useState({
    size: 300,
    format: 'png',
    errorCorrection: 'M',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    includeMargin: true
  });
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ totalQRCodes: 0, totalScans: 0, activeQRCodes: 0, downloadsToday: 0 });

  useEffect(() => {
    loadLinks();
    loadStats();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(links);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLinks(links.filter(l => 
        l.shortCode?.toLowerCase().includes(query) || 
        l.originalUrl?.toLowerCase().includes(query) ||
        l.title?.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, links]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const response = await urlsAPI.getUrls();
      const urls = response.data?.urls || [];
      setLinks(urls);
      setFilteredLinks(urls);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load links' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await qrCodeAPI.getStats();
      if (response?.data) {
        setStats({
          totalQRCodes: response.data.totalQRCodes || 0,
          totalScans: response.data.totalScans || 0,
          activeQRCodes: response.data.activeQRCodes || 0,
          downloadsToday: response.data.downloadsToday || 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateQRCode = async (linkId) => {
    try {
      await qrCodeAPI.generate(linkId, qrOptions);
      setToast({ type: 'success', message: 'QR Code generated!' });
      loadLinks();
      loadStats();
      setShowGenerateModal(false);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to generate QR Code' });
    }
  };

  const downloadQRCode = async (linkId, format = 'png') => {
    try {
      const blob = await qrCodeAPI.download(linkId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${linkId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ type: 'success', message: 'Downloaded successfully' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to download' });
    }
  };

  const getShortUrl = (link) => {
    const domain = link.domain && !isSystemDomain(link.domain) ? link.domain : getCurrentDomain();
    return `${domain}/${link.shortCode}`;
  };

  const toggleSelection = (id) => {
    setSelectedLinks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedLinks.length === filteredLinks.length) setSelectedLinks([]);
    else setSelectedLinks(filteredLinks.map(l => l._id || l.id));
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('qrCodes.title')}</h1>
          <p className="text-muted-foreground">{t('qrCodes.subtitle')}</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Generate New
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Total QR Codes', value: stats.totalQRCodes, color: 'text-blue-600' },
           { label: 'Total Scans', value: stats.totalScans, color: 'text-green-600' },
           { label: 'Active', value: stats.activeQRCodes, color: 'text-purple-600' },
           { label: 'Downloads Today', value: stats.downloadsToday, color: 'text-orange-600' }
         ].map((stat, i) => (
           <Card key={i}>
             <CardContent className="pt-6 text-center">
               <div className={cn("text-3xl font-bold mb-1", stat.color)}>{stat.value}</div>
               <div className="text-sm text-muted-foreground">{stat.label}</div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search QR codes..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         {selectedLinks.length > 0 && (
           <Button variant="outline" onClick={() => {/* Bulk logic implies modal or action */}}>
             Bulk Actions ({selectedLinks.length})
           </Button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredLinks.map(link => (
          <Card key={link.id || link._id} className={cn("transition-all hover:shadow-md", selectedLinks.includes(link.id || link._id) ? "ring-2 ring-primary" : "")}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                   <CardTitle className="text-base truncate w-48">{link.title || 'Untitled'}</CardTitle>
                   <CardDescription className="truncate w-48">{getShortUrl(link)}</CardDescription>
                </div>
                <button onClick={() => toggleSelection(link.id || link._id)}>
                   {selectedLinks.includes(link.id || link._id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
               {link.qrCode ? (
                 <img src={link.qrCode} alt="QR Code" className="w-32 h-32 object-contain" />
               ) : (
                 <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                    No QR Code
                 </div>
               )}
            </CardContent>
            <CardFooter className="flex justify-between bg-slate-50/50 p-3">
               <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                     <QrCode className="h-3 w-3" /> {link.qrScanCount || 0} scans
                  </span>
               </div>
               <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedLink(link); setShowGenerateModal(true); }}>
                     <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadQRCode(link.id || link._id)}>
                     <Download className="h-4 w-4" />
                  </Button>
               </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
           <DialogHeader>
              <DialogTitle>Generate QR Code</DialogTitle>
              <DialogDescription>Customize your QR code settings.</DialogDescription>
           </DialogHeader>
           
           {!selectedLink ? (
             <div className="py-4 space-y-4">
                <Label>Select Link</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => setSelectedLink(links.find(l => (l.id || l._id) === e.target.value))}
                >
                   <option value="">Select a link...</option>
                   {links.map(l => (
                     <option key={l.id || l._id} value={l.id || l._id}>{l.title || l.shortCode} ({l.originalUrl})</option>
                   ))}
                </select>
             </div>
           ) : (
             <div className="py-2">
                <p className="text-sm font-medium mb-4">Generating for: {selectedLink.title || getShortUrl(selectedLink)}</p>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Foreground Color</Label>
                      <div className="flex gap-2">
                         <Input type="color" className="w-12 p-1" value={qrOptions.foregroundColor} onChange={e => setQrOptions({...qrOptions, foregroundColor: e.target.value})} />
                         <Input value={qrOptions.foregroundColor} onChange={e => setQrOptions({...qrOptions, foregroundColor: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                         <Input type="color" className="w-12 p-1" value={qrOptions.backgroundColor} onChange={e => setQrOptions({...qrOptions, backgroundColor: e.target.value})} />
                         <Input value={qrOptions.backgroundColor} onChange={e => setQrOptions({...qrOptions, backgroundColor: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
           )}

           <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
              <Button onClick={() => selectedLink && generateQRCode(selectedLink.id || selectedLink._id)} disabled={!selectedLink}>
                 Generate
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCodes;
