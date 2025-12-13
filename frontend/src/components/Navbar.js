import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Menu, LogOut, User, PlusCircle, Grid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            {user ? (
              <>
                <Button
                  data-testid="post-ad-nav-btn"
                  onClick={() => navigate('/post-ad')}
                  className="bg-accent text-white hover:bg-accent/90 h-11 px-8 rounded-full font-medium transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Post Ad
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
                      My Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
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
                  Login
                </Button>
                <Button
                  data-testid="register-nav-btn"
                  onClick={() => navigate('/register')}
                  className="bg-primary text-white hover:bg-primary/90 h-11 px-8 rounded-full font-medium transition-all active:scale-95"
                >
                  Sign Up
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