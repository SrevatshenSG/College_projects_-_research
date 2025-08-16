import { Link } from 'react-router-dom';
import { LogOut, User, Plus } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export const Navbar = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Brand */}
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span>AdGen</span>
            </Link>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            <Link
              to="/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}; 