import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BumpSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [adTitle, setAdTitle] = useState('');

  const sessionId = searchParams.get('session_id');
  const adId = searchParams.get('ad_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`, {
        withCredentials: true
      });
      
      if (response.data.payment_status === 'paid') {
        setSuccess(true);
        
        // Fetch ad title
        if (adId) {
          try {
            const adResponse = await axios.get(`${API}/ads/${adId}`);
            setAdTitle(adResponse.data.title);
          } catch (e) {
            console.error('Failed to fetch ad:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">{t('common.loading', 'Verifying payment...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        {success ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-4">
              {t('bumpSuccess.title', 'Ad Bumped Successfully!')}
            </h1>
            <p className="text-slate-600 mb-2">
              {adTitle ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: t('bumpSuccess.description', 'Your ad <strong>"{{title}}"</strong> has been bumped to the top of search results.', { title: adTitle })
                }} />
              ) : (
                t('bumpSuccess.descriptionGeneric', 'Your ad has been bumped to the top of search results.')
              )}
            </p>
            <p className="text-sm text-slate-500 mb-8">
              {t('bumpSuccess.visibility', 'It will now appear at the top when users browse or search for similar items.')}
            </p>
            <div className="space-y-3">
              {adId && (
                <Button
                  onClick={() => navigate(`/ads/${adId}`)}
                  className="w-full bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium"
                  data-testid="view-bumped-ad-btn"
                >
                  {t('bumpSuccess.viewAd', 'View My Ad')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full h-12 rounded-full font-medium"
                data-testid="go-to-dashboard-btn"
              >
                {t('bumpSuccess.dashboard', 'Go to Dashboard')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-4">
              {t('bumpSuccess.failed', 'Payment Verification Failed')}
            </h1>
            <p className="text-slate-600 mb-8">
              {t('bumpSuccess.failedDescription', 'We could not verify your payment. Please try again or contact support.')}
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium"
            >
              {t('bumpSuccess.backToDashboard', 'Back to Dashboard')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BumpSuccess;
