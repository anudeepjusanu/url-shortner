import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Trash2, Edit3, BarChart3, Check, QrCode } from 'lucide-react';
import Button from '../UI/Button';
import QRCodeModal from './QRCodeModal';
import { URL } from '../../types';
import { urlsAPI } from '../../services/api';

const URLList: React.FC = () => {
  const [urls, setUrls] = useState<URL[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<{ shortCode: string; shortUrl: string } | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await urlsAPI.getUrls({ page: 1, limit: 10 });
      console.log('URL fetch response:', response.data); // Debug log
      setUrls(response.data.data?.urls || response.data.urls || []);
    } catch (error) {
      console.error('Failed to fetch URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: URL) => {
    try {
      // Use the correct domain for the URL
      let shortUrl;
      if (url.domain && url.domain !== 'laghhu.link') {
        // Custom domain URL (HTTP for now, HTTPS requires SSL setup)
        shortUrl = `http://${url.domain}/${url.shortCode}`;
      } else {
        // Main domain URL (HTTPS)
        shortUrl = `https://laghhu.link/${url.shortCode}`;
      }

      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(url.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deleteUrl = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this URL?')) {
      try {
        await urlsAPI.deleteUrl(id);
        setUrls(urls.filter(url => url.id !== id));
      } catch (error) {
        console.error('Failed to delete URL:', error);
      }
    }
  };

  const openQRCode = (url: URL) => {
    let shortUrl;
    if (url.domain && url.domain !== 'laghhu.link') {
      shortUrl = `http://${url.domain}/${url.shortCode}`;
    } else {
      shortUrl = `https://laghhu.link/${url.shortCode}`;
    }
    setQrCodeUrl({ shortCode: url.shortCode, shortUrl });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Your URLs</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUrls}
        >
          Refresh
        </Button>
      </div>

      {urls?.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ExternalLink className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No URLs yet</h4>
          <p className="text-gray-600">
            Create your first shortened URL using the form above
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {urls.map((url) => (
            <div
              key={url.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {url.title || 'Untitled'}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      url.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {url.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Short URL:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-primary-600">
                        /{url.shortCode}
                      </code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Original:</span>
                      <a
                        href={url.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 truncate max-w-md"
                      >
                        {url.originalUrl}
                      </a>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{url.clickCount} clicks</span>
                      </span>
                      <span>Created: {formatDate(url.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(url)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Copy URL"
                  >
                    {copiedId === url.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openQRCode(url)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Generate QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(url.originalUrl, '_blank')}
                    className="text-gray-600 hover:text-gray-800"
                    title="Visit URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                    title="Edit URL"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteUrl(url.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete URL"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {qrCodeUrl && (
        <QRCodeModal
          shortCode={qrCodeUrl.shortCode}
          shortUrl={qrCodeUrl.shortUrl}
          onClose={() => setQrCodeUrl(null)}
        />
      )}
    </div>
  );
};

export default URLList;