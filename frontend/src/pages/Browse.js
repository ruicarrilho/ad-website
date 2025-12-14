import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, SlidersHorizontal, Map } from 'lucide-react';
import MapSearch from '../components/MapSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Browse = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAds();
  }, [selectedCategory, selectedSubcategory]);

  useEffect(() => {
    // Update subcategories when category changes
    if (selectedCategory && selectedCategory !== 'all') {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category && category.subcategories) {
        setSubcategories(category.subcategories);
      } else {
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
      setSelectedSubcategory('all');
    }
  }, [selectedCategory, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      let url = `${API}/ads?limit=50`;
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      if (selectedSubcategory && selectedSubcategory !== 'all') {
        url += `&subcategory=${encodeURIComponent(selectedSubcategory)}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await axios.get(url);
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAds();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">Browse Ads</h1>
          <p className="text-slate-600">Find what you're looking for</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-900">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="category-filter" className="h-12 rounded-lg">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="category-all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} data-testid={`category-filter-${cat.id}`}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select 
                value={selectedSubcategory} 
                onValueChange={setSelectedSubcategory}
                disabled={!selectedCategory || selectedCategory === 'all' || subcategories.length === 0}
              >
                <SelectTrigger data-testid="subcategory-filter" className="h-12 rounded-lg">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="subcategory-all">All Subcategories</SelectItem>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat} data-testid={`subcategory-filter-${subcat}`}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                data-testid="search-filter-input"
                type="text"
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-12 rounded-lg border-slate-200 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                data-testid="search-filter-btn"
                onClick={handleSearch}
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-600 text-lg">No ads found matching your criteria</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-slate-600">
              Showing {ads.length} {ads.length === 1 ? 'result' : 'results'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ads.map((ad) => (
                <div
                  key={ad.ad_id}
                  data-testid={`ad-card-${ad.ad_id}`}
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
                  {ad.is_paid && (
                    <div className="absolute top-3 right-3 bg-accent text-white text-xs font-medium px-3 py-1 rounded-full">
                      Featured
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-heading font-semibold text-lg text-slate-900 line-clamp-1">{ad.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{ad.description}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-2xl font-bold text-accent">${ad.price}</span>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 capitalize block">{ad.category.replace(/_/g, ' ')}</span>
                        {ad.subcategory && (
                          <span className="text-xs text-slate-400 block">{ad.subcategory}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;