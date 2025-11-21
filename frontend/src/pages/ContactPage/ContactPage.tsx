import { FormEvent, useState } from 'react'
import s from './ContactPage.module.scss'

type ContactReason =
  | 'Changement d\'informations'
  | 'Déclaration de bug'
  | 'Idée d\'amélioration'
  | 'Autres'

export default function ContactPage() {
  const [reason, setReason] = useState<ContactReason>('Changement d\'informations')
  const [email, setEmail] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [message, setMessage] = useState('')

  // Pour plus tard : on gardera cette fonction pour brancher le backend.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  return (
    <main className={s.root}>
      <header className={s.header}>
        <h1>Contact</h1>
        <p>
          Une question, un bug, une demande de modification de compte ?
          Utilise ce formulaire pour nous contacter.
        </p>
      </header>

      <section className={s.note}>
        <strong>⚠️ Attention :</strong>{' '}
        Le formulaire de contact n&apos;est pas encore fonctionnel en bêta.
        L&apos;envoi d&apos;emails n&apos;est pas actif pour le moment.
      </section>

      <section className={s.card}>
        <form className={s.form} onSubmit={onSubmit} noValidate>
          {/* Objet / raison */}
          <label className={s.field}>
            <span>Objet de la demande</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ContactReason)}
              className={s.select}
            >
              <option value="Changement d'informations">Changement d&apos;informations</option>
              <option value="Déclaration de bug">Déclaration de bug</option>
              <option value="Idée d'amélioration">Idée d&apos;amélioration</option>
              <option value="Autres">Autres</option>
            </select>
          </label>

          {/* Email */}
          <label className={s.field}>
            <span>Adresse email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={s.input}
            />
            <small className={s.hint}>
              Nous pourrons te répondre à cette adresse.
            </small>
          </label>

          {/* Pseudo (optionnel) */}
          <label className={s.field}>
            <span>Pseudo (optionnel)</span>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ton pseudo FMM"
              className={s.input}
            />
          </label>

          {/* Message */}
          <label className={s.field}>
            <span>Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décris ton problème, ton idée ou ta demande…"
              rows={5}
              className={s.textarea}
            />
          </label>

          <div className={s.actions}>
            <button
              type="submit"
              className={s.submit}
              disabled
              title="Désactivé pendant la phase bêta"
            >
              Envoyer (désactivé en bêta)
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}