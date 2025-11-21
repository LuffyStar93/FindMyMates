import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import s from './HomePage.module.scss'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <main className={s.root}>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1>Trouve des mates en 2 clics</h1>
          <p className={s.subtitle}>
            Crée ou rejoins des tickets, joue en modes classés et construis ta réputation.
          </p>

          {!user ? (
            <div className={s.ctaRow}>
              <Link to="/register" className={s.ctaPrimary}>Créer un compte</Link>
              <Link to="/login" className={s.ctaSecondary}>J’ai déjà un compte</Link>
            </div>
          ) : (
            <div className={s.ctaRow}>
              <Link to="/browse" className={s.ctaPrimary}>Parcourir les tickets</Link>
              <Link to="/profile" className={s.ctaSecondary}>Mon profil</Link>
            </div>
          )}

          <div className={s.helperLinks}>
            <Link to="/faq">Comment ça marche ?</Link>
          </div>
        </div>
      </section>

      <section className={s.valueProps}>
        <div className={s.prop}>
          <h3>Tickets clairs</h3>
          <p>Capacité, mode, ranked, participants… tout est visible d’un coup d’œil.</p>
        </div>
        <div className={s.prop}>
          <h3>Réputation</h3>
          <p>Vote +1/-1 par ticket pour favoriser le fair play.</p>
        </div>
        <div className={s.prop}>
          <h3>Mise en relation</h3>
          <p> Tu trouves un ticket, tu joins, vous échangez vos Discord, et c’est parti pour la session.</p>
        </div>
      </section>
    </main>
  )
}