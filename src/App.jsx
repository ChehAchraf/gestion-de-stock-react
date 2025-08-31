import { useAuth } from '@clerk/clerk-react'
import WelcomePage from './components/WelcomePage'
import Dashboard from './components/Dashboard'
import './index.css'

function App() {
  const { isSignedIn } = useAuth()

  return (
    <div className="App">
      {isSignedIn ? <Dashboard /> : <WelcomePage />}
    </div>
  )
}

export default App
