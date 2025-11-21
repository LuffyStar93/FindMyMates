import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import s from './ProfilePage.module.scss'

type Stats = {
  createdTickets: number
  joinedTickets: number
  reportsReceived: number
  reputation: { up: number; down: number }
}

type GameLite = { id: number; name: string; urlImage?: string | null }
type ModeLite = {
  id: number
  modeName: string
  playersMax: number
  isRanked?: boolean
  game?: GameLite
}

type TicketLite = {
  id: number
  status: 'open' | 'closed'
  isActive: boolean
  createdAt: string
  endedAt: string | null
  nbPlayers?: number
  capacity?: number
  gameMode?: ModeLite | null
}

type RankLabel = { id: number; rankName: string }

type GameWithModes = {
  id: number
  name: string
  urlImage?: string | null
  modes: { id: number; modeName: string; isRanked?: boolean }[]
}

type UserRankRow = {
  id: number
  gameId: number
  gameModeId: number | null
  rankId: number
  gameName?: string | null
  gameModeName?: string | null
  rankName?: string | null
}

export default function ProfilePage() {
  const { user: userCtx, refreshMe } = useAuth()
  const userId = userCtx?.id

  // Profil
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [discordTag, setDiscordTag] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Historique
  const [joined, setJoined] = useState<TicketLite[]>([])
  const [loadingJoined, setLoadingJoined] = useState(true)

  // Rangs
  const [games, setGames] = useState<GameWithModes[]>([])
  const [userRanksList, setUserRanksList] = useState<UserRankRow[]>([])
  const [userRanksMap, setUserRanksMap] = useState<Record<string, number>>({})
  const [loadingRanks, setLoadingRanks] = useState(true)
  const [ranksError, setRanksError] = useState<string | null>(null)
  const [ranksSuccess, setRanksSuccess] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | ''>('')
  const [selectedModeId, setSelectedModeId] = useState<number | ''>('')
  const [modeRanks, setModeRanks] = useState<RankLabel[]>([])
  const [selectedRankId, setSelectedRankId] = useState<number | ''>('')
  const [savingMode, setSavingMode] = useState(false)

  // Derived
  const selectableGames = useMemo(
    () => games.filter((g) => g.modes?.some((m) => m.isRanked)),
    [games]
  )

  const rankedModesForSelectedGame = useMemo(() => {
    if (!selectedGameId) return []
    const g = selectableGames.find((x) => x.id === Number(selectedGameId))
    return g ? g.modes.filter((m) => m.isRanked) : []
  }, [selectableGames, selectedGameId])

  // Load profil & stats
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/auth/me')
        const u = data.user ?? data
        setName(u.name ?? '')
        setPseudo(u.pseudo ?? '')
        setEmail(u.email ?? '')
        setDiscordTag(u.discordTag ?? '')
        setStats(data.stats ?? null)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Erreur chargement profil')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Load tickets
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        setLoadingJoined(true)
        const { data } = await api.get(`/users/${userId}/tickets`, {
          params: { role: 'participant', limit: 20, order: 'desc' },
        })
        setJoined(Array.isArray(data) ? data : [])
      } finally {
        setLoadingJoined(false)
      }
    })()
  }, [userId])

  // Load ranks
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        setLoadingRanks(true)
        const { data: gamesList } = await api.get('/games')
        const baseGames: GameWithModes[] = Array.isArray(gamesList)
          ? gamesList.map((g: any) => ({
              id: g.id,
              name: g.name,
              urlImage: g.urlImage ?? g.coverUrl ?? null,
              modes: Array.isArray(g.modes)
                ? g.modes.map((m: any) => ({
                    id: m.id,
                    modeName: m.modeName ?? m.name,
                    isRanked: !!m.isRanked,
                  }))
                : [],
            }))
          : []

        const { list, map } = await fetchUserRanksListAndMap(userId)
        setGames(baseGames)
        setUserRanksList(list)
        setUserRanksMap(map)

        const rankedGames = baseGames.filter((g) =>
          g.modes.some((m) => m.isRanked)
        )
        if (rankedGames.length === 1) {
          const g = rankedGames[0]
          setSelectedGameId(g.id)
          const rankedModes = g.modes.filter((m) => m.isRanked)
          if (rankedModes.length === 1)
            handleModePrime(g.id, rankedModes[0].id, map)
        }
      } catch (e: any) {
        setRanksError(e?.response?.data?.message || 'Erreur chargement rangs')
      } finally {
        setLoadingRanks(false)
      }
    })()
  }, [userId])

  // Helpers
  async function fetchUserRanksListAndMap(uid: number) {
    try {
      const { data } = await api.get(`/user-ranks/${uid}`)
      const rows: UserRankRow[] = Array.isArray(data) ? data : []
      const filtered = rows.filter((r) => r.gameModeId != null)
      const map: Record<string, number> = {}
      filtered.forEach((r) => (map[`${r.gameId}:${r.gameModeId}`] = r.rankId))
      return { list: filtered, map }
    } catch {
      return { list: [], map: {} }
    }
  }

  async function handleModePrime(
    gameId: number,
    modeId: number,
    map: Record<string, number>
  ) {
    setSelectedModeId(modeId)
    setModeRanks([])
    setSelectedRankId('')
    try {
      const { data } = await api.get(`/ranks/by-gamemode/${modeId}`)
      const ranks: RankLabel[] = Array.isArray(data?.ranks)
        ? data.ranks.map((r: any) => ({ id: r.id, rankName: r.rankName }))
        : []
      setModeRanks(ranks)
      const existing = map[`${gameId}:${modeId}`]
      if (existing) setSelectedRankId(existing)
    } catch {
      setModeRanks([])
    }
  }

  // Handlers Rangs
  const handleGameChange = async (val: string) => {
    const gameId = val ? Number(val) : ''
    setSelectedGameId(gameId)
    setSelectedModeId('')
    setModeRanks([])
    setSelectedRankId('')
    const g = selectableGames.find((g) => g.id === gameId)
    if (g) {
      const ranked = g.modes.filter((m) => m.isRanked)
      if (ranked.length === 1) handleModePrime(g.id, ranked[0].id, userRanksMap)
    }
  }

  const handleModeChange = async (val: string) => {
    const modeId = val ? Number(val) : ''
    setSelectedModeId(modeId)
    setModeRanks([])
    setSelectedRankId('')
    if (selectedGameId && modeId)
      handleModePrime(Number(selectedGameId), modeId, userRanksMap)
  }

  const saveModeRank = async () => {
    if (!userId || !selectedGameId || !selectedModeId) return
    setSavingMode(true)
    setRanksError(null)
    setRanksSuccess(null)
    try {
      if (selectedRankId === '') {
        await api.delete(
          `/user-ranks/${userId}/${selectedGameId}/${selectedModeId}`
        )
      } else {
        await api.post(`/user-ranks/${userId}`, {
          rankId: Number(selectedRankId),
        })
      }
      const { list, map } = await fetchUserRanksListAndMap(userId)
      setUserRanksList(list)
      setUserRanksMap(map)
      setRanksSuccess('Rang enregistré.')
    } catch (e: any) {
      setRanksError(
        e?.response?.data?.message || 'Erreur enregistrement rang'
      )
    } finally {
      setSavingMode(false)
    }
  }

  const quickEdit = (r: UserRankRow) => {
    setSelectedGameId(r.gameId)
    if (r.gameModeId) handleModePrime(r.gameId, r.gameModeId, userRanksMap)
  }

  const quickDelete = async (r: UserRankRow) => {
    await api.delete(`/user-ranks/${userId}/${r.gameId}/${r.gameModeId}`)
    const { list, map } = await fetchUserRanksListAndMap(userId!)
    setUserRanksList(list)
    setUserRanksMap(map)
  }

  // Profil handlers
  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSavingProfile(true)
    try {
      const payload: any = {
        name,
        pseudo,
      }

      if (!discordTag || discordTag.trim() === '') {
        payload.discordTag = null
      } else {
        payload.discordTag = discordTag.trim()
      }

      await api.put(`/users/${userId}`, payload)
      setSuccess('Profil mis à jour.')
      await refreshMe()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur mise à jour profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!newPassword || newPassword !== confirmPassword)
      return setError('Les mots de passe ne correspondent pas.')
    setSavingPassword(true)
    try {
      await api.put(`/users/${userId}/password`, {
        currentPassword,
        newPassword,
      })
      setSuccess('Mot de passe mis à jour.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur changement mot de passe')
    } finally {
      setSavingPassword(false)
    }
  }

  // Rendu
  if (loading) return <p>Chargement…</p>
  if (!userId) return <p>Non connecté.</p>

  return (
    <section className={s.root}>
      <h1>Mon profil</h1>

      {(error || success) && (
        <div className={s.feedback}>
          {error && <p className={s.error}>{error}</p>}
          {success && <p className={s.success}>{success}</p>}
        </div>
      )}

      {/* SECTION RANGS */}
      <section className={s.card}>
        <h2>Rangs</h2>

        {ranksError && <p className={s.error}>{ranksError}</p>}
        {ranksSuccess && <p className={s.success}>{ranksSuccess}</p>}

        {loadingRanks ? (
          <p>Chargement…</p>
        ) : (
          <>
            <label className={s.fieldInline}>
              <span>Jeu</span>
              <select
                className={s.select}
                value={selectedGameId}
                onChange={(e) => handleGameChange(e.target.value)}
              >
                <option value="">— Sélectionner un jeu —</option>
                {selectableGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedGameId && (
              <div className={s.rankBlock}>
                <label className={s.fieldInline}>
                  <span>Mode classé</span>
                  <select
                    className={s.select}
                    value={selectedModeId}
                    onChange={(e) => handleModeChange(e.target.value)}
                  >
                    <option value="">— Choisir un mode —</option>
                    {rankedModesForSelectedGame.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.modeName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={s.fieldInline}>
                  <span>Rang</span>
                  <select
                    className={s.select}
                    value={selectedRankId}
                    onChange={(e) =>
                      setSelectedRankId(
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                    disabled={!selectedModeId}
                  >
                    <option value="">Non classé</option>
                    {modeRanks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rankName}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={s.actionsRight}>
                  <button
                    className={s.btnPrimary}
                    onClick={saveModeRank}
                    disabled={!selectedModeId || savingMode}
                    type="button"
                  >
                    {savingMode ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {/* Mes rangs */}
            <div className={s.rankBlock}>
              <h3>Mes rangs enregistrés</h3>
              {userRanksList.length === 0 ? (
                <p>Aucun rang enregistré.</p>
              ) : (
                <ul className={s.ranksList}>
                  {userRanksList.map((r) => (
                    <li
                      key={`${r.gameId}:${r.gameModeId}`}
                      className={s.rankItem}
                    >
                      <div>
                        <strong>{r.gameName}</strong> · {r.gameModeName} →{' '}
                        <em>{r.rankName}</em>
                      </div>
                      <div className={s.rankItemActions}>
                        <button
                          type="button"
                          onClick={() => quickEdit(r)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => quickDelete(r)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      {/* INFORMATIONS */}
      <form className={s.card} onSubmit={onSaveProfile} noValidate>
        <h2>Informations</h2>

        <label className={s.field}>
          <span>Email</span>
          <input
            value={email}
            readOnly
            className={`${s.input} ${s.readonly}`}
          />
        </label>

        <label className={s.field}>
          <span>Nom</span>
          <input
            value={name}
            readOnly
            className={`${s.input} ${s.readonly}`}
          />
        </label>

        <label className={s.field}>
          <span>Pseudo</span>
          <input
            value={pseudo}
            readOnly
            className={`${s.input} ${s.readonly}`}
          />
        </label>

        <label className={s.field}>
          <span>Tag Discord</span>
          <input
            className={s.input}
            placeholder="ex: monpseudo#1234"
            value={discordTag}
            onChange={(e) => setDiscordTag(e.target.value)}
          />
          <small className={s.helpText}>ex: monpseudo#1234</small>
        </label>

        <div className={s.actions}>
          <button
            className={s.btnPrimary}
            type="submit"
            disabled={savingProfile}
          >
            {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {/* MOT DE PASSE */}
      <form className={s.card} onSubmit={onChangePassword}>
        <h2>Mot de passe</h2>
        <label className={s.field}>
          <span>Actuel</span>
          <input
            className={s.input}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className={s.field}>
          <span>Nouveau</span>
          <input
            className={s.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className={s.field}>
          <span>Confirmation</span>
          <input
            className={s.input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <div className={s.actions}>
          <button
            className={s.btnPrimary}
            disabled={savingPassword}
          >
            {savingPassword ? '...' : 'Mettre à jour'}
          </button>
        </div>
      </form>

      {/* STATS */}
      {stats && (
        <div className={s.stats}>
          <div className={s.stat}>
            <div>Tickets créés</div>
            <strong>{stats.createdTickets}</strong>
          </div>
          <div className={s.stat}>
            <div>Tickets rejoints</div>
            <strong>{stats.joinedTickets}</strong>
          </div>
          <div className={s.stat}>
            <div>Réputation</div>
            <strong>{stats.reputation.up - stats.reputation.down}</strong>
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      <section className={s.ticketsSection}>
        <h2>Historique — Tickets rejoints</h2>
        {loadingJoined ? (
          <p>Chargement…</p>
        ) : joined.length === 0 ? (
          <p>Aucun ticket rejoint.</p>
        ) : (
          <div className={s.cardsGrid}>
            {joined.map((t) => {
              const gm = t.gameMode
              const game = gm?.game
              return (
                <Link
                  to={`/tickets/${t.id}`}
                  key={t.id}
                  className={s.cardTicket}
                >
                  {game?.urlImage && (
                    <img src={game.urlImage} alt={game.name || 'cover'} />
                  )}
                  <div className={s.content}>
                    <h3>
                      {game?.name} · {gm?.modeName}
                    </h3>
                    <div>
                      {t.nbPlayers}/{t.capacity} joueurs
                    </div>
                    <time>{new Date(t.createdAt).toLocaleString()}</time>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}