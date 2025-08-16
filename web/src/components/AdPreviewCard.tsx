import type { Platform } from '../types';

interface AdPreviewCardProps {
  platform: Platform;
  headline: string;
  description: string;
  imageUrl: string;
}

const platformConfig = {
  facebook: { name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
  instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '📷' },
  google: { name: 'Google', color: 'bg-red-500', icon: '🔍' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
};

export const AdPreviewCard = ({ platform, headline, description, imageUrl }: AdPreviewCardProps) => {
  const config = platformConfig[platform];

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Platform Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`${config.color} text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-md`}>
          <span>{config.icon}</span>
          <span className="font-medium">{config.name}</span>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative aspect-video bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={headline}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`${imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300`}>
          <div className="text-gray-400 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No image</p>
          </div>
        </div>
      </div>

      {/* Overlay with Text */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">
          {headline}
        </h3>
        <p className="text-gray-200 text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}; 