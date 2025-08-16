import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdPreviewCard } from '../components/AdPreviewCard';
import { useToast } from '../components/Toast';
import { createCampaign, generateCreative } from '../lib/api';
import type { Campaign, Platform, Tone, GenerateResult } from '../types';

// Platform configuration with icons and colors
const PLATFORMS: { value: Platform; label: string; icon: string; colors: string }[] = [
  { value: 'facebook', label: 'Facebook', icon: '📘', colors: 'bg-blue-500 hover:bg-blue-600 border-blue-500' },
  { value: 'instagram', label: 'Instagram', icon: '📷', colors: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-purple-500' },
  { value: 'google', label: 'Google Ads', icon: '🔍', colors: 'bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 hover:from-blue-600 hover:via-green-600 hover:to-yellow-600 border-blue-500' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', colors: 'bg-blue-600 hover:bg-blue-700 border-blue-600' },
];

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'Professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'Casual', label: 'Casual', description: 'Relaxed and approachable' },
  { value: 'Humorous', label: 'Humorous', description: 'Funny and entertaining' },
  { value: 'Urgent', label: 'Urgent', description: 'Time-sensitive and compelling' },
  { value: 'Friendly', label: 'Friendly', description: 'Warm and welcoming' },
];

export const NewCampaignPage = () => {
  const [step, setStep] = useState<'generate' | 'save'>('generate');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('facebook');
  const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
  const [details, setDetails] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    product: '',
    audience: '',
    budget: 1000,
    platform: 'facebook',
    headline: '',
    description: '',
    imageUrl: '',
  });
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleGenerate = async () => {
    if (!formData.product || !formData.audience) {
      addToast('error', 'Please fill in product and audience fields');
      return;
    }

    try {
      setLoadingGenerate(true);
      const result = await generateCreative({
        product: formData.product,
        audience: formData.audience,
        platform: selectedPlatform,
        tone: selectedTone,
        details: details.trim() || undefined,
      });
      
      setGeneratedContent(result);
      setSelectedVariant(0);
      addToast('success', 'Creative content generated successfully!');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!generatedContent) {
      addToast('error', 'Please generate content first');
      return;
    }

    try {
      setLoadingSave(true);
      const campaignData: Campaign = {
        name: formData.name || '',
        product: formData.product || '',
        audience: formData.audience || '',
        budget: formData.budget || 1000,
        platform: selectedPlatform,
        headline: generatedContent.variants[selectedVariant] || generatedContent.headline,
        description: generatedContent.description,
        imageUrl: generatedContent.imageUrl,
      };
      
      await createCampaign(campaignData);
      addToast('success', 'Campaign created successfully!');
      navigate('/dashboard');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleFormChange = (field: keyof Campaign, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantSelect = (index: number) => {
    setSelectedVariant(index);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 'generate' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'generate' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Generate Content</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center ${step === 'save' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'save' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Save Campaign</span>
          </div>
        </div>
      </div>

      {step === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generate Section */}
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-black mb-4">Generate AI Creative Content</h2>
              
              <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Target Platform *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => setSelectedPlatform(platform.value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedPlatform === platform.value
                            ? `${platform.colors} text-white border-current`
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                      >
                        <span className="text-lg">{platform.icon}</span>
                        <span className="font-medium">{platform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product */}
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-black mb-2">
                    Product *
                  </label>
                  <input
                    type="text"
                    id="product"
                    value={formData.product || ''}
                    onChange={(e) => handleFormChange('product', e.target.value)}
                    className="rounded-lg border border-gray-300 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 bg-white"
                    placeholder="What are you promoting?"
                  />
                </div>

                {/* Audience */}
                <div>
                  <label htmlFor="audience" className="block text-sm font-medium text-black mb-2">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    id="audience"
                    value={formData.audience || ''}
                    onChange={(e) => handleFormChange('audience', e.target.value)}
                    className="rounded-lg border border-gray-300 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 bg-white"
                    placeholder="Who is your target audience?"
                  />
                </div>

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Tone *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {TONES.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setSelectedTone(tone.value)}
                        className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left ${
                          selectedTone === tone.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                      >
                        <span className="font-medium text-black">{tone.label}</span>
                        <span className="text-sm text-gray-600">{tone.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label htmlFor="details" className="block text-sm font-medium text-black mb-2">
                    Additional Details
                  </label>
                  <textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    className="rounded-lg border border-gray-300 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 bg-white"
                    placeholder="Provide specific instructions or context (e.g., 'mention our 50% off sale this weekend', 'focus on eco-friendliness')"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loadingGenerate || !formData.product || !formData.audience}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingGenerate ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Content...
                    </div>
                  ) : (
                    'Generate AI Creative Content'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {generatedContent ? (
              <>
                {/* Generated Content */}
                <div className="bg-gray-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-medium text-black mb-4">Generated Content</h2>
                  
                  {/* Variant Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black mb-3">
                      Select Headline Variant
                    </label>
                    <div className="space-y-3">
                      {generatedContent.variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => handleVariantSelect(index)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedVariant === index
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400 bg-white'
                          }`}
                        >
                          <div className="font-medium text-black">{variant}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black mb-2">
                      Generated Description
                    </label>
                    <div className="p-4 bg-white rounded-lg border border-gray-300">
                      <p className="text-gray-800">{generatedContent.description}</p>
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <button
                    onClick={() => setStep('save')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition"
                  >
                    Continue to Save Campaign
                  </button>
                </div>

                {/* Ad Preview */}
                <div className="bg-gray-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-medium text-black mb-4">Ad Preview</h2>
                  <AdPreviewCard
                    platform={selectedPlatform}
                    headline={generatedContent.variants[selectedVariant] || generatedContent.headline}
                    description={generatedContent.description}
                    imageUrl={generatedContent.imageUrl}
                  />
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="bg-gray-100 rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-black">Generate Creative Content</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Fill in the details and click "Generate AI Creative Content" to create your ad.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Save Section */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-black mb-4">Campaign Details</h2>
              
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="rounded-lg border border-gray-300 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 bg-white"
                    placeholder="Enter campaign name"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-black mb-2">
                    Budget *
                  </label>
                  <input
                    type="number"
                    id="budget"
                    value={formData.budget || ''}
                    onChange={(e) => handleFormChange('budget', Number(e.target.value))}
                    className="rounded-lg border border-gray-300 p-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 bg-white"
                    placeholder="Enter budget amount"
                    min="0"
                  />
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('generate')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition"
                >
                  Back to Generate
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* Ad Preview */}
            {generatedContent && (
              <div className="bg-gray-100 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-black mb-4">Final Ad Preview</h2>
                <AdPreviewCard
                  platform={selectedPlatform}
                  headline={generatedContent.variants[selectedVariant] || generatedContent.headline}
                  description={generatedContent.description}
                  imageUrl={generatedContent.imageUrl}
                />
              </div>
            )}

            {/* Create Campaign Button */}
            <div className="bg-gray-100 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-black mb-4">Create Campaign</h2>
              <button
                onClick={handleSaveCampaign}
                disabled={loadingSave || !formData.name || !generatedContent}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSave ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Campaign...
                  </div>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 