import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import s from './Navbar.module.scss'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [s.navLink, isActive ? s.active : ''].filter(Boolean).join(' ')

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const role = (user?.role ?? 'User') as 'User' | 'Moderator' | 'Admin'
  const isStaff = role === 'Admin' || role === 'Moderator'

  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className={s.topbar}>
      <div className={`container ${s.topbarInner}`}>
        {/* Burger (mobile) */}
        <button
          type="button"
          className={s.burgerBtn}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className={[s.burgerLines, mobileOpen ? s.open : ''].join(' ')}>
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Nav desktop */}
        <nav className={s.navLeft} aria-label="Navigation principale">
          <NavLink to="/" className={navLinkClass}>
            Accueil
          </NavLink>
          <NavLink to="/faq" className={navLinkClass}>
            FAQ
          </NavLink>

          {user && (
            <NavLink to="/browse" className={navLinkClass}>
              Parcourir
            </NavLink>
          )}

          {user && isStaff && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right desktop */}
        <div className={s.navRight}>
          {/* switch thème */}
          <button
            type="button"
            className="themeToggle"
            onClick={toggleTheme}
            aria-label="Basculer le thème clair/sombre"
          >
            <span className="themeToggle-track">
              <span
                className={[
                  'themeToggle-thumb',
                  isDark ? 'is-dark' : 'is-light',
                ].join(' ')}
              />
            </span>
            <span className="themeToggle-label">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {loading ? (
            <span>Chargement…</span>
          ) : user ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                {user.pseudo ?? user.email}
              </NavLink>
              <button type="button" className="btn" onClick={logout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Connexion
              </NavLink>
              <span className={s.dot}>·</span>
              <NavLink to="/register" className={navLinkClass}>
                Inscription
              </NavLink>
            </>
          )}
        </div>

        {/* Menu mobile déroulant */}
        {mobileOpen && (
          <nav className={s.mobileMenu} aria-label="Menu mobile">
            <NavLink to="/" className={navLinkClass} onClick={closeMobile}>
              Accueil
            </NavLink>
            <NavLink to="/faq" className={navLinkClass} onClick={closeMobile}>
              FAQ
            </NavLink>

            {user && (
              <NavLink to="/browse" className={navLinkClass} onClick={closeMobile}>
                Parcourir
              </NavLink>
            )}

            {user && isStaff && (
              <NavLink to="/admin" className={navLinkClass} onClick={closeMobile}>
                Admin
              </NavLink>
            )}

            <div className={s.mobileMenuDivider} />

            <button
              type="button"
              className={`themeToggle ${s.mobileThemeToggle}`}
              onClick={toggleTheme}
              aria-label="Basculer le thème clair/sombre"
            >
              <span className="themeToggle-track">
                <span
                  className={[
                    'themeToggle-thumb',
                    isDark ? 'is-dark' : 'is-light',
                  ].join(' ')}
                />
              </span>
              <span className="themeToggle-label">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>

            {loading ? (
              <span>Chargement…</span>
            ) : user ? (
              <>
                <NavLink to="/profile" className={navLinkClass} onClick={closeMobile}>
                  {user.pseudo ?? user.email}
                </NavLink>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    closeMobile()
                    logout()
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass} onClick={closeMobile}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass} onClick={closeMobile}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}