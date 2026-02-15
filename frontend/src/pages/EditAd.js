import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Sparkles, ImagePlus, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

const EditAd = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAd, setFetchingAd] = useState(true);
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
  const [originalIsPaid, setOriginalIsPaid] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    fetchAd();
  }, [user, navigate, adId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAd = async () => {
    try {
      const response = await axios.get(`${API}/ads/${adId}`);
      const ad = response.data;
      
      // Check if user owns this ad
      if (ad.user_id !== user.user_id) {
        toast({
          title: 'Access Denied',
          description: 'You can only edit your own ads',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }

      setFormData({
        title: ad.title,
        description: ad.description,
        category: ad.category,
        subcategory: ad.subcategory || '',
        price: ad.price.toString(),
        images: ad.images || [],
        is_paid: ad.is_paid
      });
      setOriginalIsPaid(ad.is_paid);
      
      if (ad.location) {
        setLocation(ad.location);
      }

      // Set subcategories based on category
      const category = categories.find(cat => cat.id === ad.category);
      if (category) {
        setSubcategories(category.subcategories || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch ad details',
        variant: 'destructive'
      });
      navigate('/dashboard');
    } finally {
      setFetchingAd(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value, subcategory: '' }));
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

        if (file.size > 5 * 1024 * 1024) {
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
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        price: parseFloat(formData.price),
        images: formData.images,
        location: location
      };

      await axios.put(`${API}/ads/${adId}`, updateData, {
        withCredentials: true
      });

      // Stop loading and show success dialog
      setLoading(false);
      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update ad',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  if (fetchingAd) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          data-testid="back-to-dashboard-btn"
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('editAd.backToDashboard')}
        </Button>

        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">{t('editAd.title')}</h1>
          <p className="text-slate-600">{t('editAd.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6" data-testid="edit-ad-form">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" data-testid="title-label">{t('postAd.titleLabel')} *</Label>
            <Input
              id="title"
              name="title"
              required
              data-testid="title-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t('postAd.titlePlaceholder')}
              className="h-12 rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" data-testid="description-label">{t('postAd.description')} *</Label>
            <Textarea
              id="description"
              name="description"
              required
              data-testid="description-input"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('postAd.descriptionPlaceholder')}
              rows={5}
              className="rounded-lg border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Category, Subcategory and Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label data-testid="category-label">{t('postAd.category')} *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger data-testid="category-select" className="h-12 rounded-lg">
                  <SelectValue placeholder={t('postAd.selectCategory')} />
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
              <Label data-testid="subcategory-label">{t('postAd.subcategory')}</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={handleSubcategoryChange}
                disabled={!formData.category}
              >
                <SelectTrigger data-testid="subcategory-select" className="h-12 rounded-lg">
                  <SelectValue placeholder={formData.category ? t('postAd.selectSubcategory') : t('postAd.selectCategoryFirst')} />
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
              <Label htmlFor="price" data-testid="price-label">{t('postAd.price')} *</Label>
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
            <h3 className="font-heading text-xl font-semibold text-primary">{t('postAd.location')}</h3>
            <MapPicker location={location} onLocationChange={setLocation} />
          </div>

          {/* Images */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label data-testid="images-label" className="text-base">{t('postAd.images')}</Label>
                <p className="text-sm text-slate-600 mt-1">
                  {formData.is_paid ? t('postAd.imagesPremium') : t('postAd.imagesFree')}
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
                  {t('postAd.uploadImages')}
                </Button>
              </div>
            </div>
            {formData.images.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                <ImagePlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">{t('postAd.noImages')}</p>
                <p className="text-sm text-slate-500">{t('postAd.clickUpload')}</p>
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
              {t('postAd.acceptedFormats')}
            </p>
          </div>

          {/* Premium Status (Read-only if already paid) */}
          {originalIsPaid && (
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 border border-accent/20">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-accent" />
                <div>
                  <p className="font-heading font-semibold text-lg text-slate-900">{t('editAd.premiumStatus')}</p>
                  <p className="text-sm text-slate-600">{t('editAd.premiumEnabled')}</p>
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
              {t('postAd.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="update-ad-btn"
              className="flex-1 bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium transition-all active:scale-95"
            >
              {loading ? t('editAd.updating') : t('editAd.updateAd')}
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
              {t('successDialog.adUpdated')}
            </DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-2">
              <p className="text-base text-slate-700">
                {t('successDialog.adUpdatedText', { title: formData.title }).replace('<strong>', '').replace('</strong>', '')}
              </p>
              <p className="text-sm text-slate-600">
                {t('successDialog.updatedLive')}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              data-testid="view-ad-btn"
              onClick={() => navigate(`/ads/${adId}`)}
              className="w-full bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium"
            >
              {t('successDialog.viewUpdated')}
            </Button>
            <Button
              data-testid="go-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full h-12 rounded-full font-medium"
            >
              {t('successDialog.goToDashboard')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditAd;
