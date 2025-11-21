import { api } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import s from './BrowsePage.module.scss'

type Game = {
  id: number
  name: string
  urlImage: string | null
}

function normalize(txt: string) {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

export default function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') ?? ''

  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState(initialQ)

  // Charger la liste UNE SEULE FOIS
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.get('/games')

        if (cancelled) return

        const list: Game[] = Array.isArray(data)
          ? data.map((g: any) => ({
              id: g.id,
              name: g.name,
              urlImage: g.urlImage ?? g.coverUrl ?? null,
            }))
          : []

        setGames(list)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Impossible de charger les jeux')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Garder la recherche dans l’URL
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (q) next.set('q', q)
    else next.delete('q')
    setParams(next, { replace: true })
  }, [q])

  // Filtrage client
  const filtered = useMemo(() => {
    const nq = normalize(q)
    if (!nq) return games
    return games.filter((g) => normalize(g.name).includes(nq))
  }, [games, q])

  return (
    <section className={s.root}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Parcourir les jeux</h1>
          <p className={s.subtitle}>Choisis un jeu pour voir les tickets disponibles.</p>
        </div>

        <div className={s.toolbar}>
          <input
            className={s.search}
            placeholder="Rechercher un jeu…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      {error && <p className={s.error}>{error}</p>}

      {loading ? (
        <p className={s.info}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className={s.info}>
          Aucun jeu trouvé
          {q ? ` pour « ${q} »` : ''}.
        </p>
      ) : (
        <div className={s.grid}>
          {filtered.map((g) => (
            <Link key={g.id} to={`/browse/${g.id}`} className={s.card}>
              <div className={s.cover}>
                {g.urlImage ? (
                  <img src={g.urlImage} alt={g.name} />
                ) : (
                  <div className={s.placeholder} />
                )}
              </div>
              <div className={s.titleGame}>{g.name}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}