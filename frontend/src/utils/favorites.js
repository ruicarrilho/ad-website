// Utility functions for managing favorite ads in localStorage

const STORAGE_KEY = 'favoriteAds';

/**
 * Get all favorite ads from localStorage
 * @returns {Array} Array of ad objects
 */
export const getFavoriteAds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get favorite ads:', error);
    return [];
  }
};

/**
 * Check if an ad is favorited
 * @param {string} adId - The ad ID to check
 * @returns {boolean}
 */
export const isFavorite = (adId) => {
  const favorites = getFavoriteAds();
  return favorites.some(ad => ad.ad_id === adId);
};

/**
 * Add an ad to favorites
 * @param {Object} ad - The ad object to add
 */
export const addToFavorites = (ad) => {
  if (!ad || !ad.ad_id) return;
  
  try {
    const favorites = getFavoriteAds();
    
    // Check if already exists
    if (favorites.some(item => item.ad_id === ad.ad_id)) return;
    
    // Create a minimal ad object to store
    const adToStore = {
      ad_id: ad.ad_id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      images: ad.images?.slice(0, 1) || [],
      category: ad.category,
      subcategory: ad.subcategory,
      is_paid: ad.is_paid,
      favoritedAt: new Date().toISOString()
    };
    
    const updated = [adToStore, ...favorites];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add to favorites:', error);
  }
};

/**
 * Remove an ad from favorites
 * @param {string} adId - The ad ID to remove
 */
export const removeFromFavorites = (adId) => {
  try {
    const favorites = getFavoriteAds();
    const filtered = favorites.filter(item => item.ad_id !== adId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
  }
};

/**
 * Toggle favorite status
 * @param {Object} ad - The ad object
 * @returns {boolean} - New favorite status
 */
export const toggleFavorite = (ad) => {
  if (isFavorite(ad.ad_id)) {
    removeFromFavorites(ad.ad_id);
    return false;
  } else {
    addToFavorites(ad);
    return true;
  }
};

/**
 * Clear all favorites
 */
export const clearFavorites = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear favorites:', error);
  }
};

/**
 * Get favorite count
 * @returns {number}
 */
export const getFavoriteCount = () => {
  return getFavoriteAds().length;
};
