import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import s from './AdminReportsPage.module.scss'

type ReporterLite = {
  id: number
  pseudo: string
  name?: string | null
}

type GameLite = {
  id: number
  name: string
}

type ModeLite = {
  id: number
  modeName: string
  isRanked?: boolean
  game?: GameLite | null
}

type TicketLite = {
  id: number
  status: 'open' | 'closed'
  isActive: boolean
  gameMode?: ModeLite | null
}

type ReportRow = {
  id: number
  description: string
  createdAt: string
  status: 'open' | 'in_progress' | 'closed'
  reason: string
  files?: string | null
  readedAt: string | null
  reporter?: ReporterLite | null
  ticket?: TicketLite | null
  reportedUsers?: { id: number; pseudo: string; name?: string | null }[]
}

type PageMeta = {
  page: number
  limit: number
  total: number
  pageCount: number
}

const PAGE_SIZE = 30

const REASON_OPTIONS = [
  'Propos racistes',
  'Homophobie/Transphobie',
  'Menace',
  'Insulte',
  'Sexisme',
  'Autres',
] as const

function formatDateLabel(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // filtres depuis l’URL
  const initialStatus = searchParams.get('status') || ''
  const initialReason = searchParams.get('reason') || ''
  const initialRead = searchParams.get('read') // 'unread' | 'read' | null
  const initialPage = Number(searchParams.get('page') || '1')

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [reasonFilter, setReasonFilter] = useState<string>(initialReason)
  const [unreadOnly, setUnreadOnly] = useState<boolean>(initialRead === 'unread')
  const [page, setPage] = useState<number>(
    Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1
  )

  const [items, setItems] = useState<ReportRow[]>([])
  const [meta, setMeta] = useState<PageMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pageCount: 1,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Synchronise les filtres dans l’URL
  useEffect(() => {
    const next = new URLSearchParams()

    if (statusFilter) next.set('status', statusFilter)
    if (reasonFilter) next.set('reason', reasonFilter)
    if (unreadOnly) next.set('read', 'unread')
    if (page > 1) next.set('page', String(page))

    setSearchParams(next, { replace: true })
  }, [statusFilter, reasonFilter, unreadOnly, page, setSearchParams])

  // Chargement des reports
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/reports', {
          params: {
            page,
            limit: PAGE_SIZE,
            status: statusFilter || undefined,
            reason: reasonFilter || undefined,
            read: unreadOnly ? 'unread' : undefined,
          },
        })

        if (cancelled) return

        const rows: ReportRow[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : []

        setItems(rows)
        setMeta({
          page: Number(data?.page ?? page),
          limit: Number(data?.limit ?? PAGE_SIZE),
          total: Number(data?.total ?? rows.length),
          pageCount: Number(data?.pageCount ?? 1),
        })
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message || 'Impossible de charger les signalements'
          )
          setItems([])
          setMeta(prev => ({ ...prev, total: 0, pageCount: 1 }))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [page, statusFilter, reasonFilter, unreadOnly])

  const hasPrev = meta.page > 1
  const hasNext = meta.page < meta.pageCount

  const onChangeStatus = (val: string) => {
    setStatusFilter(val)
    setPage(1)
  }

  const onChangeReason = (val: string) => {
    setReasonFilter(val)
    setPage(1)
  }

  const onToggleUnread = () => {
    setUnreadOnly(prev => !prev)
    setPage(1)
  }

  const formattedItems = useMemo(
    () =>
      items.map(r => ({
        ...r,
        createdLabel: formatDateLabel(r.createdAt),
        readLabel: r.readedAt ? formatDateLabel(r.readedAt) : 'Non lu',
      })),
    [items]
  )

  return (
    <main className={s.root}>
      <header className={s.header}>
        <div>
          <h1>Signalements</h1>
          <p>Liste des reports des joueurs, avec filtres.</p>
        </div>
        <Link to="/admin" className={s.backLink}>
          ← Retour admin
        </Link>
      </header>

      {/* Filtres */}
      <section className={s.filters}>
        <div className={s.filterRow}>
          <label className={s.filterField}>
            <span>Statut</span>
            <select
              className={s.select}
              value={statusFilter}
              onChange={(e) => onChangeStatus(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="open">Ouverts</option>
              <option value="in_progress">En cours</option>
              <option value="closed">Fermés</option>
            </select>
          </label>

          <label className={s.filterField}>
            <span>Type</span>
            <select
              className={s.select}
              value={reasonFilter}
              onChange={(e) => onChangeReason(e.target.value)}
            >
              <option value="">Tous</option>
              {REASON_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className={s.filterToggle}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={onToggleUnread}
            />
            <span>Non lus uniquement</span>
          </label>
        </div>
      </section>

      {error && <p className={s.error}>{error}</p>}

      <section className={s.tableWrap}>
        {loading ? (
          <p>Chargement…</p>
        ) : formattedItems.length === 0 ? (
          <p>Aucun signalement trouvé.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Créé le</th>
                <th>Statut</th>
                <th>Type</th>
                <th>Reporter</th>
                <th>Ciblés</th>
                <th>Ticket</th>
                <th>Lecture</th>
              </tr>
            </thead>
            <tbody>
              {formattedItems.map((r) => (
                <tr
                  key={r.id}
                  className={s.row}
                  onClick={() => (window.location.href = `/admin/reports/${r.id}`)}
                >
                  <td>#{r.id}</td>
                  <td>{r.createdLabel}</td>
                  <td>
                    <span
                      className={`${s.badge} ${
                        r.status === 'open'
                          ? s.badgeOpen
                          : r.status === 'in_progress'
                          ? s.badgeInProgress
                          : s.badgeClosed
                      }`}
                    >
                      {r.status === 'open'
                        ? 'Ouvert'
                        : r.status === 'in_progress'
                        ? 'En cours'
                        : 'Fermé'}
                    </span>
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    {r.reporter ? (
                      <>
                        <strong>{r.reporter.pseudo}</strong>
                        {r.reporter.name ? ` (${r.reporter.name})` : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {r.reportedUsers && r.reportedUsers.length
                      ? r.reportedUsers.map(u => u.pseudo).join(', ')
                      : '—'}
                  </td>
                  <td>
                    {r.ticket ? (
                      <>
                        <span>#{r.ticket.id}</span>{' '}
                        {r.ticket.gameMode?.game?.name
                          ? `· ${r.ticket.gameMode.game.name}`
                          : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {r.readedAt ? (
                      <span className={s.readLabel}>{r.readLabel}</span>
                    ) : (
                      <span className={s.unreadPill}>Non lu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Pagination simple */}
      <section className={s.pagination}>
        <button
          type="button"
          onClick={() => hasPrev && setPage(meta.page - 1)}
          disabled={!hasPrev || loading}
        >
          ← Précédent
        </button>
        <span>
          Page {meta.page} / {meta.pageCount} ({meta.total} report
          {meta.total > 1 ? 's' : ''})
        </span>
        <button
          type="button"
          onClick={() => hasNext && setPage(meta.page + 1)}
          disabled={!hasNext || loading}
        >
          Suivant →
        </button>
      </section>
    </main>
  )
}