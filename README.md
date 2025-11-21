
# Find My Mates (FMM)

  

Find My Mates est une application web communautaire pensée pour les joueurs qui veulent trouver rapidement des coéquipiers fiables.

Le principe est simple : **je crée un ticket**, d’autres joueurs le rejoignent, puis **une session se lance**. Pendant la session, les participants peuvent **Upvoter ou Downvoter un utilisateur** (+1 / -1) et **signaler** un comportement inapproprié si besoin.

---

## ✨ Fonctionnalités principales

  

-  **Authentification complète**

- Inscription / connexion

- JWT + refresh token (sessions persistantes)

- Gestion des rôles (User / Moderator / Admin)

  

-  **Tickets (matchmaking)**

- Création de tickets par jeu et mode de jeu

- Listing avec filtres (jeu, mode, ranked, statut…)

- Rejoindre un ticket

- Fermeture manuelle par le créateur et/ou fermeture automatique à expiration

  

-  **Réputation**

- Vote +1 / -1 par ticket pendant la session 

- Score de réputation agrégé sur le profil utilisateur

  

-  **Signalements**

- Formulaire de report (motif + description)

- Tableau admin de modération : lecture, statut, ban/déban utilisateur

  

-  **UI moderne**

- Thème **dark / light**

- Design PC-first, responsive mobile (menu burger, cartes empilées)

---

## 🧱 Stack technique

### Front-end

-  **React + TypeScript** (Vite)

-  **React Router** (navigation SPA)

-  **SCSS modules** + variables CSS (dark/light)

-  **Axios** (client API centralisé)

- Architecture par features (pages, components, context)

  

### Back-end

-  **Node.js + Express + TypeScript**

-  **MySQL**

-  **Sequelize ORM**

- Modèles typés, relations (1–N, N–N via tables de jointure)

-  **Zod** pour la validation des entrées API

- Middlewares sécurité + rate limiting

### CI/CD & Hébergement

-  **GitHub Actions**

- Build + tests backend

- Build frontend

- Déploiement FTP automatique vers **o2switch**

- Branches séparées (develop / preprod / main)

---

## 📂 Structure du repo

```

FindMyMates/

├─ frontend/ # app React (Vite)

│ ├─ src/

│ ├─ public/

│ └─ ...

├─ backend/ # API Node/Express

│ ├─ src/

│ ├─ tests/

│ └─ ...

└─ .github/workflows/ # pipelines CI/CD

```

--- 

## 🚀 Lancer le projet en local

  

### Prérequis

- Node.js ≥ 18 (22 recommandé)

- MySQL ≥ 8

- npm


### 1) Backend

```bash

cd  backend

npm  install

```

  

Créer un fichier `.env` :

  

```env

PORT=3000

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=your_password

DB_NAME=fmm

JWT_SECRET=change_me

JWT_REFRESH_SECRET=change_me_too

CORS_ORIGIN=http://localhost:5173

```

Puis :

```bash

npm  run  dev

```

API disponible sur `http://localhost:3000/api`.

Tests :

```bash

npm  test

```

### 2) Frontend

```bash

cd  frontend

npm  install

``` 

Créer un fichier `.env` :

```env

VITE_API_URL=http://localhost:3000/api

```

  

Puis :

  

```bash

npm  run  dev

```

App disponible sur `http://localhost:5173`.

---

  

## 🧪 Tests

Le projet utilise **Jest + Supertest** côté backend pour couvrir les routes critiques :

- création de ticket

- join ticket

- listing / get ticket

- update / close / delete ticket

- création de report

---
 

## 📌 Roadmap (bêta)

  

- Tests d’intégration supplémentaires (réputation, admin)

- Upload de preuves dans les reports

- Notifications (tickets rejoints / reports traités)

- Améliorations UX mobile

---

## 👤 Auteur

Projet réalisé par **Maxime** dans le cadre de la formation *Concepteur Développeur d’Applications*.