import { useAuth } from '@/context/AuthContext'
import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import s from './LoginPage.module.scss'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }

  const [emailOrPseudo, setEmailOrPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!emailOrPseudo || !password) {
      setError('Merci de remplir identifiant et mot de passe.')
      return
    }

    setSubmitting(true)
    try {
      await login(emailOrPseudo, password)
      const redirectTo = (location.state?.from as any)?.pathname || '/browse'
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      setError(err?.message ?? 'Identifiants invalides.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={s.root}>
      <div className={s.card}>
        <header className={s.header}>
          <h1 className={s.title}>Connexion</h1>
          <p className={s.subtitle}>
            Rejoins tes mates et retrouve tes tickets en quelques secondes.
          </p>
        </header>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          <label className={s.field}>
            <span className={s.label}>Email ou pseudo</span>
            <input
              className={s.input}
              value={emailOrPseudo}
              onChange={(e) => setEmailOrPseudo(e.target.value)}
              placeholder="you@example.com ou pseudo"
              autoComplete="username"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Mot de passe</span>
            <input
              className={s.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <p className={s.error}>{error}</p>}

          <div className={s.actions}>
            <button className={s.submit} type="submit" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>
        </form>

        <p className={s.helper}>
          Pas encore de compte ?{' '}
          <Link to="/register" className={s.link}>
            Créer un compte
          </Link>
        </p>
      </div>
    </section>
  )
}