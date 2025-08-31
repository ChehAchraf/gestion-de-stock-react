import { useState, useEffect } from 'react'
import { useUser, SignOutButton } from '@clerk/clerk-react'
import { Home, Package, ShoppingCart, BarChart3, LogOut } from 'lucide-react'
import HomePage from './HomePage'
import ProductsPage from './ProductsPage'
import SalesPage from './SalesPage'
import ReportsPage from './ReportsPage'

export default function Dashboard() {
  const { user } = useUser()
  const [activePage, setActivePage] = useState('home')

  const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'products', label: 'المنتجات', icon: Package },
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
  ]

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />
      case 'products':
        return <ProductsPage />
      case 'sales':
        return <SalesPage />
      case 'reports':
        return <ReportsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                نظام إدارة المنتجات والمبيعات
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                مرحباً، {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <SignOutButton>
                <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-2 transition-colors duration-200 ${
                      activePage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
