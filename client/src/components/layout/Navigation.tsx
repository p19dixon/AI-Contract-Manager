import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { clsx } from 'clsx'

interface NavigationProps {
  className?: string
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  staffOnly?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
      </svg>
    )
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    )
  },
  {
    name: 'Products',
    href: '/products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21l2-4m4 4l-2-4" />
      </svg>
    )
  },
  {
    name: 'Resellers',
    href: '/resellers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    staffOnly: true
  }
]

export function Navigation({ className }: NavigationProps) {
  const [location] = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className={clsx('nav-modern mt-4 bg-white shadow-sm border-b border-gray-100', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex flex-col items-center hover:opacity-90 transition-opacity">
                  <div className="mb-1">
                    <img 
                      src="/cap-logo.jpg" 
                      alt="CAP Logo" 
                      className="h-12 w-auto"
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Contract<span className="cap-text-green">Manager</span>
                  </span>
                </div>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.filter(item => !item.staffOnly || (user?.role && user.role !== 'customer')).map((item) => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href))
                
                return (
                  <Link key={item.name} href={item.href} className={clsx(
                    'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}>
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full cap-gradient-primary flex items-center justify-center shadow-sm">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {user?.name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="btn-modern border-primary/20 hover:bg-primary/5">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigationItems.filter(item => !item.staffOnly || (user?.role && user.role !== 'customer')).map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href))
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={clsx(
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
          
          {/* Mobile user menu */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}