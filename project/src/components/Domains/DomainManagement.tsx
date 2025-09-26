import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  Copy, 
  Edit, 
  Trash2, 
  Shield, 
  Calendar, 
  Activity, 
  ExternalLink,
  RefreshCw,
  Upload,
  Settings,
  Eye,
  ChevronRight,
  AlertCircle,
  Star,
  Zap
} from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'ssl_failed' | 'inactive';
  verificationStatus: 'verified' | 'pending' | 'failed';
  isDefault: boolean;
  dateAdded: string;
  addedBy: string;
}

interface DomainManagementProps {
  userRole: 'admin' | 'editor' | 'viewer';
  language: 'en' | 'ar';
  getTranslation: (key: string) => string;
}

export const DomainManagement: React.FC<DomainManagementProps> = ({ 
  userRole, 
  language, 
  getTranslation 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newDomainName, setNewDomainName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');

  const mockDomains: Domain[] = [
    {
      id: '1',
      domain: 'short.sa',
      status: 'active',
      verificationStatus: 'verified',
      isDefault: true,
      dateAdded: '2024-01-01',
      addedBy: 'admin@gov.sa'
    },
    {
      id: '2',
      domain: 'links.company.sa',
      status: 'active',
      verificationStatus: 'verified',
      isDefault: false,
      dateAdded: '2024-01-05',
      addedBy: 'admin@gov.sa'
    },
    {
      id: '3',
      domain: 'ministry.gov.sa',
      status: 'pending',
      verificationStatus: 'pending',
      isDefault: false,
      dateAdded: '2024-01-18',
      addedBy: 'admin@gov.sa'
    },
    {
      id: '4',
      domain: 'old-links.sa',
      status: 'failed',
      verificationStatus: 'verified',
      isDefault: false,
      dateAdded: '2023-12-01',
      addedBy: 'admin@gov.sa'
    }
  ];

  const getStatusBadge = (status: string, type: 'domain' | 'verification') => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full";
    
    switch (status) {
      case 'active':
      case 'verified':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="w-3 h-3" />
            {type === 'verification' ? 'Verified' : 'Active'}
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <X className="w-3 h-3" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const simulateVerification = () => {
    setVerificationStatus('checking');
    setTimeout(() => {
      setVerificationStatus('success');
    }, 2000);
  };

  const renderDomainTable = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Connected Domains</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your branded domains and SSL certificates</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Domain
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Added
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockDomains.map((domain) => (
              <tr key={domain.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{domain.domain}</p>
                      {domain.isDefault && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">Default Domain</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(domain.status, 'domain')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(domain.verificationStatus, 'verification')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {domain.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      <Star className="w-3 h-3" />
                      Yes
                    </span>
                  ) : (
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Set as Default
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {domain.dateAdded}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {domain.addedBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedDomain(domain);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-700" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    {domain.status === 'failed' ? (
                      <button className="text-green-600 hover:text-green-700" title="Retry SSL">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button className="text-red-600 hover:text-red-700" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAddDomainWizard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add New Domain</h3>
              <p className="text-sm text-gray-600 mt-1">Step {wizardStep} of 4</p>
            </div>
            <button 
              onClick={() => {
                setShowAddModal(false);
                setWizardStep(1);
                setVerificationStatus('idle');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>1</div>
              <div className={`flex-1 h-1 rounded ${wizardStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>2</div>
              <div className={`flex-1 h-1 rounded ${wizardStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>3</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {wizardStep === 1 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Enter Domain Name</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="links.company.sa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the subdomain you want to use for your branded short links
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Enterprise Domain Setup</h5>
                      <p className="text-sm text-blue-800 mt-1">
                        Your domain will be configured for enterprise-grade short link management.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">DNS Configuration</h4>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Please create the following DNS record:</h5>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <p className="font-mono">CNAME</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Name:</span>
                        <p className="font-mono">{newDomainName || 'links.company.sa'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Value:</span>
                        <div className="flex items-center gap-2">
                          <p className="font-mono">cname.shortener.sa</p>
                          <button
                            onClick={() => copyToClipboard('cname.shortener.sa')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-yellow-900">DNS Propagation</h5>
                      <p className="text-sm text-yellow-800 mt-1">
                        DNS changes can take up to 24 hours to propagate globally. We'll automatically verify your domain once the DNS record is detected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={simulateVerification}
                    disabled={verificationStatus === 'checking'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {verificationStatus === 'checking' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {verificationStatus === 'checking' ? 'Checking DNS...' : 'Check DNS Now'}
                  </button>
                  
                  {verificationStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">DNS record verified!</span>
                    </div>
                  )}
                  
                  {verificationStatus === 'failed' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">DNS record not found. Please check your configuration.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Domain Activation</h4>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-900">DNS Verified Successfully</h5>
                      <p className="text-sm text-green-800 mt-1">
                        Your domain DNS configuration has been verified and is now active.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <h5 className="font-medium text-blue-900">Domain Ready</h5>
                      <p className="text-sm text-blue-800 mt-1">
                        Your domain is now ready to create branded short links.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && verificationStatus === 'success' && (
            <div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Domain Successfully Added!</h4>
                <p className="text-gray-600 mb-6">
                  {newDomainName || 'Your domain'} is now active and ready to use for creating branded short links.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{newDomainName || 'links.company.sa'}</p>
                      <p className="text-sm text-gray-600">DNS Verified • Ready for Use</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto">
                  <Star className="w-4 h-4" />
                  Set as Default Domain
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => {
              if (wizardStep > 1) {
                setWizardStep(wizardStep - 1);
              }
            }}
            disabled={wizardStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={() => {
              if (wizardStep < 3) {
                setWizardStep(wizardStep + 1);
              } else if (wizardStep === 3 && verificationStatus !== 'success') {
                // Stay on step 3 until verification is successful
                return;
              } else {
                setShowAddModal(false);
                setWizardStep(1);
                setNewDomainName('');
                setVerificationStatus('idle');
              }
            }}
            disabled={
              (wizardStep === 1 && !newDomainName) ||
              (wizardStep === 2 && verificationStatus !== 'success')
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {wizardStep === 3 && verificationStatus === 'success' ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDomainDetailModal = () => {
    if (!selectedDomain) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedDomain.domain}</h3>
                <p className="text-sm text-gray-600 mt-1">Domain configuration and activity</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* DNS Validation Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">DNS Validation</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Verification Status</span>
                  {getStatusBadge(selectedDomain.verificationStatus, 'verification')}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <p className="font-mono">CNAME</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="font-mono">{selectedDomain.domain}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Value:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono">cname.shortener.sa</p>
                        <button
                          onClick={() => copyToClipboard('cname.shortener.sa')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Re-check DNS
                </button>
              </div>
            </div>

            {/* Activity Log Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Domain Verified</p>
                    <p className="text-xs text-blue-700 mt-1">{selectedDomain.dateAdded} • DNS configuration confirmed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Domain Added</p>
                    <p className="text-xs text-gray-700 mt-1">{selectedDomain.dateAdded} • Added by {selectedDomain.addedBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Management</h1>
          <p className="text-gray-600">Manage your branded domains and SSL certificates</p>
        </div>
      </div>

      {/* Error Banners */}
      <div className="space-y-3 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">Domain Verification Pending</h4>
              <p className="text-sm text-yellow-800 mt-1">
                <strong>ministry.gov.sa</strong> is waiting for DNS verification. 
                <button className="underline font-medium">Check DNS configuration</button>
              </p>
            </div>
            <button className="text-yellow-400 hover:text-yellow-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {renderDomainTable()}
      {showAddModal && renderAddDomainWizard()}
      {showDetailModal && renderDomainDetailModal()}
    </div>
  );
};