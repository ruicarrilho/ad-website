import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EyeOff, Trash2, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getExcludedAds, restoreAd, clearExcludedAds } from '../utils/excludedAds';
import axios from 'axios';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HiddenAds = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [excludedIds, setExcludedIds] = useState([]);
  const [excludedAds, setExcludedAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    loadExcludedAds();
  }, []);

  const loadExcludedAds = async () => {
    const ids = getExcludedAds();
    setExcludedIds(ids);
    
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch ad details for each excluded ad
    try {
      const adsData = await Promise.all(
        ids.map(async (adId) => {
          try {
            const response = await axios.get(`${API}/ads/${adId}`);
            return response.data;
          } catch (error) {
            // Ad might have been deleted
            return null;
          }
        })
      );
      setExcludedAds(adsData.filter(ad => ad !== null));
    } catch (error) {
      console.error('Failed to fetch excluded ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (adId) => {
    restoreAd(adId);
    setExcludedIds(getExcludedAds());
    setExcludedAds(prev => prev.filter(ad => ad.ad_id !== adId));
  };

  const handleClearAll = () => {
    clearExcludedAds();
    setExcludedIds([]);
    setExcludedAds([]);
    setShowClearDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center">
              <EyeOff className="w-7 h-7 text-slate-600" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary">
                {t('hiddenAds.title', 'Hidden Ads')}
              </h1>
              <p className="text-slate-600">
                {t('hiddenAds.subtitle', '{{count}} hidden ads', { count: excludedAds.length })}
              </p>
            </div>
          </div>
          {excludedAds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(true)}
              className="rounded-full"
              data-testid="restore-all-btn"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('hiddenAds.restoreAll', 'Restore All')}
            </Button>
          )}
        </div>

        {excludedAds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <EyeOff className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-slate-900 mb-2">
              {t('hiddenAds.empty', 'No hidden ads')}
            </h2>
            <p className="text-slate-600 mb-6">
              {t('hiddenAds.emptyDescription', 'Ads you hide from search results will appear here.')}
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
            {excludedAds.map((ad) => (
              <div
                key={ad.ad_id}
                className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden opacity-75 hover:opacity-100 transition-all duration-300"
                data-testid={`hidden-ad-${ad.ad_id}`}
              >
                {/* Restore button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(ad.ad_id);
                  }}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-green-50 rounded-full shadow-sm transition-colors"
                  data-testid={`restore-ad-${ad.ad_id}`}
                  title={t('hiddenAds.restore', 'Restore')}
                >
                  <RotateCcw className="w-5 h-5 text-green-600" />
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
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
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
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hiddenAds.restoreTitle', 'Restore all hidden ads?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hiddenAds.restoreDescription', 'This will make all hidden ads visible again in search results.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-restore-btn">
              {t('common.close', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-green-600 hover:bg-green-700"
              data-testid="confirm-restore-btn"
            >
              {t('hiddenAds.restoreAll', 'Restore All')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HiddenAds;
