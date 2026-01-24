import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { urlsAPI } from "../services/api";
import Toast from "./Toast";
import { Link as LinkIcon, Copy, RefreshCw, Facebook, Twitter, Instagram, Linkedin, Mail, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { cn } from "../lib/utils";

const UTMBuilder = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  // Form state
  const [form, setForm] = useState({
    url: '',
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  });

  const [generatedUrl, setGeneratedUrl] = useState('');
  
  const presets = [
    { name: 'Facebook', source: 'facebook', medium: 'social', icon: Facebook, color: 'text-blue-600' },
    { name: 'Twitter', source: 'twitter', medium: 'social', icon: Twitter, color: 'text-sky-500' },
    { name: 'Instagram', source: 'instagram', medium: 'social', icon: Instagram, color: 'text-pink-600' },
    { name: 'LinkedIn', source: 'linkedin', medium: 'social', icon: Linkedin, color: 'text-blue-700' },
    { name: 'Email', source: 'newsletter', medium: 'email', icon: Mail, color: 'text-slate-600' },
    { name: 'Google Ads', source: 'google', medium: 'cpc', icon: Search, color: 'text-green-600' },
  ];

  const applyPreset = (p) => {
    setForm(prev => ({ ...prev, source: p.source, medium: p.medium }));
  };

  const generateUrl = () => {
    if (!form.url) {
        setToast({ type: 'error', message: 'Website URL is required' });
        return;
    }
    try {
        const url = new URL(form.url);
        if (form.source) url.searchParams.set('utm_source', form.source);
        if (form.medium) url.searchParams.set('utm_medium', form.medium);
        if (form.campaign) url.searchParams.set('utm_campaign', form.campaign);
        if (form.term) url.searchParams.set('utm_term', form.term);
        if (form.content) url.searchParams.set('utm_content', form.content);
        setGeneratedUrl(url.toString());
    } catch {
        setToast({ type: 'error', message: 'Invalid Website URL' });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const createShortLink = async () => {
    try {
        await urlsAPI.createUrl({ originalUrl: generatedUrl, title: `UTM: ${form.campaign || 'Campaign'}` });
        setToast({ type: 'success', message: 'Short link created!' });
        navigate('/my-links');
    } catch (err) {
        setToast({ type: 'error', message: 'Failed to create short link' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">UTM Builder</h1>
          <p className="text-muted-foreground">Trace traffic from social media, emails, and other sources.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Builder Form */}
         <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle>Configure Parameters</CardTitle>
               <CardDescription>Fill out the fields below to generate your tracked URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                  <Label>Website URL <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="https://example.com/landing-page" 
                    value={form.url} 
                    onChange={e => setForm({...form, url: e.target.value})} 
                  />
               </div>

               <div className="space-y-3">
                  <Label>Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                     {presets.map((p, i) => (
                        <button 
                           key={i} 
                           onClick={() => applyPreset(p)}
                           className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border rounded-md text-sm font-medium transition-colors"
                        >
                           <p.icon className={cn("h-4 w-4", p.color)} /> {p.name}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Campaign Source <span className="text-red-500">*</span></Label>
                     <Input placeholder="google, newsletter" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <Label>Campaign Medium <span className="text-red-500">*</span></Label>
                     <Input placeholder="cpc, banner, email" value={form.medium} onChange={e => setForm({...form, medium: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <Label>Campaign Name</Label>
                     <Input placeholder="summer_sale" value={form.campaign} onChange={e => setForm({...form, campaign: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <Label>Campaign Term</Label>
                     <Input placeholder="running+shoes" value={form.term} onChange={e => setForm({...form, term: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <Label>Campaign Content</Label>
                     <Input placeholder="logolink" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                  </div>
               </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-slate-50 p-4">
               <Button variant="ghost" onClick={() => setForm({ url: '', source: '', medium: '', campaign: '', term: '', content: '' })}>Reset</Button>
               <Button onClick={generateUrl}>Generate URL</Button>
            </CardFooter>
         </Card>

         {/* Result Side */}
         <div className="space-y-6">
            <Card className="h-fit">
               <CardHeader>
                  <CardTitle>Generated URL</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  {generatedUrl ? (
                     <>
                        <div className="p-3 bg-slate-100 rounded-md break-all text-sm font-mono border">
                           {generatedUrl}
                        </div>
                        <div className="flex flex-col gap-2">
                           <Button className="w-full" onClick={copyToClipboard}>
                              <Copy className="mr-2 h-4 w-4" /> Copy URL
                           </Button>
                           <Button variant="outline" className="w-full" onClick={createShortLink}>
                              <LinkIcon className="mr-2 h-4 w-4" /> Shorten Link
                           </Button>
                        </div>
                     </>
                  ) : (
                     <div className="text-center py-8 text-muted-foreground text-sm">
                        Fill out the form to generate a URL.
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="text-base">Why use UTMs?</CardTitle>
               </CardHeader>
               <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>UTM parameters allow you to track the effectiveness of your marketing campaigns across traffic sources and publishing media.</p>
                  <ul className="list-disc pl-4 space-y-1">
                     <li>Track ROI of social media</li>
                     <li>Measure email newsletter performance</li>
                     <li>A/B test ad placements</li>
                  </ul>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default UTMBuilder;
