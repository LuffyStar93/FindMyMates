import { Link } from 'react-router-dom'
import s from './FaqPage.module.scss'

const QA = [
  {
    q: 'Comment créer un ticket ?',
    a: (
      <>
        Depuis la page d’un jeu, clique <strong>« Créer un ticket »</strong>, choisis le mode
        (ranked si dispo) et la capacité recherchée (hors toi). Le ticket apparaît immédiatement.
      </>
    ),
  },
  {
    q: 'Comment rejoindre un ticket ?',
    a: (
      <>
        Va sur <Link to="/browse">Parcourir</Link>, filtre par jeu / mode / ranked et clique
        « Voir / Rejoindre ».
      </>
    ),
  },
  {
    q: 'C’est quoi un mode classé (ranked) ?',
    a: (
      <>
        Un mode où un rang est associé (ex. Compétitif). Tu peux enregistrer tes rangs dans{' '}
        <Link to="/profile">ton profil</Link>.
      </>
    ),
  },
  {
    q: 'Comment fonctionne la réputation ?',
    a: (
      <>
        Après une session, tu peux voter +1 / -1 pour les autres participants du ticket.
        Le score global est visible sur le profil.
      </>
    ),
  },
  {
    q: 'Comment signaler un joueur ?',
    a: (
      <>
        Depuis la page du ticket. Les modérateurs traitent les signalements.
      </>
    ),
  },
  {
    q: 'Puis-je changer de pseudo/nom/email ?',
    a: (
      <>
        Par défaut, c’est bloqué après création. Les modérateurs / admins peuvent effectuer
        des changements en cas de besoin.
      </>
    ),
  },
  {
    q: 'Quelles sont les règles ?',
    a: (
      <>
        Pas de propos haineux, harcèlement, triche. Les signalements répétés peuvent mener
        à des sanctions.
      </>
    ),
  },
]

export default function FaqPage() {
  return (
    <section className={s.root}>
      <header className={s.header}>
        <h1 className={s.title}>FAQ &amp; Aide</h1>
        <p className={s.subtitle}>
          Tout savoir sur les tickets, la réputation et les signalements.
        </p>
      </header>

      <section className={s.content}>
        {QA.map(({ q, a }, i) => (
          <article key={i} className={s.item}>
            <h2 className={s.question}>{q}</h2>
            <div className={s.answer}>{a}</div>
          </article>
        ))}
      </section>
    </section>
  )
}