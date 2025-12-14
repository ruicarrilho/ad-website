import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdDetail = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
  }, [adId]);

  const fetchAd = async () => {
    try {
      const response = await axios.get(`${API}/ads/${adId}`);
      setAd(response.data);
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
          <p className="text-slate-600 text-lg mb-4">Ad not found</p>
          <Button onClick={() => navigate('/browse')} className="bg-primary text-white rounded-full">
            Browse Ads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Button
          data-testid="back-btn"
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {ad.images && ad.images.length > 0 ? (
              ad.images.length === 1 ? (
                <div className="rounded-2xl overflow-hidden" data-testid="ad-image">
                  <img
                    src={ad.images[0]}
                    alt={ad.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {ad.images.map((image, index) => (
                      <CarouselItem key={index} data-testid={`carousel-image-${index}`}>
                        <div className="rounded-2xl overflow-hidden">
                          <img
                            src={image}
                            alt={`${ad.title} - ${index + 1}`}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )
            ) : (
              <div className="w-full h-96 bg-slate-100 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400">No images available</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {ad.is_paid && (
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
                <span>✨</span>
                Featured Ad
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
                <span className="text-sm" data-testid="ad-date">Posted {formatDate(ad.created_at)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8 mb-6">
              <div className="text-5xl font-bold text-accent mb-2" data-testid="ad-price">${ad.price}</div>
              <p className="text-slate-600">Price</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8">
              <h2 className="font-heading text-2xl font-semibold text-primary mb-4">Description</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap" data-testid="ad-description">
                {ad.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetail;