import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Toast from "./Toast";
import { qrCodeAPI, urlsAPI } from "../services/api";
import { usePermissions } from "../contexts/PermissionContext";
import { getCurrentDomain, isSystemDomain } from "../utils/domainUtils";
import { 
  QrCode, Download, Settings, Trash2, Plus, RefreshCw, CheckSquare, Square, Search,
  Grid, List, Eye, Palette, Sliders, Image, FileDown, Share2, Copy, Check,
  Zap, TrendingUp, Activity, BarChart3
} from "lucide-react";

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedQR, setSelectedQR] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
  const [copiedId, setCopiedId] = useState(null);
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

  const handleCopyUrl = async (link) => {
    try {
      const url = `https://${getShortUrl(link)}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(link._id || link.id);
      setTimeout(() => setCopiedId(null), 2000);
      setToast({ type: 'success', message: 'URL copied to clipboard' });
    } catch {
      setToast({ type: 'error', message: 'Failed to copy URL' });
    }
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredLinks.map(link => (
        <Card key={link.id || link._id} className="hover:shadow-lg transition-all group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{link.title || 'Untitled'}</CardTitle>
                <CardDescription className="truncate text-xs">{getShortUrl(link)}</CardDescription>
              </div>
              <button onClick={() => toggleSelection(link.id || link._id)} className="ml-2">
                {selectedLinks.includes(link.id || link._id) ? 
                  <CheckSquare className="h-5 w-5 text-primary" /> : 
                  <Square className="h-5 w-5 text-muted-foreground" />
                }
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center py-6 bg-slate-50/50">
            {link.qrCode ? (
              <div 
                className="relative cursor-pointer group/qr"
                onClick={() => { setSelectedQR(link); setShowDetailModal(true); }}
              >
                <img src={link.qrCode} alt="QR Code" className="w-40 h-40 object-contain transition-transform group-hover/qr:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover/qr:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="w-40 h-40 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                <QrCode className="h-12 w-12 mb-2" />
                <span className="text-xs">No QR Code</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 bg-slate-50/30 p-4">
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" /> {link.qrScanCount || 0} scans
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {link.qrDownloads || 0}
              </span>
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleCopyUrl(link)}
              >
                {copiedId === (link._id || link.id) ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => downloadQRCode(link.id || link._id)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => { setSelectedLink(link); setShowGenerateModal(true); }}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const ListView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {filteredLinks.map(link => (
            <div key={link.id || link._id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleSelection(link.id || link._id)}>
                  {selectedLinks.includes(link.id || link._id) ? 
                    <CheckSquare className="h-5 w-5 text-primary" /> : 
                    <Square className="h-5 w-5 text-muted-foreground" />
                  }
                </button>
                
                <div 
                  className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => { setSelectedQR(link); setShowDetailModal(true); }}
                >
                  {link.qrCode ? (
                    <img src={link.qrCode} alt="QR" className="w-14 h-14 object-contain" />
                  ) : (
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{link.title || 'Untitled'}</h3>
                  <p className="text-xs text-muted-foreground truncate">{getShortUrl(link)}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{link.originalUrl}</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{link.qrScanCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{link.qrDownloads || 0}</div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleCopyUrl(link)}
                  >
                    {copiedId === (link._id || link.id) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => downloadQRCode(link.id || link._id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => { setSelectedLink(link); setShowGenerateModal(true); }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('qrCodes.title')}</h1>
          <p className="text-muted-foreground">{t('qrCodes.subtitle')}</p>
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
              Grid
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generate New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total QR Codes', value: stats.totalQRCodes, color: 'text-blue-600', icon: QrCode, bg: 'bg-blue-50' },
           { label: 'Total Scans', value: stats.totalScans, color: 'text-green-600', icon: Activity, bg: 'bg-green-50' },
           { label: 'Active', value: stats.activeQRCodes, color: 'text-purple-600', icon: Zap, bg: 'bg-purple-50' },
           { label: 'Downloads Today', value: stats.downloadsToday, color: 'text-orange-600', icon: TrendingUp, bg: 'bg-orange-50' }
         ].map((stat, i) => (
           <Card key={i} className="hover:shadow-md transition-shadow">
             <CardContent className="pt-6 flex items-center gap-4">
               <div className={cn("p-3 rounded-lg", stat.bg)}>
                 <stat.icon className={cn("h-6 w-6", stat.color)} />
               </div>
               <div>
                 <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
                 <div className="text-sm text-muted-foreground">{stat.label}</div>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search QR codes by title, URL, or short code..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedLinks.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedLinks.length} selected
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QR Codes Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first QR code to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowGenerateModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Generate QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        viewMode === 'grid' ? <GridView /> : <ListView />
      )}

      {/* Generate QR Code Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Customize QR Code
              </DialogTitle>
              <DialogDescription>Create and customize your QR code with advanced options.</DialogDescription>
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
                     <option key={l.id || l._id} value={l.id || l._id}>
                       {l.title || l.shortCode} - {l.originalUrl.substring(0, 50)}...
                     </option>
                   ))}
                </select>
             </div>
           ) : (
             <div className="py-2 space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Generating QR Code for:</p>
                  <p className="text-sm text-blue-700 mt-1">{selectedLink.title || getShortUrl(selectedLink)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Foreground Color
                      </Label>
                      <div className="flex gap-2">
                         <Input 
                           type="color" 
                           className="w-16 h-10 p-1 cursor-pointer" 
                           value={qrOptions.foregroundColor} 
                           onChange={e => setQrOptions({...qrOptions, foregroundColor: e.target.value})} 
                         />
                         <Input 
                           value={qrOptions.foregroundColor} 
                           onChange={e => setQrOptions({...qrOptions, foregroundColor: e.target.value})}
                           className="flex-1"
                         />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Background Color
                      </Label>
                      <div className="flex gap-2">
                         <Input 
                           type="color" 
                           className="w-16 h-10 p-1 cursor-pointer" 
                           value={qrOptions.backgroundColor} 
                           onChange={e => setQrOptions({...qrOptions, backgroundColor: e.target.value})} 
                         />
                         <Input 
                           value={qrOptions.backgroundColor} 
                           onChange={e => setQrOptions({...qrOptions, backgroundColor: e.target.value})}
                           className="flex-1"
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Sliders className="h-4 w-4" />
                        Size (px)
                      </Label>
                      <Input 
                        type="number" 
                        value={qrOptions.size} 
                        onChange={e => setQrOptions({...qrOptions, size: parseInt(e.target.value)})}
                        min="100"
                        max="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Format
                      </Label>
                      <select 
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={qrOptions.format}
                        onChange={e => setQrOptions({...qrOptions, format: e.target.value})}
                      >
                        <option value="png">PNG</option>
                        <option value="svg">SVG</option>
                        <option value="jpg">JPG</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border-2 border-dashed">
                    <div className="text-center">
                      <QrCode className="h-32 w-32 mx-auto mb-3 text-slate-400" />
                      <p className="text-sm text-muted-foreground">Preview will appear here</p>
                    </div>
                  </div>
                </div>
             </div>
           )}

           <DialogFooter>
              <Button variant="outline" onClick={() => { setShowGenerateModal(false); setSelectedLink(null); }}>
                Cancel
              </Button>
              <Button onClick={() => selectedLink && generateQRCode(selectedLink.id || selectedLink._id)} disabled={!selectedLink}>
                 <Zap className="mr-2 h-4 w-4" />
                 Generate QR Code
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>QR Code Details</DialogTitle>
            <DialogDescription>View and manage your QR code</DialogDescription>
          </DialogHeader>
          {selectedQR && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg">
                  {selectedQR.qrCode ? (
                    <img src={selectedQR.qrCode} alt="QR Code" className="w-64 h-64 object-contain" />
                  ) : (
                    <div className="w-64 h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
                    <p className="text-lg font-semibold">{selectedQR.title || 'Untitled'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Short URL</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-slate-100 px-3 py-2 rounded flex-1">{getShortUrl(selectedQR)}</p>
                      <Button variant="outline" size="icon" onClick={() => handleCopyUrl(selectedQR)}>
                        {copiedId === (selectedQR._id || selectedQR.id) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Original URL</h3>
                    <p className="text-sm text-muted-foreground break-all">{selectedQR.originalUrl}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedQR.qrScanCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Scans</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedQR.qrDownloads || 0}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => downloadQRCode(selectedQR.id || selectedQR._id, 'png')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => downloadQRCode(selectedQR.id || selectedQR._id, 'svg')}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCodes;
