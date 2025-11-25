import CreateTicketModal from '@/components/CreateTicketModal/CreateTicketModal'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import s from './GameDetailPage.module.scss'

type Mode = {
  id: number
  name: string
  playersMax: number
  isRanked?: boolean
}

type Rank = { id: number; name: string }

type Game = {
  id: number
  name: string
  coverUrl?: string | null
  modes: Mode[]
  ranks?: Rank[]
}

type Ticket = {
  id: number
  status: 'open' | 'closed'
  createdAt: string
  endedAt: string | null
  isActive: boolean
  modeId: number
  modeName: string
  current: number
  max: number
  isRanked?: boolean
  ownerId?: number
  creator?: { id: number; pseudo: string; name?: string | null } | null
  participants?: {
    id: number
    pseudo: string
    name?: string | null
    joinedAt?: string | null
  }[]
}

type PageMeta = { page: number; limit: number; total: number; pageCount: number }

const PAGE_SIZE = 50

export default function GameDetailPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [params, setParams] = useSearchParams()

  const modeId = params.get('modeId') ?? ''
  const rankId = params.get('rankId') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? 1))

  const [game, setGame] = useState<Game | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [meta, setMeta] = useState<PageMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })
  const [openCount, setOpenCount] = useState<number>(0)

  const [loadingGame, setLoadingGame] = useState(true)
  const [loadingFirst, setLoadingFirst] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)

  // Charger infos jeu
  useEffect(() => {
    let cancelled = false
    if (!gameId) return
    ;(async () => {
      setLoadingGame(true)
      setError(null)
      try {
        const { data } = await api.get(`/games/${gameId}`)
        if (cancelled) return
        setGame(data)
      } catch (e: any) {
        if (!cancelled)
          setError(e?.response?.data?.message || 'Impossible de charger le jeu')
      } finally {
        if (!cancelled) setLoadingGame(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gameId])

  const selectedMode = useMemo(() => {
    if (!game || !modeId) return null
    const idNum = Number(modeId)
    if (!Number.isFinite(idNum)) return null
    return game.modes.find((m) => m.id === idNum) ?? null
  }, [game, modeId])

  const modeIsRanked = Boolean(selectedMode?.isRanked)

  const setParam = (key: 'modeId' | 'rankId' | 'page', value: string | number) => {
    const next = new URLSearchParams(params)
    if (key === 'page') {
      const v = String(value)
      if (v && v !== '1') next.set('page', v)
      else next.delete('page')
    } else {
      const v = String(value)
      if (v) next.set(key, v)
      else next.delete(key)
      next.delete('page')
    }
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (!modeIsRanked && rankId) {
      setParam('rankId', '')
    }
  }, [modeIsRanked])

  const lastReqId = useRef(0)
  useEffect(() => {
    let cancelled = false
    if (!gameId) return

    const reqId = ++lastReqId.current
    const isFirstPage = page === 1
    setError(null)
    setLoadingFirst(isFirstPage)
    setLoadingMore(!isFirstPage)

    ;(async () => {
      try {
        const { data } = await api.get(`/games/${gameId}/tickets`, {
          params: {
            modeId: modeId || undefined,
            rankId: modeIsRanked ? (rankId || undefined) : undefined,
            status: 'open',
            page,
            limit: PAGE_SIZE,
          },
        })

        if (cancelled || reqId !== lastReqId.current) return
        const rawItems = Array.isArray((data as any)?.items) ? (data as any).items : []
        const items: Ticket[] = rawItems.map((raw: any) => {
          const current = Number(
            raw.current ??
              raw.nbPlayers ??
              (Array.isArray(raw.participants) ? raw.participants.length : 0)
          )

          const max = Number(
            raw.max ??
              raw.capacity ??
              raw.Capacity ??
              raw.gameMode?.playersMax ??
              0
          )

          return {
            id: Number(raw.id),
            status: raw.status === 'closed' ? 'closed' : 'open',
            createdAt: raw.createdAt ?? raw.created_at ?? '',
            endedAt: raw.endedAt ?? raw.ended_at ?? null,
            isActive: !!raw.isActive,
            modeId: Number(
              raw.modeId ??
                raw.gameModeId ??
                raw.GameModeId ??
                raw.gameMode?.id ??
                0
            ),
            modeName:
              raw.modeName ??
              raw.mode_name ??
              raw.gameMode?.modeName ??
              raw.gameMode?.name ??
              '',
            current: Number.isFinite(current) ? current : 0,
            max: Number.isFinite(max) && max > 0 ? max : current || 1, // 👈 plus de /0
            isRanked: !!(raw.isRanked ?? raw.is_ranked ?? raw.gameMode?.isRanked),
            ownerId:
              Number(raw.ownerId ?? raw.userId ?? raw.UserId ?? raw.creator?.id) ||
              undefined,
            creator: raw.creator ?? null,
            participants: Array.isArray(raw.participants) ? raw.participants : [],
          }
        })

        const nextMeta: PageMeta = {
          page: Number((data as any)?.page ?? page),
          limit: Number((data as any)?.limit ?? PAGE_SIZE),
          total: Number((data as any)?.total ?? items.length),
          pageCount: Number((data as any)?.pageCount ?? 1),
        }

        setMeta(nextMeta)
        if (isFirstPage) setOpenCount(nextMeta.total)
        setTickets(prev => (isFirstPage ? items : [...prev, ...items]))
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message || 'Impossible de charger les tickets'
          )
          if (page === 1) {
            setTickets([])
            setOpenCount(0)
            setMeta({ page: 1, limit: PAGE_SIZE, total: 0, pageCount: 1 })
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingFirst(false)
          setLoadingMore(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gameId, modeId, rankId, page, modeIsRanked])

  const hasMore = meta.page < meta.pageCount
  const onLoadMore = () => {
    if (hasMore && !loadingMore) setParam('page', meta.page + 1)
  }

  const canCreateTicket = Boolean(user)
  const handleCreateTicketClick = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowCreateModal(true)
  }

  const handleTicketCreated = (newTicketId: number) => {
    navigate(`/tickets/${newTicketId}`)
  }

  return (
    <section className={s.root}>
      <header className={s.header}>
        <div className={s.meta}>
          {game?.coverUrl ? (
            <img src={game.coverUrl} alt={game.name} />
          ) : (
            <div className={s.placeholder} />
          )}
          <div>
            <h1>{loadingGame ? 'Chargement…' : game?.name ?? 'Jeu'}</h1>

            <div className={s.subline}>
              <span className={s.activeCount}>
                {openCount} ticket{openCount > 1 ? 's' : ''} ouvert{openCount > 1 ? 's' : ''}
              </span>
              <Link to="/browse" className={s.back}>
                ← Retour
              </Link>
            </div>
          </div>
        </div>

        <div className={s.filters}>
          <div className={s.modeFilterRow}>
            <select
              className={s.select}
              value={modeId}
              onChange={(e) => setParam('modeId', e.target.value)}
            >
              <option value="">Tous les modes</option>
              {game?.modes?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {selectedMode && (
              <span
                className={`${s.badge} ${
                  selectedMode.isRanked ? s.badgeRanked : s.badgeUnranked
                }`}
                style={{ marginLeft: 8 }}
              >
                {selectedMode.isRanked ? 'Ranked' : 'Unranked'}
              </span>
            )}
          </div>

          {game?.ranks?.length ? (
            <select
              className={s.select}
              value={modeIsRanked ? rankId : ''}
              onChange={(e) => setParam('rankId', e.target.value)}
              disabled={!modeIsRanked}
              title={
                modeIsRanked
                  ? ''
                  : 'Sélectionnez un mode classé pour activer ce filtre'
              }
            >
              <option value="">Tous les rangs</option>
              {game.ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          ) : null}

          {canCreateTicket ? (
            <button className={s.createBtn} onClick={handleCreateTicketClick}>
              + Créer un ticket
            </button>
          ) : null}
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      {loadingFirst ? (
        <p>Chargement des tickets…</p>
      ) : tickets.length ? (
        <>
          <div className={s.grid}>
            {tickets.map((t) => (
              <article key={t.id} className={s.ticket}>
                <div className={s.ticketHead}>
                  <div className={s.mode}>{t.modeName}</div>

                  <div className={s.badges}>
                    <div
                      className={`${s.badge} ${
                        t.isRanked ? s.badgeRanked : s.badgeUnranked
                      }`}
                    >
                      {t.isRanked ? 'Ranked' : 'Unranked'}
                    </div>
                    {!t.isActive && t.status === 'open' && (
                      <div className={s.badgeFull}>Complet</div>
                    )}
                  </div>
                </div>

                <div className={s.players}>
                  {t.current} / {t.max} joueurs
                </div>

                <div className={s.creator}>
                  Créateur : <strong>{t.creator?.pseudo ?? '—'}</strong>
                </div>

                <div className={s.footer}>
                  <Link
                    to={`/tickets/${t.id}`}
                    className={s.join}
                    aria-disabled={!t.isActive}
                  >
                    {t.isActive ? 'Voir / Rejoindre' : 'Complet'}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className={s.loadMoreWrap}>
            {hasMore ? (
              <button
                className={s.loadMore}
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            ) : (
              <span className={s.endNote}>
                Affichage de {tickets.length} / {meta.total} ticket(s)
              </span>
            )}
          </div>
        </>
      ) : (
        <p>Aucun ticket ouvert.</p>
      )}

      {showCreateModal && game ? (
        <CreateTicketModal
          gameId={Number(game.id)}
          gameName={game.name}
          modes={game.modes.map((m) => ({
            id: m.id,
            name: m.name,
            playersMax: m.playersMax,
            isRanked: m.isRanked,
          }))}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTicketCreated}
        />
      ) : null}
    </section>
  )
}