import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, Tag, MapPin, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ImageMagnifier from '../components/ImageMagnifier';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import { isFavorite, toggleFavorite } from '../utils/favorites';
import { useToast } from '../hooks/use-toast';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdDetail = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [adId]);

  useEffect(() => {
    if (ad) {
      setIsFav(isFavorite(ad.ad_id));
    }
  }, [ad]);

  const fetchAd = async () => {
    try {
      const response = await axios.get(`${API}/ads/${adId}`);
      setAd(response.data);
      // Track this ad as recently viewed
      addToRecentlyViewed(response.data);
    } catch (error) {
      console.error('Failed to fetch ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction) => {
    if (!ad?.images) return;
    const newIndex = (lightboxIndex + direction + ad.images.length) % ad.images.length;
    setLightboxIndex(newIndex);
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, ad]);

  const handleToggleFavorite = () => {
    const newStatus = toggleFavorite(ad);
    setIsFav(newStatus);
    toast({
      title: newStatus ? 'Added to favorites' : 'Removed from favorites',
      description: newStatus 
        ? `"${ad.title}" has been saved to your favorites.`
        : `"${ad.title}" has been removed from your favorites.`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">{t('adDetail.adNotFound')}</p>
          <Button onClick={() => navigate('/browse')} className="bg-primary text-white rounded-full">
            {t('adDetail.browseAds')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Back Button and Favorite */}
        <div className="flex items-center justify-between mb-6">
          <Button
            data-testid="back-btn"
            onClick={() => navigate(-1)}
            variant="ghost"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            data-testid="favorite-ad-btn"
            onClick={handleToggleFavorite}
            variant="outline"
            className={`rounded-full ${isFav ? 'bg-red-50 border-red-200 hover:bg-red-100' : ''}`}
          >
            <Heart className={`w-4 h-4 mr-2 ${isFav ? 'text-red-500 fill-red-500' : ''}`} />
            {isFav ? 'Saved' : 'Save'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {ad.images && ad.images.length > 0 ? (
              ad.images.length === 1 ? (
                <div 
                  className="rounded-2xl overflow-hidden cursor-pointer" 
                  data-testid="ad-image"
                  onClick={() => openLightbox(0)}
                >
                  <ImageMagnifier
                    src={ad.images[0]}
                    alt={ad.title}
                    magnifierSize={200}
                    zoomLevel={2.5}
                  />
                </div>
              ) : (
                <>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {ad.images.map((image, index) => (
                        <CarouselItem key={index} data-testid={`carousel-image-${index}`}>
                          <div 
                            className="rounded-2xl overflow-hidden cursor-pointer"
                            onClick={() => openLightbox(index)}
                          >
                            <ImageMagnifier
                              src={image}
                              alt={`${ad.title} - ${index + 1}`}
                              magnifierSize={200}
                              zoomLevel={2.5}
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  
                  {/* Thumbnail strip */}
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {ad.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-accent transition-colors"
                        data-testid={`thumbnail-${index}`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )
            ) : (
              <div className="w-full h-96 bg-slate-100 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400">{t('adDetail.noImages')}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {ad.is_paid && (
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
                <span>✨</span>
                {t('adDetail.featuredAd')}
              </span>
            )}
            <h1 className="font-heading text-4xl font-bold text-primary mb-4" data-testid="ad-title">{ad.title}</h1>
            <div className="flex items-center gap-6 text-slate-600 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="capitalize text-sm" data-testid="ad-category">
                  {ad.category.replace(/_/g, ' ')}
                  {ad.subcategory && ` • ${ad.subcategory}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm" data-testid="ad-date">{t('adDetail.posted', { date: formatDate(ad.created_at) })}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-6">
              <div className="text-5xl font-bold text-accent mb-2" data-testid="ad-price">€{ad.price}</div>
              <p className="text-slate-600">{t('adDetail.price')}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-6">
              <h2 className="font-heading text-2xl font-semibold text-primary mb-4">{t('adDetail.description')}</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap" data-testid="ad-description">
                {ad.description}
              </p>
            </div>

            {/* Location */}
            {ad.location && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8">
                <h2 className="font-heading text-2xl font-semibold text-primary mb-4">{t('adDetail.location')}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-600 mt-1" />
                    <div>
                      <p className="text-slate-900 font-medium" data-testid="ad-location-address">{ad.location.address}</p>
                      <p className="text-sm text-slate-600" data-testid="ad-location-country">{ad.location.country}</p>
                    </div>
                  </div>
                  <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200" data-testid="ad-location-map">
                    <MapContainer
                      center={[ad.location.latitude, ad.location.longitude]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[ad.location.latitude, ad.location.longitude]} />
                    </MapContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && ad?.images && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          data-testid="image-lightbox"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            data-testid="lightbox-close"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {lightboxIndex + 1} / {ad.images.length}
          </div>

          {/* Navigation buttons */}
          {ad.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                data-testid="lightbox-prev"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                data-testid="lightbox-next"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Main image with magnifier */}
          <div 
            className="max-w-[90vw] max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageMagnifier
              src={ad.images[lightboxIndex]}
              alt={`${ad.title} - ${lightboxIndex + 1}`}
              magnifierSize={250}
              zoomLevel={3}
              className="max-h-[85vh]"
            />
          </div>

          {/* Thumbnail strip in lightbox */}
          {ad.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
              {ad.images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === lightboxIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdDetail;