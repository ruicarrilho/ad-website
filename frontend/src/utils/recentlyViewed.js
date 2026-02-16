// Utility functions for tracking recently viewed ads in localStorage

const STORAGE_KEY = 'recentlyViewedAds';
const MAX_ITEMS = 10;

/**
 * Get recently viewed ads from localStorage
 * @returns {Array} Array of ad objects
 */
export const getRecentlyViewedAds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get recently viewed ads:', error);
    return [];
  }
};

/**
 * Add an ad to recently viewed
 * @param {Object} ad - The ad object to add
 */
export const addToRecentlyViewed = (ad) => {
  if (!ad || !ad.ad_id) return;
  
  try {
    const recentAds = getRecentlyViewedAds();
    
    // Remove if already exists (to move to front)
    const filtered = recentAds.filter(item => item.ad_id !== ad.ad_id);
    
    // Create a minimal ad object to store
    const adToStore = {
      ad_id: ad.ad_id,
      title: ad.title,
      price: ad.price,
      images: ad.images?.slice(0, 1) || [], // Store only first image
      category: ad.category,
      is_paid: ad.is_paid,
      viewedAt: new Date().toISOString()
    };
    
    // Add to front of array
    const updated = [adToStore, ...filtered].slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add to recently viewed:', error);
  }
};

/**
 * Clear all recently viewed ads
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recently viewed:', error);
  }
};

/**
 * Remove a specific ad from recently viewed
 * @param {string} adId - The ad ID to remove
 */
export const removeFromRecentlyViewed = (adId) => {
  try {
    const recentAds = getRecentlyViewedAds();
    const filtered = recentAds.filter(item => item.ad_id !== adId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from recently viewed:', error);
  }
};
