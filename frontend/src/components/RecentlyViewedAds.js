import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, X } from 'lucide-react';
import { getRecentlyViewedAds, clearRecentlyViewed } from '../utils/recentlyViewed';
import { Button } from './ui/button';

const RecentlyViewedAds = ({ onRefresh }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recentAds, setRecentAds] = React.useState([]);

  React.useEffect(() => {
    setRecentAds(getRecentlyViewedAds());
  }, [onRefresh]);

  const handleClear = () => {
    clearRecentlyViewed();
    setRecentAds([]);
  };

  if (recentAds.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-primary">
            {t('recentlyViewed.title', 'Recently Viewed')}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-700"
          data-testid="clear-recently-viewed-btn"
        >
          <X className="w-4 h-4 mr-1" />
          {t('recentlyViewed.clear', 'Clear')}
        </Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
        {recentAds.map((ad) => (
          <div
            key={ad.ad_id}
            data-testid={`recently-viewed-${ad.ad_id}`}
            onClick={() => navigate(`/ads/${ad.ad_id}`)}
            className="flex-shrink-0 w-56 bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-300 transition-all cursor-pointer hover:shadow-md group"
          >
            <div className="aspect-[4/3] overflow-hidden bg-slate-100">
              {ad.images && ad.images.length > 0 ? (
                <img
                  src={ad.images[0]}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  {t('featuredAds.noImage', 'No image')}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-slate-900 line-clamp-1 text-sm mb-1">{ad.title}</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-accent">€{ad.price}</span>
                {ad.is_paid && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    {t('featuredAds.featured', 'Featured')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedAds;
