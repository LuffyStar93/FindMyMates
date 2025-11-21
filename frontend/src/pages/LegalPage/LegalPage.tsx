import { Link } from 'react-router-dom'
import s from './LegalPage.module.scss'

export default function LegalPage() {
  return (
    <main className={s.root}>
      <header className={s.header}>
        <h1>Mentions légales</h1>
        <p>
          Cette page regroupe les informations obligatoires relatives au site
          <strong> Find My Mates </strong>(version bêta).
        </p>
      </header>

      <section className={s.section}>
        <h2>Éditeur du site</h2>
        <p>
          <strong>Nom / Raison sociale :</strong> Chagnon Maxime
          <br />
          <strong>Adresse :</strong> Villepinte
          <br />
          <strong>Email :</strong> chagnon.maxime.cm@gmail.com
          <br />
          <strong>Téléphone :</strong> 06 10 XX XX XX
        </p>
        <p>
          <strong>Statut :</strong>  Projet
          personnel
          
        </p>
      </section>

      <section className={s.section}>
        <h2>Hébergement</h2>
        <p>
          <strong>Hébergeur :</strong> o2switch
          <br />
          <strong>Adresse :</strong> Chem. des Pardiaux, 63000 Clermont-Ferrand
          <br />
          <strong>Site web :</strong> https://www.o2switch.fr/
        </p>
      </section>

      <section className={s.section}>
        <h2>Données personnelles</h2>
        <p>
          Les informations collectées lors de la création de compte (adresse
          email, pseudo, éventuel tag Discord, etc.) sont utilisées uniquement
          pour le fonctionnement du service Find My Mates (authentification,
          gestion des tickets, réputation, modération).
        </p>
        <p>
          Tu peux demander la suppression ou la modification de ton compte en
          contactant l’éditeur du site à l’adresse suivante :{' '}
          <strong>[chagnon.maxime.cm@gmail.com]</strong>.
        </p>
        <p>
          Aucune donnée ne sera vendue ou cédée à des tiers à des fins
          commerciales.
        </p>
      </section>

      <section className={s.section}>
        <h2>Responsabilité</h2>
        <p>
          Find My Mates est une plateforme de mise en relation entre joueurs.
          Chaque utilisateur reste responsable de son comportement en jeu et
          dans les échanges (chat vocal, Discord, etc.).
        </p>
        <p>
          L’éditeur se réserve le droit de suspendre ou bannir un compte en cas
          de non-respect des règles : propos haineux, harcèlement, triche,
          menaces ou tout comportement contraire aux conditions d’utilisation.
        </p>
      </section>

      <section className={s.section}>
        <h2>Propriété intellectuelle</h2>
        <p>
          L’identité visuelle, le logo, le nom du service ainsi que le code
          source du site sont la propriété de l’éditeur, sauf mention
          contraire.
        </p>
        <p>
          Les logos, marques et visuels des jeux (CS2, Valorant, Rocket League,
          etc.) restent la propriété de leurs éditeurs respectifs et sont
          mentionnés à titre indicatif.
        </p>
      </section>

      <section className={s.section}>
        <h2>Contact</h2>
        <p>
          Pour toute question concernant le site ou les mentions légales, tu
          peux nous contacter via la page{' '}
          <Link to="/contact">Contact</Link> ou par email :{' '}
          <strong>[chagnon.maxime.cm@gmail.com]</strong>.
        </p>
      </section>

      <section className={s.section}>
        <h2>Attribution</h2>
        <p>
            Icônes utilisées sur ce site : <a href="https://www.flaticon.com/fr/icones-gratuites/manette" title="manette icônes" target="_blank" rel="noopener noreferrer">
                Manette icônes créées par Slidicon – Flaticon
            </a>
        </p>
      </section>
    </main>
  )
}