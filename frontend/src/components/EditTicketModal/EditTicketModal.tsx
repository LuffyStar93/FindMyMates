import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import s from './EditTicketModal.module.scss'

type ModeLite = {
  id: number
  modeName?: string
  name?: string
  playersMax?: number
  isRanked?: boolean
}

type Props = {
  ticketId: number
  gameId: number
  onClose: () => void
  onSaved: () => void
}

export default function EditTicketModal({ ticketId, gameId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modes, setModes] = useState<ModeLite[]>([])
  const [modeId, setModeId] = useState<number | ''>('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [status, setStatus] = useState<'open' | 'closed'>('open')
  const [initialStatus, setInitialStatus] = useState<'open' | 'closed'>('open')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        setLoading(true)

        // Ticket (préremplis)
        const { data: t } = await api.get(`/tickets/${ticketId}`)
        if (!mounted) return

        const currentModeId = t?.gameMode?.id ?? t?.GameModeId ?? t?.gameModeId
        const currentCap = t?.capacity ?? t?.Capacity ?? t?.capacity
        const currentStatus: 'open' | 'closed' = t?.status === 'closed' ? 'closed' : 'open'

        setModeId(Number.isFinite(Number(currentModeId)) ? Number(currentModeId) : '')
        setCapacity(Number.isFinite(Number(currentCap)) ? Number(currentCap) : '')
        setStatus(currentStatus)
        setInitialStatus(currentStatus)

        // Modes du jeu
        let gmodes: any[] = []
        try {
          const { data: g } = await api.get(`/games/${gameId}`)
          gmodes = Array.isArray(g?.modes) ? g.modes : []
        } catch {
          const { data: list } = await api.get(`/game-modes`, { params: { gameId } })
          gmodes = Array.isArray(list) ? list : []
        }

        const mapped: ModeLite[] = gmodes.map((m: any) => ({
          id: Number(m.id ?? m.Id),
          modeName: m.modeName ?? m.mode_name ?? m.name ?? '',
          playersMax: Number(m.playersMax ?? m.players_max ?? m.maxPlayers ?? m.max_players ?? 0),
          isRanked: !!(m.isRanked ?? m.is_ranked),
        }))

        setModes(mapped)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Impossible de charger les données')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [ticketId, gameId])

  const selectedMode = useMemo(
    () => (modeId ? modes.find(m => m.id === Number(modeId)) ?? null : null),
    [modeId, modes]
  )

  const maxPlayers = selectedMode?.playersMax && selectedMode.playersMax > 0
    ? selectedMode.playersMax
    : undefined

  const onChangeMode = (val: string) => {
    const id = val ? Number(val) : ''
    setModeId(id)
    if (!id) return
    const m = modes.find(mm => mm.id === id)
    if (m?.playersMax && typeof capacity === 'number' && capacity > m.playersMax) {
      setCapacity(m.playersMax)
    }
  }

  const onChangeCapacity = (val: string) => {
    const onlyDigits = val.replace(/\D+/g, '')
    if (onlyDigits === '') { setCapacity(''); return }
    let n = Number(onlyDigits)
    if (n < 2) n = 2
    if (maxPlayers && n > maxPlayers) n = maxPlayers
    setCapacity(n)
  }

  const canSubmit =
    !!modeId &&
    typeof capacity === 'number' &&
    capacity >= 2 &&
    (!maxPlayers || capacity <= maxPlayers) &&
    (status === 'open' || status === 'closed')

  const handleSave = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const max = maxPlayers ?? capacity
      const finalCap =
        typeof capacity === 'number'
          ? (max ? Math.min(Math.max(2, capacity), max) : Math.max(2, capacity))
          : 2

      await api.put(`/tickets/${ticketId}`, {
        gameModeId: Number(modeId),
        capacity: finalCap,
        status,
      })
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible d’enregistrer le ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={s.backdrop} role="dialog" aria-modal="true">
      <div className={s.modal}>
        <h2 className={s.title}>Modifier le ticket</h2>

        {error && <p className={s.error}>{error}</p>}

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className={s.form}>
            <label className={s.field}>
              <span>Mode de jeu</span>
              <select
                className={s.select}
                value={modeId}
                onChange={(e) => onChangeMode(e.target.value)}
              >
                <option value="">— Choisir un mode —</option>
                {modes.map((m) => {
                  const label = (m.modeName?.trim() || m.name?.trim() || `Mode #${m.id}`)
                  return (
                    <option key={m.id} value={m.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className={s.field}>
              <span>Nombre de joueurs max</span>
              <input
                className={s.input}
                type="number"
                min={2}
                max={maxPlayers ?? undefined}
                value={capacity}
                onChange={(e) => onChangeCapacity(e.target.value)}
                placeholder="5"
              />
              <small className={s.hint}>
                Minimum 2 joueurs (toi + 1 mate)
                {maxPlayers ? ` — Limite pour ce mode : ${maxPlayers}` : ''}
              </small>
            </label>

            <label className={s.field}>
              <span>Statut</span>
              <select
                className={s.select}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value === 'closed' ? 'closed' : 'open')
                }
                disabled={initialStatus === 'closed'}
              >
                <option value="open">Ouvert</option>
                <option value="closed">Fermé</option>
              </select>
              {initialStatus === 'closed' && (
                <small className={s.hint}>
                  Ce ticket est déjà fermé et ne peut plus être réouvert.
                </small>
              )}
            </label>

            <div className={s.actions}>
              <button type="button" className={s.btnGhost} onClick={onClose}>Annuler</button>
              <button
                type="button"
                className={s.btnPrimary}
                onClick={handleSave}
                disabled={!canSubmit || saving}
                title={
                  !canSubmit && maxPlayers
                    ? `Capacité entre 2 et ${maxPlayers} joueurs`
                    : undefined
                }
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}