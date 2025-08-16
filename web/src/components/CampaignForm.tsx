import { useState } from 'react';
import type { Campaign} from '../types';

interface CampaignFormProps {
  initial?: Partial<Campaign>;
  onSubmit: (data: Campaign) => void;
  submitLabel?: string;
}

// TODO: Consider using this for dynamic platform configuration in the future
//const platforms: Platform[] = ['facebook', 'instagram', 'google', 'linkedin'];

export const CampaignForm = ({ initial, onSubmit, submitLabel = 'Create Campaign' }: CampaignFormProps) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    product: '',
    audience: '',
    budget: 1000,
    platform: 'facebook',
    headline: '',
    description: '',
    imageUrl: '',
    ...initial,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.product?.trim()) {
      newErrors.product = 'Product is required';
    }

    if (!formData.audience?.trim()) {
      newErrors.audience = 'Target audience is required';
    }

    if (formData.budget !== undefined && formData.budget < 0) {
      newErrors.budget = 'Budget must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData as Campaign);
    }
  };

  const handleInputChange = (field: keyof Campaign, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campaign Name Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`rounded-lg border p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 ${
            errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
          }`}
          placeholder="Enter campaign name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Product & Audience Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 mb-6">
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <input
              type="text"
              id="product"
              value={formData.product || ''}
              onChange={(e) => handleInputChange('product', e.target.value)}
              className={`rounded-lg border p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 ${
                errors.product ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="What are you promoting?"
            />
            {errors.product && <p className="mt-1 text-sm text-red-600">{errors.product}</p>}
          </div>

          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <input
              type="text"
              id="audience"
              value={formData.audience || ''}
              onChange={(e) => handleInputChange('audience', e.target.value)}
              className={`rounded-lg border p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 ${
                errors.audience ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="Who is your target audience?"
            />
            {errors.audience && <p className="mt-1 text-sm text-red-600">{errors.audience}</p>}
          </div>
        </div>
      </div>

      {/* Budget & Platform Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 mb-6">
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              id="budget"
              min="0"
              step="100"
              value={formData.budget || 1000}
              onChange={(e) => handleInputChange('budget', Number(e.target.value))}
              className={`rounded-lg border p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.budget ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'
              }`}
            />
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInputChange('platform', 'facebook')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                  formData.platform === 'facebook'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleInputChange('platform', 'instagram')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                  formData.platform === 'instagram'
                    ? 'border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-sm font-medium">Instagram</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleInputChange('platform', 'google')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                  formData.platform === 'google'
                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 via-green-50 to-yellow-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:via-green-50 hover:to-yellow-50 cursor-pointer'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Google Ads</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleInputChange('platform', 'linkedin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                  formData.platform === 'linkedin'
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-700 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Content Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 mb-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
              Headline (Optional)
            </label>
            <input
              type="text"
              id="headline"
              value={formData.headline || ''}
              onChange={(e) => handleInputChange('headline', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Enter ad headline"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Enter ad description"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="imageUrl"
              value={formData.imageUrl || ''}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitLabel.includes('ing')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg w-full sm:w-auto transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel.includes('ing') ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{submitLabel}</span>
            </div>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}; 