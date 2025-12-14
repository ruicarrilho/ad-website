import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Sparkles, ImagePlus, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PostAd = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    images: [],
    is_paid: false
  });
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value, subcategory: '' }));
    // Update subcategories based on selected category
    const selectedCategory = categories.find(cat => cat.id === value);
    if (selectedCategory) {
      setSubcategories(selectedCategory.subcategories || []);
    } else {
      setSubcategories([]);
    }
  };

  const handleSubcategoryChange = (value) => {
    setFormData(prev => ({ ...prev, subcategory: value }));
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      if (!formData.is_paid && formData.images.length >= 5) {
        toast({
          title: 'Limit Reached',
          description: 'Free ads are limited to 5 images. Upgrade to premium for unlimited images.',
          variant: 'destructive'
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive'
      });
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one image',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const adData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        images: formData.images,
        is_paid: formData.is_paid
      };

      const response = await axios.post(`${API}/ads`, adData, {
        withCredentials: true
      });

      toast({
        title: 'Success!',
        description: 'Your ad has been posted successfully'
      });

      // If premium, redirect to payment
      if (formData.is_paid) {
        const adId = response.data.ad_id;
        initiatePayment(adId);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to post ad',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (adId) => {
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payment/create-session`,
        {
          ad_id: adId,
          origin_url: originUrl
        },
        {
          withCredentials: true
        }
      );

      // Redirect to Stripe
      window.location.href = response.data.url;
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment',
        variant: 'destructive'
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">Post an Ad</h1>
          <p className="text-slate-600">Fill in the details to create your advertisement</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6" data-testid="post-ad-form">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" data-testid="title-label">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              data-testid="title-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., iPhone 15 Pro Max"
              className="h-12 rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" data-testid="description-label">Description *</Label>
            <Textarea
              id="description"
              name="description"
              required
              data-testid="description-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your item or service..."
              rows={5}
              className="rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Category and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label data-testid="category-label">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger data-testid="category-select" className="h-12 rounded-lg">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} data-testid={`category-option-${cat.id}`}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" data-testid="price-label">Price (USD) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                data-testid="price-input"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="h-12 rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label data-testid="images-label">Images {!formData.is_paid && `(Max 5 for free ads)`}</Label>
              <Button
                type="button"
                data-testid="add-image-btn"
                onClick={handleImageUrlAdd}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Add Image URL
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative group" data-testid={`image-preview-${index}`}>
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    data-testid={`remove-image-btn-${index}`}
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Option */}
          <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 border border-accent/20">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="is_paid"
                data-testid="premium-checkbox"
                checked={formData.is_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                className="mt-1 w-5 h-5 rounded border-accent text-accent focus:ring-accent"
              />
              <div className="flex-1">
                <label htmlFor="is_paid" className="flex items-center gap-2 font-heading font-semibold text-lg text-slate-900 mb-2 cursor-pointer">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Make this a Premium Ad - $10.00
                </label>
                <p className="text-sm text-slate-600">
                  Premium ads get unlimited images, priority placement, and extended visibility. Payment via Stripe.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              data-testid="cancel-btn"
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex-1 h-12 rounded-full font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-ad-btn"
              className="flex-1 bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium transition-all active:scale-95"
            >
              {loading ? 'Posting...' : formData.is_paid ? 'Post & Pay' : 'Post Ad'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostAd;
