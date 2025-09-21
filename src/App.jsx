import { useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import WelcomePage from './components/WelcomePage'
import Dashboard from './components/Dashboard'
import './index.css'

function App() {
  const { isSignedIn } = useAuth()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: false, // Prevent refetch on component mount if data is fresh
        refetchOnReconnect: false, // Prevent refetch on network reconnect if data is fresh
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {isSignedIn ? <Dashboard /> : <WelcomePage />}
      </div>
    </QueryClientProvider>
  )
}

export default App
