import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import s from './ReportsPage.module.scss'

type UserLite = { id: number; pseudo: string; name?: string | null }
type TicketLite = {
  id: number
  creator: UserLite | null
  participants: UserLite[]
}

const REASONS: { label: string; value: string }[] = [
  { label: 'Propos racistes', value: 'Propos racistes' },
  { label: 'Homophobie/Transphobie', value: 'Homophobie/Transphobie' },
  { label: 'Menace', value: 'Menace' },
  { label: 'Insulte', value: 'Insulte' },
  { label: 'Sexisme', value: 'Sexisme' },
  { label: 'Autres', value: 'Autres' },
]

export default function ReportsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const ticketId = Number(params.get('ticketId') || '')
  const targetUserId = Number(params.get('targetUserId') || '')

  const [ticket, setTicket] = useState<TicketLite | null>(null)
  const [targetUser, setTargetUser] = useState<UserLite | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [message, setMessage] = useState('')
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!Number.isFinite(ticketId) || !Number.isFinite(targetUserId)) {
      navigate('/browse', { replace: true })
    }
  }, [user, ticketId, targetUserId, navigate])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setError(null)
      try {
        const { data } = await api.get(`/tickets/${ticketId}`)
        if (cancelled) return

        const mapped: TicketLite = {
          id: Number(data?.id),
          creator: data?.creator
            ? { id: data.creator.id, pseudo: data.creator.pseudo, name: data.creator.name }
            : null,
          participants: Array.isArray(data?.participants)
            ? data.participants.map((p: any) => ({
                id: p.id,
                pseudo: p.pseudo,
                name: p.name,
              }))
            : [],
        }
        setTicket(mapped)

        const inCreator =
          mapped.creator && Number(mapped.creator.id) === Number(targetUserId)
            ? mapped.creator
            : null
        const inParticipants =
          mapped.participants.find((p) => Number(p.id) === Number(targetUserId)) || null

        if (inCreator || inParticipants) {
          setTargetUser(inCreator || inParticipants)
          return
        }
        const u = await api.get(`/users/${targetUserId}`)
        if (!cancelled && u?.data) {
          setTargetUser({ id: Number(u.data.id), pseudo: u.data.pseudo, name: u.data.name })
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Impossible de charger les informations')
        }
      }
    }

    if (Number.isFinite(ticketId) && Number.isFinite(targetUserId)) run()
    return () => {
      cancelled = true
    }
  }, [ticketId, targetUserId])

  // Titre compact : Ticket + pseudo
  const title = useMemo(() => {
    const t = ticket ? `Ticket #${ticket.id}` : `Ticket #${ticketId || '—'}`
    const target =
      targetUser?.pseudo
        ? `· Joueur ciblé ${targetUser.pseudo}`
        : `· Joueur ciblé #${targetUserId || '—'}`
    return `${t} ${target}`
  }, [ticket, targetUser, ticketId, targetUserId])

  // Back exige reason + description + ticketId
  const canSubmit = useMemo(() => {
    return Boolean(reason) && message.trim().length > 0
  }, [reason, message])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!ticketId || !targetUserId || !reason || message.trim().length === 0) {
      setError('Veuillez sélectionner un type de signalement et écrire un message.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await api.post('/reports', {
        ticketId,
        reason,
        description: message.trim(), 
        targetUserIds: [targetUserId], 

      })

      navigate(`/tickets/${ticketId}`, { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible d’envoyer le signalement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={s.root}>
      <header className={s.header}>
        <h1>{title}</h1>
        <Link to={ticket ? `/tickets/${ticket.id}` : '/browse'} className={s.back}>
          ← Retour
        </Link>
      </header>

      {error && <p className={s.error}>{error}</p>}

      <form className={s.form} onSubmit={onSubmit} noValidate>
        <div className={s.field}>
          <label>Type de signalement</label>
          <select
            className={s.select}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className={s.field}>
          <label>Message</label>
          <textarea
            className={s.textarea}
            rows={8}
            placeholder={
              reason === 'Autres'
                ? "Expliquez le problème (preuves, horodatage, etc.)."
                : "Ajoutez des précisions (preuves, horodatage, etc.)."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <small className={s.helpText}>
            Message obligatoire pour que le signalement soit pris en compte.
          </small>
        </div>

        <div className={s.actions}>
          <Link to={ticket ? `/tickets/${ticket.id}` : '/browse'} className={s.btnSecondary}>
            Annuler
          </Link>
          <button type="submit" className={s.btnPrimary} disabled={submitting || !canSubmit}>
            {submitting ? 'Envoi…' : 'Envoyer le signalement'}
          </button>
        </div>
      </form>
    </section>
  )
}