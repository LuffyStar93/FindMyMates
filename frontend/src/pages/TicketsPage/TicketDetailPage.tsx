import EditTicketModal from '@/components/EditTicketModal/EditTicketModal'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import s from './TicketDetailPage.module.scss'

type UserLite = {
  id: number
  pseudo: string
  name?: string | null
  discordTag?: string | null
  reputationScore?: number | null
}

type GameLite = { id: number; name: string; coverUrl?: string | null }

type ModeLite = {
  id: number
  modeName: string
  playersMax: number
  isRanked?: boolean
  game?: GameLite
}

type TicketVM = {
  id: number
  status: 'open' | 'closed'
  isActive: boolean
  createdAt: string
  endedAt: string | null
  current: number
  max: number
  mode: ModeLite | null
  creator: UserLite | null
  participants: (UserLite & { joinedAt?: string | null })[]
}

type Vote = 'up' | 'down'
type MyVotesMap = Record<number, Vote>

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState<TicketVM | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const [showEdit, setShowEdit] = useState(false)

  const [myVotes, setMyVotes] = useState<MyVotesMap>({})
  const [loadingVotes, setLoadingVotes] = useState(false)

  const isCreator = useMemo(() => {
    if (!user || !ticket?.creator) return false
    return Number(user.id) === Number(ticket.creator.id)
  }, [user, ticket])

  const iAmParticipant = useMemo(() => {
    if (!user || !ticket) return false
    return ticket.participants.some((p) => p.id === Number(user.id))
  }, [user, ticket])

  const canJoin = useMemo(() => {
    if (!ticket) return false
    if (ticket.status !== 'open' || !ticket.isActive) return false
    if (!user) return false
    const already = ticket.participants.some((p) => p.id === Number(user.id))
    return !already
  }, [ticket, user])

  const mapTicket = (t: any): TicketVM => {
    const gm = t.gameMode ?? t.mode ?? t.GameMode ?? null
    const game = gm?.game ?? gm?.Game ?? null
    const rawParticipants = t.participants ?? t.Users ?? []

    const participants: (UserLite & { joinedAt?: string | null })[] = Array.isArray(
      rawParticipants
    )
      ? rawParticipants.map((p: any) => ({
          id: p.id,
          pseudo: p.pseudo ?? p.username ?? '',
          name: p.name ?? null,
          discordTag: p.discordTag ?? p.discord_tag ?? null,
          joinedAt: p.UserTicket?.joinedAt ?? p.joinedAt ?? null,
        }))
      : []

    const rawCreator = t.creator || t.user || t.User || null

    return {
      id: Number(t.id),
      status: (t.status as 'open' | 'closed') ?? 'open',
      isActive: !!t.isActive,
      createdAt: t.createdAt ?? t.created_at ?? new Date().toISOString(),
      endedAt: t.endedAt ?? t.ended_at ?? null,
      current: Number(
        t.nbPlayers ??
          t.nb_players ??
          (Array.isArray(rawParticipants) ? rawParticipants.length : 0)
      ),
      max: Number(t.capacity ?? gm?.playersMax ?? 0),
      mode: gm
        ? {
            id: gm.id,
            modeName: gm.modeName ?? gm.name ?? 'Mode',
            playersMax: gm.playersMax ?? gm.players_max ?? 0,
            isRanked: !!gm.isRanked,
            game: game
              ? {
                  id: game.id,
                  name: game.name,
                  coverUrl: game.urlImage ?? game.coverUrl ?? null,
                }
              : undefined,
          }
        : null,
      creator: rawCreator
        ? {
            id: rawCreator.id,
            pseudo: rawCreator.pseudo ?? rawCreator.username ?? '',
            name: rawCreator.name ?? null,
            discordTag:
              rawCreator.discordTag ?? rawCreator.discord_tag ?? null,
          }
        : null,
      participants,
    }
  }

  const load = async () => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/tickets/${ticketId}`)
      setTicket(mapTicket(data || {}))
    } catch (e: any) {
      const status = e?.response?.status
      const msg = e?.response?.data?.message
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      setError(msg || 'Impossible de charger le ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [ticketId])

  useEffect(() => {
    if (!ticket) return
    const openAndActive = ticket.status === 'open' && ticket.isActive

    if (openAndActive) {
      if (!user) {
        navigate('/browse', { replace: true })
      }
      return
    }
    const allowed = iAmParticipant || isCreator
    if (!allowed) navigate('/browse', { replace: true })
  }, [ticket, user, iAmParticipant, isCreator, navigate])

  // votes courants
  useEffect(() => {
    const fetchMyVotes = async () => {
      if (!user || !ticketId) {
        setMyVotes({})
        return
      }
      setLoadingVotes(true)
      try {
        const { data } = await api.get(`/tickets/${ticketId}/votes`, {
          params: { by: user.id },
        })
        const arr = Array.isArray(data) ? data : []
        const m: MyVotesMap = {}
        arr.forEach((v: any) => {
          if (
            typeof v?.targetUserId === 'number' &&
            (v.type === 'up' || v.type === 'down')
          ) {
            m[v.targetUserId] = v.type
          }
        })
        setMyVotes(m)
      } catch {
        setMyVotes({})
      } finally {
        setLoadingVotes(false)
      }
    }
    fetchMyVotes()
  }, [user, ticketId])

  const onJoin = async () => {
    if (!user || !ticketId) return
    setJoining(true)
    setError(null)
    setActionMsg(null)
    try {
      const { data } = await api.post(`/tickets/${ticketId}/join`, {
        userId: user.id,
      })
      const t = data?.ticket
      if (t) setTicket(mapTicket(t))
      setActionMsg('Vous avez rejoint le ticket.')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      setError(
        e?.response?.data?.message || 'Impossible de rejoindre ce ticket'
      )
    } finally {
      setJoining(false)
    }
  }

  const onClose = async () => {
    if (!ticketId) return
    setClosing(true)
    setError(null)
    setActionMsg(null)
    try {
      const { data } = await api.patch(`/tickets/${ticketId}/close`)
      const t = data?.ticket
      if (t) setTicket(mapTicket(t))
      else await load()
      setActionMsg('Ticket fermé.')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      setError(e?.response?.data?.message || 'Impossible de fermer ce ticket')
    } finally {
      setClosing(false)
    }
  }

  const handleCloseClick = async () => {
    if (!ticket) return
    const ok = window.confirm(
      `Fermer le ticket #${ticket.id} ?\n\nLes joueurs ne pourront plus le rejoindre.`
    )
    if (!ok) return
    await onClose()
  }

  const onEdit = () => {
    if (!ticket) return
    setShowEdit(true)
  }

  // VOTES
  const setVoteLocal = (targetId: number, type: Vote | null) => {
    setMyVotes((prev) => {
      const next = { ...prev }
      if (type === null) delete next[targetId]
      else next[targetId] = type
      return next
    })
  }

  const castOrSwitch = async (targetId: number, type: Vote) => {
    try {
      await api.post(`/tickets/${ticketId}/votes`, {
        voterUserId: user!.id,
        targetUserId: targetId,
        type,
      })
      setVoteLocal(targetId, type)
      return
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      if (status !== 409) {
        setError(e?.response?.data?.message || 'Vote impossible')
        return
      }
    }

    try {
      await api.put(`/tickets/${ticketId}/votes`, {
        voterUserId: user!.id,
        targetUserId: targetId,
        type,
      })
      setVoteLocal(targetId, type)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      try {
        await api.post(`/tickets/${ticketId}/votes`, {
          voterUserId: user!.id,
          targetUserId: targetId,
          type,
        })
        setVoteLocal(targetId, type)
      } catch (e2: any) {
        setError(e2?.response?.data?.message || 'Vote impossible')
      }
    }
  }

  const removeVote = async (targetId: number) => {
    try {
      await api.delete(`/tickets/${ticketId}/votes`, {
        data: { voterUserId: user!.id, targetUserId: targetId },
      })
      setVoteLocal(targetId, null)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        navigate('/browse', { replace: true })
        return
      }
      setError(
        e?.response?.data?.message || 'Impossible de retirer le vote'
      )
    }
  }

  const handleVoteClick = async (targetId: number, want: Vote) => {
    if (!user || !iAmParticipant) return
    const current = myVotes[targetId]
    if (current === want) {
      await removeVote(targetId)
    } else {
      await castOrSwitch(targetId, want)
    }
  }

  // REPORT
  const handleReportClick = (targetId: number) => {
    if (!ticketId) return
    navigate(`/reports/new?ticketId=${ticketId}&targetUserId=${targetId}`)
  }

  const titleRight = useMemo(() => {
    if (!ticket?.mode) return null
    return (
      <div className={s.modeInfo}>
        <span className={s.modeName}>{ticket.mode.modeName}</span>
        <span
          className={`${s.badge} ${
            ticket.mode.isRanked ? s.badgeRanked : s.badgeUnranked
          }`}
        >
          {ticket.mode.isRanked ? 'Ranked' : 'Unranked'}
        </span>
      </div>
    )
  }, [ticket])

  const currentGameId = ticket?.mode?.game?.id

  return (
    <section className={s.root}>
      <header className={s.header}>
        <div className={s.left}>
          <h1>Ticket #{ticketId}</h1>
          <div className={s.meta}>
            {ticket ? (
              <>
                <span
                  className={
                    ticket.status === 'open' ? s.statusOpen : s.statusClosed
                  }
                >
                  {ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
                </span>
                <span className={s.counter}>
                  {ticket.current} / {ticket.max} joueurs
                </span>
                {!ticket.isActive && ticket.status === 'open' && (
                  <span className={s.badgeFull}>Complet</span>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className={s.right}>
          {titleRight}
          <div className={s.headerActions}>
            <Link
              to={
                ticket?.mode?.game
                  ? `/browse/${ticket.mode.game.id}`
                  : '/browse'
              }
              className={s.back}
            >
              ← Retour
            </Link>
            {isCreator ? (
              <>
                <button
                  className={s.btnSecondary}
                  onClick={onEdit}
                  disabled={closing || loading}
                >
                  Modifier
                </button>
                <button
                  className={s.btnDanger}
                  onClick={handleCloseClick}
                  disabled={closing || loading || ticket?.status !== 'open'}
                >
                  {closing ? 'Fermeture…' : 'Fermer'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}
      {actionMsg && <p className={s.success}>{actionMsg}</p>}

      {loading ? (
        <p>Chargement…</p>
      ) : ticket ? (
        <div className={s.content}>
          <div className={s.card}>
            <h2>Participants</h2>
            {ticket.participants.length ? (
              <ul className={s.participants}>
                {ticket.participants.map((p) => {
                  const isMe = user && Number(user.id) === p.id
                  const vote = myVotes[p.id]
                  return (
                    <li key={p.id} className={s.participantRow}>
                      <div className={s.identity}>
                        <span className={s.pseudo}>{p.pseudo}</span>
                        {p.discordTag && (
                          <span className={s.discord}>· {p.discordTag}</span>
                        )}
                        {p.name ? (
                          <span className={s.name}>({p.name})</span>
                        ) : null}
                      </div>

                      {iAmParticipant && !isMe ? (
                        <div className={s.votes}>
                          <button
                            type="button"
                            className={`${s.voteBtn} ${
                              vote === 'up' ? s.voteActiveUp : ''
                            }`}
                            aria-pressed={vote === 'up'}
                            onClick={() => handleVoteClick(p.id, 'up')}
                            disabled={loadingVotes}
                            title={
                              vote === 'up'
                                ? 'Retirer mon vote positif'
                                : 'Voter +1'
                            }
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className={`${s.voteBtn} ${
                              vote === 'down' ? s.voteActiveDown : ''
                            }`}
                            aria-pressed={vote === 'down'}
                            onClick={() => handleVoteClick(p.id, 'down')}
                            disabled={loadingVotes}
                            title={
                              vote === 'down'
                                ? 'Retirer mon vote négatif'
                                : 'Voter -1'
                            }
                          >
                            ▼
                          </button>

                          <button
                            type="button"
                            className={s.reportBtn}
                            onClick={() => handleReportClick(p.id)}
                          >
                            Signaler
                          </button>
                        </div>
                      ) : (
                        <div className={s.votesPlaceholder} />
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>Aucun participant pour le moment.</p>
            )}
          </div>

          <div className={s.actions}>
            {!user ? (
              <Link to="/login" className={s.btnPrimary}>
                Se connecter pour rejoindre
              </Link>
            ) : (
              <button
                className={s.btnPrimary}
                onClick={onJoin}
                disabled={!canJoin || joining}
                title={
                  !ticket
                    ? ''
                    : ticket.status !== 'open'
                    ? 'Ticket fermé'
                    : !ticket.isActive
                    ? 'Ticket complet'
                    : !user
                    ? 'Connectez-vous'
                    : 'Rejoindre'
                }
              >
                {joining
                  ? 'Rejoindre…'
                  : canJoin
                  ? 'Rejoindre'
                  : 'Indisponible'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>Ticket introuvable.</p>
      )}

      {showEdit && ticket && currentGameId ? (
        <EditTicketModal
          ticketId={ticket.id}
          gameId={currentGameId}
          onClose={() => setShowEdit(false)}
          onSaved={() => load()}
        />
      ) : null}
    </section>
  )
}