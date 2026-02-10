import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const [adDetails, setAdDetails] = useState(null);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }
    checkPaymentStatus(sessionId);
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId, attempt = 0) => {
    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        // Store ad details if available
        if (response.data.ad_id) {
          setAdDetails({
            ad_id: response.data.ad_id,
            title: response.data.ad_title || 'Your ad'
          });
        }
      } else if (attempt < maxAttempts) {
        // Retry after 2 seconds
        setTimeout(() => {
          setAttempts(attempt + 1);
          checkPaymentStatus(sessionId, attempt + 1);
        }, 2000);
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          {status === 'checking' ? (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" data-testid="loading-spinner" />
              <h1 className="font-heading text-2xl font-bold text-primary mb-2">{t('payment.processing')}</h1>
              <p className="text-slate-600">{t('payment.pleaseWait')}</p>
              <p className="text-sm text-slate-500 mt-4">{t('payment.attempt', { current: attempts + 1, max: maxAttempts })}</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" data-testid="success-icon" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-primary mb-2">{t('successDialog.adPosted')}</h1>
              <p className="text-slate-700 mb-2">
                {adDetails?.title ? (
                  <>
                    {t('successDialog.adPublished', { title: adDetails.title }).replace('<strong>', '').replace('</strong>', '')}
                  </>
                ) : (
                  t('payment.adUpgraded')
                )}
              </p>
              <p className="text-sm text-slate-600 mb-8">{t('successDialog.visiblePortugal')}</p>
              <div className="flex flex-col gap-3">
                {adDetails?.ad_id && (
                  <Button
                    data-testid="view-ad-btn"
                    onClick={() => navigate(`/ads/${adDetails.ad_id}`)}
                    className="w-full bg-accent text-white hover:bg-accent/90 h-12 rounded-full font-medium"
                  >
                    {t('successDialog.viewAd')}
                  </Button>
                )}
                <Button
                  data-testid="view-dashboard-btn"
                  onClick={() => navigate('/dashboard')}
                  variant={adDetails?.ad_id ? "outline" : "default"}
                  className={`w-full h-12 rounded-full font-medium ${!adDetails?.ad_id ? 'bg-accent text-white hover:bg-accent/90' : ''}`}
                >
                  {t('successDialog.goToDashboard')}
                </Button>
                <Button
                  data-testid="post-another-btn"
                  onClick={() => navigate('/post-ad')}
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/80"
                >
                  {t('successDialog.postAnother')}
                </Button>
              </div>
            </>
          ) : status === 'pending' ? (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⏳</span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-primary mb-2">{t('payment.pending')}</h1>
              <p className="text-slate-600 mb-8">{t('payment.pendingMessage')}</p>
              <Button
                data-testid="goto-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium"
              >
                {t('payment.goToDashboard')}
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-primary mb-2">{t('payment.error')}</h1>
              <p className="text-slate-600 mb-8">{t('payment.errorMessage')}</p>
              <Button
                data-testid="back-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 rounded-full font-medium"
              >
                {t('payment.backToDashboard')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;