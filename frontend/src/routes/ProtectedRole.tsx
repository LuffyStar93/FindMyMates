import { useAuth } from '@/context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

type Props = { allow: Array<'User' | 'Moderator' | 'Admin'> }

export default function ProtectedRole({ allow }: Props) {
  const { user, loading } = useAuth()
  if (loading) return <p>Chargement…</p>
  if (!user) return <Navigate to="/login" replace />
  const role = (user.role ?? 'User') as 'User' | 'Moderator' | 'Admin'
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return <Outlet />
}
