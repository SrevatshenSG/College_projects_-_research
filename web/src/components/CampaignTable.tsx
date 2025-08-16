import { formatDistanceToNow } from 'date-fns';
import type { Campaign, Platform } from '../types';

interface CampaignTableProps {
    items: Campaign[];
    onView: (id: string) => void;
    onDelete: (id: string) => void | Promise<void>;
    deletingId?: string | null; // ✅ add this line
  }
  

const platformConfig = {
  facebook: { name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
  instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '📷' },
  google: { name: 'Google', color: 'bg-red-500', icon: '🔍' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
};

export const CampaignTable = ({ items, onView, onDelete, deletingId }: CampaignTableProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const PlatformBadge = ({ platform }: { platform: Platform }) => {
    const config = platformConfig[platform];
    return (
      <div className={`${config.color} text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1`}>
        <span>{config.icon}</span>
        <span className="font-medium">{config.name}</span>
      </div>
    );
  };

  // Desktop Table View
  const DesktopTable = () => (
    <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Platform
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((campaign) => (
            <tr key={campaign._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                <div className="text-sm text-gray-500">{campaign.product}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <PlatformBadge platform={campaign.platform} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(campaign.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => campaign._id && onView(campaign._id)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => campaign._id && onDelete(campaign._id)}
                    disabled={deletingId === campaign._id}
                    className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === campaign._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile Card View
  const MobileCards = () => (
    <div className="md:hidden space-y-4">
      {items.map((campaign) => (
        <div key={campaign._id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
              <p className="text-sm text-gray-500">{campaign.product}</p>
            </div>
            <PlatformBadge platform={campaign.platform} />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Created {formatDate(campaign.createdAt)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => campaign._id && onView(campaign._id)}
                className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
              >
                View
              </button>
                             <button
                 onClick={() => campaign._id && onDelete(campaign._id)}
                 disabled={deletingId === campaign._id}
                 className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {deletingId === campaign._id ? 'Deleting...' : 'Delete'}
               </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
      </div>
    );
  }

  return (
    <div>
      <DesktopTable />
      <MobileCards />
    </div>
  );
}; 