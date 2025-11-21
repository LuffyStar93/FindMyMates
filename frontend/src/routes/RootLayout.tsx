import Footer from '@/components/Footer/Footer'
import Navbar from '@/components/Navbar/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Outlet } from 'react-router-dom'
import s from './RootLayout.module.scss'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  ['navLink', isActive ? 'active' : ''].join(' ')

export default function RootLayout() {
  const { user, loading, logout } = useAuth()
  const role = (user?.role ?? 'User') as 'User' | 'Moderator' | 'Admin'
  const isStaff = role === 'Admin' || role === 'Moderator'

  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={s.layout}>
      <Navbar />
      {/* Contenu principal */}
      <main className={s.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}