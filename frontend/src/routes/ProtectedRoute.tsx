import { useAuth } from '@/context/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p>Chargement…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  return <Outlet />
}
