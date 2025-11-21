import { Link } from 'react-router-dom'
import s from './Footer.module.scss'

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <span className={s.brand}>FMM BETA · v0.1</span>

        <nav className={s.links}>
          <Link to="/legal">Mentions légales</Link>
          { "-" }
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}