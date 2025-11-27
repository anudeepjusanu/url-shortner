import React, { useState, useEffect } from 'react';
import { X, Download, Palette, Settings } from 'lucide-react';
import Button from '../UI/Button';
import { urlsAPI, QRCodeOptions } from '../../services/api';

interface QRCodeModalProps {
  shortCode: string;
  shortUrl: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ shortCode, shortUrl, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // QR Code customization options
  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState('000000');
  const [bgColor, setBgColor] = useState('ffffff');
  const [errorCorrection, setErrorCorrection] = useState('M');
  const [margin, setMargin] = useState(1);
  const [format, setFormat] = useState('png');

  useEffect(() => {
    generateQRCode();
  }, [size, fgColor, bgColor, errorCorrection, margin, format]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError('');

      const options: QRCodeOptions = {
        size,
        format,
        fgColor,
        bgColor,
        errorCorrection,
        margin,
      };

      const response = await urlsAPI.generateQRCode(shortCode, options);
      setQrCodeUrl(response.data.data.qrCodeUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${shortCode}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Preview */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Short URL: <span className="font-mono text-primary-600">{shortUrl}</span>
                </p>
              </div>

              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-8 min-h-[350px]">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-64 w-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-600">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : (
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for ${shortUrl}`}
                    className="rounded-lg shadow-lg"
                    style={{ width: `${Math.min(size, 300)}px`, height: `${Math.min(size, 300)}px` }}
                  />
                )}
              </div>

              <Button
                onClick={downloadQRCode}
                disabled={loading || !!error}
                className="w-full"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download QR Code
              </Button>
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Customize</h3>
                </div>

                {/* Size */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size: {size}x{size} pixels
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100px</span>
                    <span>1000px</span>
                  </div>
                </div>

                {/* Format */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="png">PNG (Best for web)</option>
                    <option value="jpeg">JPEG (Smaller file size)</option>
                    <option value="gif">GIF (Animated support)</option>
                    <option value="webp">WebP (Modern format)</option>
                    <option value="svg">SVG (Scalable vector)</option>
                    <option value="pdf">PDF (Print ready)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the format that best suits your needs
                  </p>
                </div>

                {/* Error Correction */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Correction Level
                  </label>
                  <select
                    value={errorCorrection}
                    onChange={(e) => setErrorCorrection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Higher levels allow QR code to be read even if partially damaged
                  </p>
                </div>

                {/* Margin */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margin: {margin} units
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Palette className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
                </div>

                {/* Foreground Color */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foreground Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={`#${fgColor}`}
                      onChange={(e) => setFgColor(e.target.value.substring(1))}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value.replace('#', ''))}
                      placeholder="000000"
                      maxLength={6}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={`#${bgColor}`}
                      onChange={(e) => setBgColor(e.target.value.substring(1))}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value.replace('#', ''))}
                      placeholder="ffffff"
                      maxLength={6}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                    />
                  </div>
                </div>

                {/* Preset Color Schemes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preset Color Schemes
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setFgColor(preset.fg);
                          setBgColor(preset.bg);
                        }}
                        className="h-12 rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors"
                        style={{
                          background: `linear-gradient(to right, #${preset.fg} 50%, #${preset.bg} 50%)`,
                        }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const colorPresets = [
  { name: 'Classic', fg: '000000', bg: 'ffffff' },
  { name: 'Blue', fg: '0066cc', bg: 'e6f2ff' },
  { name: 'Green', fg: '00a86b', bg: 'e6f9f0' },
  { name: 'Red', fg: 'dc143c', bg: 'ffe6ec' },
  { name: 'Purple', fg: '6a0dad', bg: 'f0e6ff' },
  { name: 'Orange', fg: 'ff6600', bg: 'fff0e6' },
  { name: 'Dark', fg: 'ffffff', bg: '1a1a1a' },
  { name: 'Navy', fg: '003366', bg: 'cce0f0' },
];

export default QRCodeModal;
