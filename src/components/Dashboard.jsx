import { useState, useEffect } from 'react'
import { useUser, SignOutButton } from '@clerk/clerk-react'
import { Home, Package, ShoppingCart, BarChart3, LogOut, Menu, X, Tag } from 'lucide-react'
import HomePage from './HomePage'
import ProductsPage from './ProductsPage'
import SalesPage from './SalesPage'
import ReportsPage from './ReportsPage'
import CategoriesPage from './CategoriesPage'

export default function Dashboard() {
  const { user } = useUser()
  const [activePage, setActivePage] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'products', label: 'المنتجات', icon: Package },
    { id: 'categories', label: 'الفئات', icon: Tag },
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
  ]

  const handleNavigate = (page) => {
    setActivePage(page)
    setSidebarOpen(false) // إغلاق الشريط الجانبي عند التنقل
  }

  const handleOverlayClick = () => {
    setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />
      case 'products':
        return <ProductsPage />
      case 'categories':
        return <CategoriesPage />
      case 'sales':
        return <SalesPage />
      case 'reports':
        return <ReportsPage />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row-reverse justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-700 hidden sm:block">
                مرحباً، {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <SignOutButton>
                <button className="flex items-center px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                  <LogOut className="w-4 h-4 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
              </SignOutButton>
            </div>
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                نظام إدارة المنتجات والمبيعات
              </h1>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">القائمة</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="mt-4">
            <div className="px-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 transition-colors duration-200 ${
                      activePage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={handleOverlayClick}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
