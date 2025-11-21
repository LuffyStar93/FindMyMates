import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import s from './AdminReportDetailPage.module.scss'

type ReportStatus = 'open' | 'in_progress' | 'closed'

type ReporterLite = {
  id: number
  pseudo: string
  name?: string | null
}

type GameLite = {
  id: number
  name: string
  urlImage?: string | null
}

type ModeLite = {
  id: number
  modeName: string
  isRanked: boolean
  playersMax: number
  game?: GameLite
}

type TicketLite = {
  id: number
  status: 'open' | 'closed'
  isActive: boolean
  gameMode?: ModeLite | null
}

type ReportUser = {
  id: number
  pseudo: string
  name?: string | null
  bannedAt?: string | null
}

type ReportDetail = {
  id: number
  description: string
  createdAt: string
  status: ReportStatus
  reason: string
  files: string | null
  readedAt: string | null
  userId: number
  ticketId: number
  reporter: ReporterLite | null
  ticket: TicketLite | null
  reportedUsers: ReportUser[]
}

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [savingStatus, setSavingStatus] = useState(false)
  const [savingRead, setSavingRead] = useState(false)
  const [savingBan, setSavingBan] = useState(false)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const reportId = useMemo(() => (id ? Number(id) : NaN), [id])
  const isValidId = Number.isFinite(reportId)

  // Charger le report
  useEffect(() => {
    if (!isValidId) {
      setError('Identifiant de report invalide')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      setInfoMsg(null)
      try {
        const { data } = await api.get(`/reports/${reportId}`)
        if (cancelled) return

        const r = data || {}
        const mapped: ReportDetail = {
          id: Number(r.id),
          description: r.description ?? '',
          createdAt: r.createdAt ?? r.created_at ?? '',
          status: (r.status as ReportStatus) ?? 'open',
          reason: r.reason ?? '',
          files: r.files ?? null,
          readedAt: r.readedAt ?? r.readed_at ?? null,
          userId: Number(r.userId ?? r.UserId ?? 0),
          ticketId: Number(r.ticketId ?? r.TicketId ?? 0),
          reporter: r.reporter
            ? {
                id: Number(r.reporter.id),
                pseudo: r.reporter.pseudo ?? '',
                name: r.reporter.name ?? null,
              }
            : null,
          ticket: r.ticket
            ? {
                id: Number(r.ticket.id),
                status: r.ticket.status ?? 'open',
                isActive: !!r.ticket.isActive,
                gameMode: r.ticket.gameMode
                  ? {
                      id: Number(r.ticket.gameMode.id),
                      modeName: r.ticket.gameMode.modeName ?? '',
                      isRanked: !!r.ticket.gameMode.isRanked,
                      playersMax: Number(r.ticket.gameMode.playersMax ?? 0),
                      game: r.ticket.gameMode.game
                        ? {
                            id: Number(r.ticket.gameMode.game.id),
                            name: r.ticket.gameMode.game.name ?? '',
                            urlImage:
                              r.ticket.gameMode.game.urlImage ??
                              r.ticket.gameMode.game.coverUrl ??
                              null,
                          }
                        : undefined,
                    }
                  : null,
              }
            : null,
          reportedUsers: Array.isArray(r.reportedUsers)
            ? r.reportedUsers.map((u: any) => ({
                id: Number(u.id),
                pseudo: u.pseudo ?? '',
                name: u.name ?? null,
                bannedAt: u.bannedAt ?? u.banned_at ?? null,
              }))
            : [],
        }

        setReport(mapped)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.response?.data?.message || 'Impossible de charger le report')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isValidId, reportId])

  const isRead = !!report?.readedAt

  const onBack = () => {
    navigate('/admin/reports')
  }

  // Changer le statut
  const handleStatusChange = async (status: ReportStatus) => {
    if (!report) return
    setSavingStatus(true)
    setError(null)
    setInfoMsg(null)
    try {
      await api.patch(`/reports/${report.id}/status`, { status })
      setReport((prev) => (prev ? { ...prev, status } : prev))
      setInfoMsg('Statut mis à jour.')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour le statut')
    } finally {
      setSavingStatus(false)
    }
  }

  // Marquer lu / non lu
  const handleToggleRead = async () => {
    if (!report) return
    const nextRead = !isRead
    setSavingRead(true)
    setError(null)
    setInfoMsg(null)
    try {
      await api.patch(`/reports/${report.id}/read`, { read: nextRead })
      setReport((prev) =>
        prev
          ? {
              ...prev,
              readedAt: nextRead ? new Date().toISOString() : null,
            }
          : prev
      )
      setInfoMsg(nextRead ? 'Report marqué comme lu.' : 'Report marqué comme non lu.')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour le statut de lecture')
    } finally {
      setSavingRead(false)
    }
  }

  // Bannir / débannir un user ciblé
  const handleToggleBan = async (
    userId: number,
    currentlyBanned: boolean | null | undefined
  ) => {
    if (!report) return
    setSavingBan(true)
    setError(null)
    setInfoMsg(null)
    try {
      await api.put(`/users/${userId}`, { banned: !currentlyBanned })

      setReport((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          reportedUsers: prev.reportedUsers.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  bannedAt: currentlyBanned ? null : new Date().toISOString(),
                }
              : u
          ),
        }
      })
      setInfoMsg(
        currentlyBanned ? 'Utilisateur débanni.' : 'Utilisateur banni.'
      )
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour le ban utilisateur')
    } finally {
      setSavingBan(false)
    }
  }

  const statusLabel = (st: ReportStatus) => {
    switch (st) {
      case 'open':
        return 'Ouvert'
      case 'in_progress':
        return 'En cours'
      case 'closed':
        return 'Fermé'
      default:
        return st
    }
  }

  const formattedCreatedAt = report?.createdAt
    ? new Date(report.createdAt).toLocaleString()
    : '—'

  const ticketGameName = report?.ticket?.gameMode?.game?.name
  const ticketModeName = report?.ticket?.gameMode?.modeName

  if (!isValidId) {
    return (
      <main className={s.root}>
        <header className={s.header}>
          <h1>Report introuvable</h1>
          <button className={s.backBtn} onClick={onBack}>
            ← Retour aux reports
          </button>
        </header>
        <p>Identifiant invalide.</p>
      </main>
    )
  }

  return (
    <main className={s.root}>
      <header className={s.header}>
        <div>
          <h1>Report #{reportId}</h1>
          {report && (
            <div className={s.meta}>
              <span className={s.metaItem}>
                Créé le <strong>{formattedCreatedAt}</strong>
              </span>
              <span className={s.metaItem}>
                Raison : <strong>{report.reason || '—'}</strong>
              </span>
              {ticketGameName && (
                <span className={s.metaItem}>
                  Jeu : <strong>{ticketGameName}</strong>
                  {ticketModeName ? ` · ${ticketModeName}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={s.headerActions}>
          <button className={s.backBtn} onClick={onBack}>
            ← Retour aux reports
          </button>
          {report && (
            <button
              className={s.readBtn}
              onClick={handleToggleRead}
              disabled={savingRead}
            >
              {savingRead
                ? '…'
                : isRead
                ? 'Marquer comme non lu'
                : 'Marquer comme lu'}
            </button>
          )}
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}
      {infoMsg && <p className={s.info}>{infoMsg}</p>}

      {loading ? (
        <p>Chargement…</p>
      ) : !report ? (
        <p>Report introuvable.</p>
      ) : (
        <section className={s.content}>
          {/* Bloc statut */}
          <section className={s.card}>
            <h2>Statut</h2>
            <div className={s.statusRow}>
              <span className={`${s.statusBadge} ${s[`status_${report.status}`]}`}>
                {statusLabel(report.status)}
              </span>

              <select
                className={s.select}
                value={report.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as ReportStatus)
                }
                disabled={savingStatus}
              >
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="closed">Fermé</option>
              </select>
            </div>
          </section>

          {/* Bloc ticket */}
          <section className={s.card}>
            <h2>Ticket</h2>
            {report.ticket ? (
              <div className={s.ticketBlock}>
                <div className={s.ticketLine}>
                  <span>
                    Ticket #{report.ticket.id}{' '}
                    {ticketGameName && (
                      <>
                        — <strong>{ticketGameName}</strong>
                      </>
                    )}
                    {ticketModeName && ` · ${ticketModeName}`}
                  </span>
                </div>
                <div className={s.ticketLine}>
                  <span>
                    Statut :{' '}
                    <strong>
                      {report.ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
                    </strong>{' '}
                    {!report.ticket.isActive &&
                      report.ticket.status === 'open' &&
                      '(complet)'}
                  </span>
                </div>
                <div className={s.ticketActions}>
                  <Link
                    to={`/tickets/${report.ticket.id}`}
                    className={s.linkBtn}
                  >
                    Voir le ticket
                  </Link>
                  {' · '}
                  {report.ticket.gameMode?.game && (
                    <Link
                      to={`/browse/${report.ticket.gameMode.game.id}`}
                      className={s.linkBtnGhost}
                    >
                      Voir le jeu
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p>Aucun ticket associé.</p>
            )}
          </section>

          {/* Bloc auteur & ciblés */}
          <section className={s.card}>
            <h2>Acteurs</h2>
            <div className={s.actors}>
              <div className={s.actorColumn}>
                <h3>Auteur du report</h3>
                {report.reporter ? (
                  <div className={s.actorLine}>
                    <span className={s.pseudo}>{report.reporter.pseudo}</span>
                    {report.reporter.name && (
                      <span className={s.name}>
                        {' '}
                        ({report.reporter.name})
                      </span>
                    )}
                  </div>
                ) : (
                  <p>Inconnu.</p>
                )}
              </div>

              <div className={s.actorColumn}>
                <h3>Ciblés</h3>
                <ul className={s.targetsList}>
                  {report.reportedUsers.length === 0 ? (
                    <li className={s.empty}>Aucun utilisateur ciblé.</li>
                  ) : (
                    report.reportedUsers.map((u) => {
                      const isBanned = !!u.bannedAt
                      return (
                        <li key={u.id} className={s.targetRow}>
                          <div className={s.targetInfo}>
                            <span className={s.pseudo}>{u.pseudo}</span>
                            {u.name && (
                              <span className={s.targetName}>
                                {' '}
                                ({u.name})
                              </span>
                            )}
                            {isBanned && (
                              <span className={s.badgeBanned}>Banni</span>
                            )}
                          </div>
                          <div className={s.targetActions}>
                            <button
                              type="button"
                              className={isBanned ? s.btnUnban : s.btnBan}
                              onClick={() =>
                                handleToggleBan(u.id, isBanned)
                              }
                              disabled={savingBan}
                            >
                              {isBanned ? 'Débannir' : 'Bannir'}
                            </button>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Bloc description */}
          <section className={s.card}>
            <h2>Description</h2>
            {report.description ? (
              <p className={s.description}>{report.description}</p>
            ) : (
              <p>Aucune description fournie.</p>
            )}

            {report.files && (
              <div className={s.attachments}>
                <h3>Pièces jointes</h3>
                <p>
                  <a
                    href={report.files}
                    target="_blank"
                    rel="noreferrer"
                    className={s.linkBtn}
                  >
                    Ouvrir la pièce jointe
                  </a>
                </p>
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  )
}