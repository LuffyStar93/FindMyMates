import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import s from './CreateTicketModal.module.scss'

type ModeLite = {
  id: number
  name: string
  playersMax: number
  isRanked?: boolean
}

type Props = {
  gameId: number
  gameName: string
  modes: ModeLite[]
  isOpen: boolean
  onClose: () => void
  onCreated: (ticketId: number) => void
}

export default function CreateTicketModal({
  gameId,
  gameName,
  modes,
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const { user } = useAuth()

  const [modeId, setModeId] = useState<string>('')
  const [playersWanted, setPlayersWanted] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setModeId('')
      setPlayersWanted('')
      setSubmitting(false)
      setError(null)
    }
  }, [isOpen])

  const selectedMode = useMemo(
    () => (modeId ? modes.find((m) => m.id === Number(modeId)) ?? null : null),
    [modeId, modes]
  )

  const ranked = !!selectedMode?.isRanked

  const playersOptions = useMemo(() => {
    if (!selectedMode) return []
    const maxOtherPlayers = Math.max(1, selectedMode.playersMax - 1)
    return Array.from({ length: maxOtherPlayers }, (_, i) => i + 1)
  }, [selectedMode])

  const canSubmit = Boolean(
    user && selectedMode && playersWanted && Number(playersWanted) > 0
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !user || !selectedMode) return
    setSubmitting(true)
    setError(null)
    try {
      // capacity = vous (1) + joueurs recherchés
      const capacity = Number(playersWanted) + 1
      const body = {
        userId: Number(user.id),
        gameModeId: Number(modeId),
        capacity,
      }
      const { data } = await api.post('/tickets', body)
      const newId = Number(data?.ticket?.id ?? data?.id)
      if (Number.isFinite(newId)) {
        onCreated(newId)
        onClose()
      } else {
        setError("Le ticket a été créé mais l'identifiant est introuvable.")
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de créer le ticket')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={s.overlay} role="dialog" aria-modal="true">
      <div className={s.modal}>
        <header className={s.header}>
          <h2>Créer un ticket</h2>
          <button className={s.close} onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <form className={s.form} onSubmit={onSubmit}>
          {/* Jeu */}
          <div className={s.row}>
            <label className={s.label}>Jeu</label>
            <div className={s.readonly}>{gameName}</div>
          </div>

          {/* Mode + badge Ranked/Unranked */}
          <div className={s.row}>
            <label htmlFor="mode" className={s.label}>Mode de jeu</label>
            <div className={s.modeRow}>
              <select
                id="mode"
                className={s.select}
                value={modeId}
                onChange={(e) => setModeId(e.target.value)}
                required
              >
                <option value="">Sélectionner un mode…</option>
                {modes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {selectedMode ? (
                <span className={`${s.badge} ${ranked ? s.badgeRanked : s.badgeUnranked}`}>
                  {ranked ? 'Ranked' : 'Unranked'}
                </span>
              ) : null}
            </div>
          </div>

          {/* Joueurs recherchés (hors vous) */}
          <div className={s.row}>
            <label htmlFor="players" className={s.label}>Joueurs recherchés</label>
            <select
              id="players"
              className={s.select}
              value={playersWanted}
              onChange={(e) => setPlayersWanted(e.target.value)}
              disabled={!selectedMode}
              required
            >
              <option value="" disabled>
                Joueurs recherchés (hors vous)
              </option>
              {playersOptions.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'joueur' : 'joueurs'}
                </option>
              ))}
            </select>
            {selectedMode && (
              <small className={s.help}>
                Capacité totale = vous + joueurs recherchés (max {selectedMode.playersMax})
              </small>
            )}
          </div>

          {error && <p className={s.error}>{error}</p>}

          <footer className={s.footer}>
            <button type="button" className={s.btnSecondary} onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className={s.btnPrimary} disabled={!canSubmit || submitting}>
              {submitting ? 'Création…' : 'Créer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}