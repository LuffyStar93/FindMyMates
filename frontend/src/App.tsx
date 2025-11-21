import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { router } from '@/routes/AppRoutes'
import { RouterProvider } from 'react-router-dom'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-shell">
          <RouterProvider router={router} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}