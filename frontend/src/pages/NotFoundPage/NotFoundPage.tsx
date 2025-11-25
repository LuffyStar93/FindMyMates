import { Link } from 'react-router-dom'
import s from './NotFoundPage.module.scss'

export default function NotFoundPage() {
  return (
    <main className={s.root}>
      <div className={s.card}>
        <div className={s.code}>404</div>
        <h1 className={s.title}>Page introuvable</h1>
        <p className={s.text}>
          On dirait que cette page n’existe pas (ou plus).  
          Tu peux revenir à l’accueil ou parcourir les jeux disponibles.
        </p>

        <div className={s.actions}>
          <Link to="/" className={s.primary}>
            Retour à l’accueil
          </Link>
          <Link to="/browse" className={s.secondary}>
            Parcourir les jeux
          </Link>
        </div>

        <p className={s.hint}>
          Si tu penses que c’est un bug, n’hésite pas à le signaler à un admin.
        </p>
      </div>
    </main>
  )
}