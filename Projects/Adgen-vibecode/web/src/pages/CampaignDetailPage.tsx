import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdPreviewCard } from '../components/AdPreviewCard';
import { CampaignForm } from '../components/CampaignForm';
import { useToast } from '../components/Toast';
import { getCampaign, updateCampaign, deleteCampaign } from '../lib/api';
import type { Campaign } from '../types';

export const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchCampaign = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getCampaign(id);
      setCampaign(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load campaign');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleUpdate = async (data: Campaign) => {
    if (!id) return;
    
    try {
      setLoadingUpdate(true);
      const updatedCampaign = await updateCampaign(id, data);
      setCampaign(updatedCampaign);
      addToast('success', 'Campaign updated successfully!');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to update campaign');
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !campaign) return;
    
    if (!window.confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoadingDelete(true);
      await deleteCampaign(id);
      addToast('success', 'Campaign deleted successfully!');
      navigate('/');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setLoadingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="mt-1 text-sm text-gray-600">
              Created {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleDelete}
              disabled={loadingDelete}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingDelete ? 'Deleting...' : 'Delete Campaign'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ad Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ad Preview</h2>
            <AdPreviewCard
              platform={campaign.platform}
              headline={campaign.headline || 'No headline'}
              description={campaign.description || 'No description'}
              imageUrl={campaign.imageUrl || ''}
            />
          </div>

          {/* Campaign Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Product</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.product}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.audience}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Platform</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{campaign.platform}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Budget</dt>
                <dd className="mt-1 text-sm text-gray-900">${campaign.budget?.toLocaleString()}</dd>
              </div>
              {campaign.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(campaign.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Campaign</h2>
          <CampaignForm
            initial={campaign}
            onSubmit={handleUpdate}
            submitLabel={loadingUpdate ? 'Updating...' : 'Update Campaign'}
          />
        </div>
      </div>
    </div>
  );
}; 