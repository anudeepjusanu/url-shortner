import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import Input from '../UI/Input';
import { UTMParameters } from '../../types';

interface UTMBuilderProps {
  utm: UTMParameters;
  onChange: (utm: UTMParameters) => void;
}

const UTMBuilder: React.FC<UTMBuilderProps> = ({ utm, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof UTMParameters, value: string) => {
    onChange({
      ...utm,
      [field]: value || undefined,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-gray-900">
            UTM Parameters (Optional)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-4">
            Add UTM parameters to track your campaigns. These will be automatically
            appended to your destination URL when users click your short link.
          </p>

          <Input
            label="Campaign Source"
            type="text"
            value={utm.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
            placeholder="e.g., google, newsletter, facebook"
            helpText="Identify the source of your traffic (required for tracking)"
          />

          <Input
            label="Campaign Medium"
            type="text"
            value={utm.medium || ''}
            onChange={(e) => handleChange('medium', e.target.value)}
            placeholder="e.g., cpc, email, social"
            helpText="Identify the medium (cpc, banner, email, etc.)"
          />

          <Input
            label="Campaign Name"
            type="text"
            value={utm.campaign || ''}
            onChange={(e) => handleChange('campaign', e.target.value)}
            placeholder="e.g., summer_sale, product_launch"
            helpText="Identify the specific campaign"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Campaign Term"
              type="text"
              value={utm.term || ''}
              onChange={(e) => handleChange('term', e.target.value)}
              placeholder="e.g., running+shoes"
              helpText="Identify paid search keywords"
            />

            <Input
              label="Campaign Content"
              type="text"
              value={utm.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="e.g., logolink, textlink"
              helpText="Differentiate similar content/links"
            />
          </div>

          {Object.values(utm).some((v) => v) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Preview URL with UTM:
              </p>
              <p className="text-xs text-blue-700 break-all font-mono">
                {generateUTMPreview(utm)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const generateUTMPreview = (utm: UTMParameters): string => {
  const params = new URLSearchParams();
  if (utm.source) params.append('utm_source', utm.source);
  if (utm.medium) params.append('utm_medium', utm.medium);
  if (utm.campaign) params.append('utm_campaign', utm.campaign);
  if (utm.term) params.append('utm_term', utm.term);
  if (utm.content) params.append('utm_content', utm.content);

  const queryString = params.toString();
  return queryString ? `your-url.com?${queryString}` : 'No UTM parameters set';
};

export default UTMBuilder;
