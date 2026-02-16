// Utility functions for managing excluded/hidden ads in localStorage

const STORAGE_KEY = 'excludedAds';

/**
 * Get all excluded ad IDs from localStorage
 * @returns {Array} Array of ad IDs
 */
export const getExcludedAds = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get excluded ads:', error);
    return [];
  }
};

/**
 * Check if an ad is excluded
 * @param {string} adId - The ad ID to check
 * @returns {boolean}
 */
export const isExcluded = (adId) => {
  const excluded = getExcludedAds();
  return excluded.includes(adId);
};

/**
 * Add an ad to excluded list
 * @param {string} adId - The ad ID to exclude
 */
export const excludeAd = (adId) => {
  if (!adId) return;
  
  try {
    const excluded = getExcludedAds();
    
    // Check if already excluded
    if (excluded.includes(adId)) return;
    
    const updated = [...excluded, adId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to exclude ad:', error);
  }
};

/**
 * Remove an ad from excluded list (restore visibility)
 * @param {string} adId - The ad ID to restore
 */
export const restoreAd = (adId) => {
  try {
    const excluded = getExcludedAds();
    const filtered = excluded.filter(id => id !== adId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to restore ad:', error);
  }
};

/**
 * Clear all excluded ads
 */
export const clearExcludedAds = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear excluded ads:', error);
  }
};

/**
 * Get excluded count
 * @returns {number}
 */
export const getExcludedCount = () => {
  return getExcludedAds().length;
};

/**
 * Filter out excluded ads from a list
 * @param {Array} ads - Array of ad objects
 * @returns {Array} Filtered array without excluded ads
 */
export const filterExcludedAds = (ads) => {
  const excluded = getExcludedAds();
  return ads.filter(ad => !excluded.includes(ad.ad_id));
};
