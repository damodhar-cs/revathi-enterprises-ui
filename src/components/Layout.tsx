import React, { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Users, User, Package, Building2, Layers, BarChart3, ShoppingCart, UserCircle } from 'lucide-react'

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsProfileDropdownOpen(false)
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setIsProfileDropdownOpen(false)
  }

  // Get user initials
  const getUserInitials = () => {
    if (!user?.firstName) return 'U'
    const firstInitial = user.firstName[0]
    const lastInitial = user.lastName?.[0] || ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  // Logo component with fallback strategy
  const LogoComponent = () => {
    // Try to load the logo, fallback if it doesn't exist
    const logoPath = '/src/assets/images/logos/re-company-logo.png'
    
    if (!logoError) {
      return (
        <img 
          src={logoPath}
          alt="RE Company Logo"
          className="w-16 h-12 object-contain"
          onError={() => setLogoError(true)}
        />
      )
    }
    
    // Fallback icon if logo fails to load or doesn't exist
    return (
      <div className="flex items-center justify-center w-16 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg shadow-sm">
        <Building2 className="w-8 h-8 text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Brand and Navigation */}
            <div className="flex items-center">
              {/* Brand/Logo Section */}
              <div className="flex items-center space-x-3 mr-8">
                <LogoComponent />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    Revathi Enterprises
                  </h1>
                  <p className="text-xs text-gray-500 leading-none">Variant CRM</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex space-x-1">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/products"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/products') 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </Link>
                <Link
                  to="/variants"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/') || isActive('/variants') 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Variants
                </Link>
                <Link
                  to="/sales"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/sales') 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sales
                </Link>
                <Link
                  to="/customers"
                  className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/customers') 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Customers
                </Link>
              </div>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center space-x-4">
              {/* Users Link */}
              <Link
                to="/users"
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/users') 
                    ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:ring-2 hover:ring-primary-200 transition-all"
                  title="Profile Menu"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-sm font-bold shadow-sm hover:shadow-md transition-shadow">
                    {getUserInitials()}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        View Profile
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout 