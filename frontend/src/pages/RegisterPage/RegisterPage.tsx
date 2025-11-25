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

  // Erreur globale + erreurs par champ
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setFieldErrors({})

    // Petites validations front rapides
    if (!name || !pseudo || !email || !password) {
      setGlobalError('Merci de renseigner tous les champs.')
      return
    }
    if (password !== confirm) {
      setFieldErrors({ password: 'Les mots de passe ne correspondent pas.' })
      setGlobalError('Les mots de passe ne correspondent pas.')
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
      let global = 'Inscription impossible.'
      const perField: Record<string, string> = {}

      // Récupère les erreurs Zod du back
      if (data?.errors && typeof data.errors === 'object') {
        for (const [field, messages] of Object.entries<any>(data.errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            perField[field] = String(messages[0])
          }
        }

        if (Object.keys(perField).length > 0) {
          // 👉 On met un message global générique pour éviter le doublon
          global = 'Merci de corriger les erreurs ci-dessous.'
        } else if (typeof data.message === 'string') {
          global = data.message
        }
      } else if (typeof data?.message === 'string') {
        global = data.message
      } else if (typeof data?.error === 'string') {
        global = data.error
      } else if (typeof e?.message === 'string') {
        global = e.message
      }

      setFieldErrors(perField)
      setGlobalError(global)
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
          {/* Erreur globale en haut */}
          {globalError && <p className={s.error}>{globalError}</p>}

          <label className={s.field}>
            <span className={s.label}>Nom</span>
            <input
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
            {fieldErrors.name && <p className={s.error}>{fieldErrors.name}</p>}
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
            {fieldErrors.pseudo && <p className={s.error}>{fieldErrors.pseudo}</p>}
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
            {fieldErrors.email && <p className={s.error}>{fieldErrors.email}</p>}
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
            {fieldErrors.password && <p className={s.error}>{fieldErrors.password}</p>}
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