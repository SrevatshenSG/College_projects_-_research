import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampaignTable } from '../components/CampaignTable';
import { useToast } from '../components/Toast';
import { listCampaigns, deleteCampaign } from '../lib/api';
import type { Campaign, Platform } from '../types';
import { Search, Filter, X } from 'lucide-react';

export const DashboardPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await listCampaigns();
      setCampaigns(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter campaigns based on search term and platform
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = searchTerm === '' || 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.audience.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = selectedPlatform === 'all' || campaign.platform === selectedPlatform;
      
      return matchesSearch && matchesPlatform;
    });
  }, [campaigns, searchTerm, selectedPlatform]);

  const handleView = (id: string) => {
    navigate(`/campaign/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteCampaign(id);
      addToast('success', 'Campaign deleted successfully');
      await fetchCampaigns();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-600">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search campaigns by name, product, or audience..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters || selectedPlatform !== 'all'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedPlatform === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Platforms
              </button>
              {(['facebook', 'instagram', 'google', 'linkedin'] as Platform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedPlatform === platform
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {filteredCampaigns.length} of {campaigns.length} Campaigns
            </h2>
            {(searchTerm || selectedPlatform !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPlatform('all');
                }}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <CampaignTable
            items={filteredCampaigns}
            onView={handleView}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
      </div>
    </div>
  );
};
