import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Menu, LogOut, User, PlusCircle, Grid, Heart, EyeOff } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { getFavoriteCount } from '../utils/favorites';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    // Update favorite count on mount and periodically
    const updateCount = () => setFavoriteCount(getFavoriteCount());
    updateCount();
    
    // Listen for storage changes (when favorites are updated in other tabs/components)
    window.addEventListener('storage', updateCount);
    
    // Also update on focus (when user returns to tab)
    window.addEventListener('focus', updateCount);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('focus', updateCount);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" data-testid="logo-link" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xl">A</span>
            </div>
            <span className="font-heading font-bold text-2xl text-primary">AdsHub</span>
          </Link>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Favorites button - always visible */}
            <Button
              data-testid="favorites-nav-btn"
              onClick={() => navigate('/favorites')}
              variant="ghost"
              className="relative rounded-full p-2"
              title={t('favorites.title', 'Favorites')}
            >
              <Heart className="w-5 h-5" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {favoriteCount > 9 ? '9+' : favoriteCount}
                </span>
              )}
            </Button>
            
            {user ? (
              <>
                <Button
                  data-testid="post-ad-nav-btn"
                  onClick={() => navigate('/post-ad')}
                  className="bg-accent text-white hover:bg-accent/90 h-11 px-8 rounded-full font-medium transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t('nav.postAd')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-testid="user-menu-btn"
                      variant="ghost"
                      className="rounded-full"
                    >
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="dashboard-menu-item">
                      <Grid className="w-4 h-4 mr-2" />
                      {t('nav.myDashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')} data-testid="favorites-menu-item">
                      <Heart className="w-4 h-4 mr-2" />
                      {t('favorites.title', 'Favorites')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/hidden-ads')} data-testid="hidden-ads-menu-item">
                      <EyeOff className="w-4 h-4 mr-2" />
                      {t('hiddenAds.title', 'Hidden Ads')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  data-testid="login-nav-btn"
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="h-11 px-6 rounded-full font-medium"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  data-testid="register-nav-btn"
                  onClick={() => navigate('/register')}
                  className="bg-primary text-white hover:bg-primary/90 h-11 px-8 rounded-full font-medium transition-all active:scale-95"
                >
                  {t('nav.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;