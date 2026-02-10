import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Sparkles, ImagePlus, X, CheckCircle2 } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PostAd = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
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
  const [location, setLocation] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdAdId, setCreatedAdId] = useState(null);
  const [createdAdTitle, setCreatedAdTitle] = useState('');

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    const maxImages = 20; // Absolute maximum
    if (formData.images.length + files.length > maxImages) {
      toast({
        title: 'Limit Reached',
        description: `Maximum ${maxImages} images allowed per ad.`,
        variant: 'destructive'
      });
      return;
    }

    // Convert images to base64
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File',
            description: 'Please upload only image files',
            variant: 'destructive'
          });
          reject('Invalid file type');
          return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            title: 'File Too Large',
            description: 'Image size must be less than 5MB',
            variant: 'destructive'
          });
          reject('File too large');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64Images = await Promise.all(promises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const calculateCost = () => {
    const imageCount = formData.images.length;
    const isPremium = formData.is_paid;
    
    // Base costs
    const baseCost = isPremium ? 10.00 : 0.00;
    
    // Extra image costs
    const freeImageLimit = isPremium ? 15 : 5;
    const extraImages = Math.max(0, imageCount - freeImageLimit);
    const extraImagesCost = extraImages * 1.00;
    
    const totalCost = baseCost + extraImagesCost;
    
    return {
      baseCost,
      extraImages,
      extraImagesCost,
      totalCost,
      requiresPayment: totalCost > 0
    };
  };

  const costBreakdown = calculateCost();

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

    if (!location || !location.country || !location.address) {
      toast({
        title: 'Validation Error',
        description: 'Please provide location details',
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
        subcategory: formData.subcategory || null,
        price: parseFloat(formData.price),
        images: formData.images,
        location: location,
        is_paid: formData.is_paid
      };

      const response = await axios.post(`${API}/ads`, adData, {
        withCredentials: true
      });

      const adId = response.data.ad_id;
      const adTitle = response.data.title;

      // Set dialog data
      setCreatedAdId(adId);
      setCreatedAdTitle(adTitle);

      // Stop loading before showing dialog or redirecting
      setLoading(false);

      // If payment is required (premium or extra images)
      if (costBreakdown.requiresPayment) {
        initiatePayment(adId);
      } else {
        // Show success dialog for free ads with no extra costs
        setShowSuccessDialog(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to post ad',
        variant: 'destructive'
      });
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
          origin_url: originUrl,
          is_premium: formData.is_paid,
          image_count: formData.images.length
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

          {/* Category, Subcategory and Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Label data-testid="subcategory-label">Subcategory</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={handleSubcategoryChange}
                disabled={!formData.category}
              >
                <SelectTrigger data-testid="subcategory-select" className="h-12 rounded-lg">
                  <SelectValue placeholder={formData.category ? "Select subcategory" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat} data-testid={`subcategory-option-${subcat}`}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" data-testid="price-label">Price (EUR) *</Label>
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

          {/* Location */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <h3 className="font-heading text-xl font-semibold text-primary">Location</h3>
            <MapPicker location={location} onLocationChange={setLocation} />
          </div>

          {/* Images */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label data-testid="images-label" className="text-base">Images</Label>
                <p className="text-sm text-slate-600 mt-1">
                  {formData.is_paid ? (
                    <>First 15 images free, then €1 per extra image (max 20)</>
                  ) : (
                    <>First 5 images free, then €1 per extra image (max 20)</>
                  )}
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="image-upload"
                  data-testid="image-upload-input"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  data-testid="add-image-btn"
                  onClick={() => document.getElementById('image-upload').click()}
                  variant="outline"
                  size="sm"
                  className="rounded-full cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </div>
            {formData.images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <ImagePlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">No images uploaded yet</p>
                <p className="text-sm text-slate-500">Click "Upload Images" to add photos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((imageData, index) => (
                  <div key={index} className="relative group" data-testid={`image-preview-${index}`}>
                    <img
                      src={imageData}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      data-testid={`remove-image-btn-${index}`}
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Accepted formats: JPG, PNG, GIF, WebP. Max size: 5MB per image
            </p>
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
                  Make this a Premium Ad - €10.00
                </label>
                <p className="text-sm text-slate-600">
                  Premium ads get priority placement, extended visibility, and 15 free images instead of 5.
                </p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          {(costBreakdown.requiresPayment || formData.images.length > 0) && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="font-heading font-semibold text-lg text-slate-900 mb-4">Cost Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Images ({formData.images.length} total)</span>
                  <span>
                    {costBreakdown.extraImages > 0 ? (
                      <span className="text-sm">
                        {formData.is_paid ? '15' : '5'} free + {costBreakdown.extraImages} extra
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">Free</span>
                    )}
                  </span>
                </div>
                {formData.is_paid && (
                  <div className="flex justify-between text-slate-700">
                    <span>Premium Ad</span>
                    <span className="font-medium">€{costBreakdown.baseCost.toFixed(2)}</span>
                  </div>
                )}
                {costBreakdown.extraImages > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Extra Images ({costBreakdown.extraImages} × €1)</span>
                    <span className="font-medium">€{costBreakdown.extraImagesCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total Cost</span>
                    <span data-testid="total-cost">
                      {costBreakdown.totalCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `€${costBreakdown.totalCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              {loading ? 'Posting...' : costBreakdown.requiresPayment ? `Post & Pay €${costBreakdown.totalCost.toFixed(2)}` : 'Post Ad Free'}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        // Prevent closing by clicking outside or ESC
        if (open === false) return;
        setShowSuccessDialog(open);
      }}>
        <DialogContent 
          className="sm:max-w-md" 
          data-testid="success-dialog"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" data-testid="success-icon" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-heading">
              Ad Posted Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-2">
              <p className="text-base text-slate-700">
                Your ad <span className="font-semibold">"{createdAdTitle}"</span> has been published and is now live.
              </p>
              <p className="text-sm text-slate-600">
                It will be visible to thousands of potential buyers across Portugal!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              data-testid="view-ad-btn"
              onClick={() => navigate(`/ads/${createdAdId}`)}
              className="w-full bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium"
            >
              View My Ad
            </Button>
            <Button
              data-testid="go-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full h-12 rounded-full font-medium"
            >
              Go to My Dashboard
            </Button>
            <Button
              data-testid="post-another-ad-btn"
              onClick={() => {
                setShowSuccessDialog(false);
                window.location.reload();
              }}
              variant="ghost"
              className="w-full text-primary hover:text-primary/80"
            >
              Post Another Ad
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostAd;
