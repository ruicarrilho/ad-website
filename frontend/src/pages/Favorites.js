import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getFavoriteAds, removeFromFavorites, clearFavorites } from '../utils/favorites';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const Favorites = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    setFavorites(getFavoriteAds());
  }, []);

  const handleRemove = (adId) => {
    removeFromFavorites(adId);
    setFavorites(getFavoriteAds());
  };

  const handleClearAll = () => {
    clearFavorites();
    setFavorites([]);
    setShowClearDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('adDetail.back', 'Back')}
          </Button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary">
                {t('favorites.title', 'My Favorites')}
              </h1>
              <p className="text-slate-600">
                {t('favorites.subtitle', '{{count}} saved ads', { count: favorites.length })}
              </p>
            </div>
          </div>
          {favorites.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
              data-testid="clear-favorites-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('favorites.clearAll', 'Clear All')}
            </Button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-2">
              {t('favorites.empty', 'No favorites yet')}
            </h2>
            <p className="text-slate-600 mb-6">
              {t('favorites.emptyDescription', 'Start browsing and save ads you like by clicking the heart icon.')}
            </p>
            <Button
              onClick={() => navigate('/browse')}
              className="bg-accent text-white hover:bg-accent/90 rounded-full"
              data-testid="browse-ads-btn"
            >
              {t('favorites.browseAds', 'Browse Ads')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((ad) => (
              <div
                key={ad.ad_id}
                className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-300 transition-all duration-300 hover:shadow-lg"
                data-testid={`favorite-ad-${ad.ad_id}`}
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(ad.ad_id);
                  }}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm transition-colors"
                  data-testid={`remove-favorite-${ad.ad_id}`}
                >
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </button>

                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/ads/${ad.ad_id}`)}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {ad.images && ad.images.length > 0 ? (
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {t('featuredAds.noImage', 'No image')}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-heading font-semibold text-lg text-slate-900 line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{ad.description}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-2xl font-bold text-accent">€{ad.price}</span>
                      {ad.is_paid && (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">
                          {t('featuredAds.featured', 'Featured')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('favorites.clearTitle', 'Clear all favorites?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('favorites.clearDescription', 'This will remove all ads from your favorites list. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-clear-btn">
              {t('common.close', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-clear-btn"
            >
              {t('favorites.clearAll', 'Clear All')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Favorites;
