import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { PlusCircle, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteAdId, setDeleteAdId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyAds();
  }, [user, navigate]);

  const fetchMyAds = async () => {
    try {
      const response = await axios.get(`${API}/my-ads`, {
        withCredentials: true
      });
      setAds(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your ads',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/ads/${deleteAdId}`, {
        withCredentials: true
      });
      toast({
        title: 'Success',
        description: 'Ad deleted successfully'
      });
      fetchMyAds();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete ad',
        variant: 'destructive'
      });
    }
    setDeleteAdId(null);
  };

  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
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
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-primary mb-2">My Dashboard</h1>
          <p className="text-slate-600">Manage your ads and account</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Ads</p>
                <p className="text-3xl font-bold text-primary">{ads.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Ads</p>
                <p className="text-3xl font-bold text-accent">{ads.filter(ad => ad.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Premium Ads</p>
                <p className="text-3xl font-bold text-green-600">{ads.filter(ad => ad.is_paid).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Button
            data-testid="create-ad-btn"
            onClick={() => navigate('/post-ad')}
            className="bg-accent text-white hover:bg-accent/90 h-12 px-8 rounded-full font-medium transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Ad
          </Button>
        </div>

        {/* Ads List */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-heading text-2xl font-semibold text-primary">Your Ads</h2>
          </div>
          {ads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">You haven't posted any ads yet</p>
              <Button
                data-testid="empty-state-post-ad-btn"
                onClick={() => navigate('/post-ad')}
                className="bg-primary text-white hover:bg-primary/90 h-11 px-8 rounded-full font-medium"
              >
                Post Your First Ad
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ads.map((ad) => (
                <div key={ad.ad_id} className="p-6 hover:bg-slate-50 transition-colors" data-testid={`ad-item-${ad.ad_id}`}>
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100">
                        {ad.images && ad.images.length > 0 ? (
                          <img
                            src={ad.images[0]}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-heading text-xl font-semibold text-slate-900 mb-1">{ad.title}</h3>
                          <p className="text-slate-600 text-sm line-clamp-2">{ad.description}</p>
                        </div>
                        {ad.is_paid && (
                          <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                            Premium
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                        <span className="font-semibold text-2xl text-accent">${ad.price}</span>
                        <span className="capitalize">{ad.category.replace(/_/g, ' ')}</span>
                        <span>{getDaysRemaining(ad.expires_at)} days left</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          data-testid={`edit-ad-btn-${ad.ad_id}`}
                          onClick={() => navigate(`/edit-ad/${ad.ad_id}`)}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          data-testid={`delete-ad-btn-${ad.ad_id}`}
                          onClick={() => setDeleteAdId(ad.ad_id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAdId} onOpenChange={() => setDeleteAdId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your ad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-btn"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
