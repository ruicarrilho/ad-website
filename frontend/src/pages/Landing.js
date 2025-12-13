import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredAds, setFeaturedAds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchFeaturedAds();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchFeaturedAds = async () => {
    try {
      const response = await axios.get(`${API}/ads?limit=8`);
      setFeaturedAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categoryImages = {
    jobs: 'https://images.unsplash.com/photo-1661169398420-e8d229fb39f4?crop=entropy&cs=srgb&fm=jpg&q=85',
    real_estate_renting: 'https://images.unsplash.com/photo-1607756844432-f4849943f199?crop=entropy&cs=srgb&fm=jpg&q=85',
    real_estate_selling: 'https://images.unsplash.com/photo-1607756844432-f4849943f199?crop=entropy&cs=srgb&fm=jpg&q=85',
    vehicles: 'https://images.unsplash.com/photo-1600709928175-83626df9883d?crop=entropy&cs=srgb&fm=jpg&q=85',
    sales_of_products: 'https://images.unsplash.com/photo-1727093493740-90af54b99738?crop=entropy&cs=srgb&fm=jpg&q=85',
    services: 'https://images.unsplash.com/photo-1758599543152-a73184816eba?crop=entropy&cs=srgb&fm=jpg&q=85'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Your marketplace for everything</span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight leading-none text-primary">
              Find What You Need, Sell What You Have
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Browse thousands of ads or post your own. From jobs to real estate, vehicles to services - all in one place.
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-12 rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                />
              </div>
              <Button
                data-testid="search-btn"
                onClick={handleSearch}
                className="bg-accent text-white hover:bg-accent/90 h-12 px-8 rounded-full font-medium transition-all active:scale-95"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Right: Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => navigate('/browse?category=jobs')}>
                <img src={categoryImages.jobs} alt="Jobs" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-heading font-semibold text-lg">Jobs</div>
              </div>
              <div className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => navigate('/browse?category=vehicles')}>
                <img src={categoryImages.vehicles} alt="Vehicles" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-heading font-semibold text-lg">Vehicles</div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="relative h-64 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => navigate('/browse?category=real_estate_renting')}>
                <img src={categoryImages.real_estate_renting} alt="Real Estate" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-heading font-semibold text-lg">Real Estate</div>
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => navigate('/browse?category=services')}>
                <img src={categoryImages.services} alt="Services" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white font-heading font-semibold text-lg">Services</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-heading text-4xl font-semibold tracking-tight text-primary mb-8">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              data-testid={`category-card-${category.id}`}
              onClick={() => navigate(`/browse?category=${category.id}`)}
              className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border border-transparent hover:border-slate-100"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">{category.id === 'jobs' ? '💼' : category.id.includes('real_estate') ? '🏠' : category.id === 'vehicles' ? '🚗' : category.id === 'services' ? '🔧' : '🛍️'}</span>
              </div>
              <span className="text-sm font-medium text-slate-900 text-center">{category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Ads Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-primary">Featured Ads</h2>
          <Button
            data-testid="view-all-ads-btn"
            onClick={() => navigate('/browse')}
            variant="ghost"
            className="font-medium"
          >
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredAds.map((ad) => (
            <div
              key={ad.ad_id}
              data-testid={`featured-ad-${ad.ad_id}`}
              onClick={() => navigate(`/ads/${ad.ad_id}`)}
              className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-300 transition-all duration-300 cursor-pointer hover:shadow-lg"
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
                    No image
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-heading font-semibold text-lg text-slate-900 line-clamp-1">{ad.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{ad.description}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-2xl font-bold text-accent">${ad.price}</span>
                  {ad.is_paid && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">Featured</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-white">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">Ready to Post Your Ad?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">Join thousands of users buying and selling on AdsHub. Post your first ad today!</p>
          <Button
            data-testid="cta-post-ad-btn"
            onClick={() => navigate('/post-ad')}
            className="bg-accent text-white hover:bg-accent/90 h-14 px-12 rounded-full font-medium text-lg transition-all active:scale-95"
          >
            Post Your First Ad
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;