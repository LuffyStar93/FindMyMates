import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import s from './RegisterPage.module.scss'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: Location } }

  const [name, setName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !pseudo || !email || !password) {
      setError('Merci de renseigner tous les champs.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/auth/register', { email, pseudo, name, password })
      await login(email, password)
      const redirectTo = (location.state?.from as any)?.pathname || '/profile'
      navigate(redirectTo, { replace: true })
    } catch (e: any) {
      const data = e?.response?.data
      const msg: string =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof e?.message === 'string' && e.message) ||
        'Inscription impossible.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={s.root}>
      <div className={s.card}>
        <header className={s.header}>
          <h1 className={s.title}>Créer un compte</h1>
          <p className={s.subtitle}>
            Quelques infos et tu pourras commencer à créer ou rejoindre des tickets.
          </p>
        </header>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          <label className={s.field}>
            <span className={s.label}>Nom</span>
            <input
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Pseudo</span>
            <input
              className={s.input}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="jdoe"
              autoComplete="nickname"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Email</span>
            <input
              className={s.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Mot de passe</span>
            <input
              className={s.input}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Confirmer le mot de passe</span>
            <input
              className={s.input}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <p className={s.error}>{error}</p>}

          <div className={s.actions}>
            <button className={s.submit} type="submit" disabled={submitting}>
              {submitting ? 'Création…' : "S'inscrire"}
            </button>
          </div>
        </form>

        <p className={s.helper}>
          Tu as déjà un compte ?{' '}
          <Link to="/login" className={s.link}>
            Se connecter
          </Link>
        </p>
      </div>
    </section>
  )
}