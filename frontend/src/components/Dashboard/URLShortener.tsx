import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import UTMBuilder from './UTMBuilder';
import { urlsAPI, Domain } from '../../services/api';
import { UTMParameters } from '../../types';

const URLShortener: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [title, setTitle] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [utm, setUtm] = useState<UTMParameters>({});
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);

  useEffect(() => {
    fetchAvailableDomains();
  }, []);

  const fetchAvailableDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await urlsAPI.getAvailableDomains();
      const domains = response.data.data.domains || [];
      setAvailableDomains(domains);

      const defaultDomain = domains.find((d: Domain) => d.isDefault);
      if (defaultDomain) {
        setSelectedDomainId(defaultDomain.id);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortenedUrl('');

    try {
      // Only include UTM if at least one field is filled
      const hasUtm = Object.values(utm).some((v) => v);

      const response = await urlsAPI.createUrl({
        originalUrl: originalUrl,
        customCode: customCode || undefined,
        title: title || undefined,
        domainId: selectedDomainId || undefined,
        utm: hasUtm ? utm : undefined,
      });

      const selectedDomain = availableDomains.find((d: Domain) => d.id === selectedDomainId);
      const baseUrl = selectedDomain?.shortUrl || window.location.origin;
      setShortenedUrl(`${baseUrl}/${response.data.data.url.shortCode}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const reset = () => {
    setOriginalUrl('');
    setCustomCode('');
    setTitle('');
    setUtm({});
    setShortenedUrl('');
    setError('');
    setCopied(false);

    const defaultDomain = availableDomains.find((d: Domain) => d.isDefault);
    if (defaultDomain) {
      setSelectedDomainId(defaultDomain.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
          <Link2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Shorten Your URLs
        </h2>
        <p className="mt-2 text-gray-600">
          Transform your long URLs into short, shareable links in seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        <Input
          label="Original URL"
          type="url"
          required
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="https://example.com/very/long/url/that/needs/shortening"
          icon={<ExternalLink className="h-5 w-5" />}
        />

        {/* Domain Selection */}
        {availableDomains.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                disabled={loadingDomains}
              >
                {loadingDomains ? (
                  <option>Loading domains...</option>
                ) : (
                  availableDomains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.fullDomain} {domain.isDefault ? '(Default)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            {selectedDomainId && (
              <p className="text-xs text-gray-500 mt-1">
                Short URL will be: {availableDomains.find((d: Domain) => d.id === selectedDomainId)?.shortUrl}/your-code
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Custom Code (Optional)"
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="my-custom-link"
            icon={<Link2 className="h-5 w-5" />}
          />

          <Input
            label="Title (Optional)"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Link Title"
          />
        </div>

        {/* UTM Parameters */}
        <UTMBuilder utm={utm} onChange={setUtm} />

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            size="lg"
          >
            {loading ? 'Shortening...' : 'Shorten URL'}
          </Button>
          
          {shortenedUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              size="lg"
            >
              Create Another
            </Button>
          )}
        </div>
      </form>

      {shortenedUrl && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Your shortened URL is ready! 🎉
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-600 font-medium truncate">
                    {shortenedUrl}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shortenedUrl, '_blank')}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default URLShortener;