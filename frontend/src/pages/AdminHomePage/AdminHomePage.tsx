import { Link } from 'react-router-dom'
import s from './AdminHomePage.module.scss'

export default function AdminHomePage() {
  return (
    <main className={s.root}>
      <header className={s.header}>
        <div>
          <h1>Administration</h1>
          <p>Outils de modération et suivi des signalements.</p>
        </div>

        <Link to="/browse" className={s.backLink}>
          ← Retour au site
        </Link>
      </header>

      {/* Bloc principal : Signalements */}
      <section className={s.mainCard}>
        <div className={s.mainCardHeader}>
          <h2>Signalements</h2>
          <p>Consulter, filtrer et traiter les reports joueurs.</p>
        </div>
        <div className={s.mainCardBody}>
          <p>
            Accédez à la liste complète des signalements, filtrez par type
            (insulte, harcèlement, etc.), statut (ouvert, en cours, fermé)
            et marquez les reports comme lus ou traités.
          </p>
          <Link to="/admin/reports" className={s.cta}>
            Ouvrir la page des signalements
          </Link>
        </div>
      </section>

      
      {/* <section className={s.kpis}>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Reports ouverts</div>
          <div className={s.kpiValue}>—</div>
          <div className={s.kpiHint}>Bientôt : stats temps réel</div>
        </div>

        <div className={s.kpi}>
          <div className={s.kpiLabel}>Reports non lus</div>
          <div className={s.kpiValue}>—</div>
          <div className={s.kpiHint}>Basé sur le champ lu/non lu</div>
        </div>

        <div className={s.kpi}>
          <div className={s.kpiLabel}>Tickets signalés (24h)</div>
          <div className={s.kpiValue}>—</div>
          <div className={s.kpiHint}>Idée pour une V2</div>
        </div>
      </section> */}
    </main>
  )
}