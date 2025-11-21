# Find My Mates — Backend (API)

Backend Node.js/Express de **Find My Mates**.  
Il expose une API REST pour gérer l’authentification, les jeux/modes, les tickets (matchmaking), la réputation et les reports (modération).

---

## 🚀 Stack technique

- **Node.js 22** + **Express**
- **TypeScript**
- **MySQL 8**
- **Sequelize** (ORM)
- **JWT** (access + refresh tokens)
- **Zod** (validation)
- **Jest + Supertest** (tests)
- **ts-jest / tsc-alias** (build)

---

## 📁 Structure

```
backend/
├─ src/
│  ├─ config/           # db, env, logger…
│  ├─ controllers/      # logique métier / handlers
│  ├─ middlewares/      # auth, RBAC, validation, errors
│  ├─ models/           # modèles Sequelize + associations
│  ├─ routes/           # routes Express
│  ├─ tests/            # tests Jest/Supertest
│  ├─ seed.ts           # seed / jeu de données
│  └─ server.ts         # point d'entrée API
├─ dist/                # build TS -> JS (généré)
├─ jest.config.cjs
├─ package.json
└─ tsconfig*.json
```

---

## ✅ Prérequis

- Node.js **>= 22**
- MySQL **>= 8**
- Un schéma MySQL initialisé.

---

## ⚙️ Installation

```bash
cd backend
npm install
```

---

## 🔐 Variables d’environnement

Crée un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

**Exemple `.env.example` :**

```env
# Server
NODE_ENV=development
PORT=3000
FRONT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=findmymates
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
JWT_ISSUER=findmymates
JWT_AUDIENCE=findmymates:web
```

> En prod/préprod sur o2switch, ces variables sont à renseigner dans l’interface “Web Applications / Environment variables” de ton app Node.

---

## ▶️ Lancer le serveur en dev

```bash
npm run dev
```

Le serveur démarre sur :  
`http://localhost:3000` (ou le port défini dans `.env`)

---

## 🏗️ Build & run production

```bash
npm run build        # tsc + tsc-alias -> dist/
npm start            # node dist/server.js
```

---

## 🧪 Tests

Lancer tous les tests :

```bash
npm test
```

Coverage :

```bash
npm run test:cov
```

Les tests couvrent notamment la partie **Tickets** :
- création de ticket
- listing & getTicket
- join ticket
- update / close / delete

---

## 🌱 Seed (jeu de données)

Pour réinitialiser et remplir la base avec un jeu d’essai :

```bash
npm run seed
```

Le script :
- truncate toutes les tables dans un ordre sûr
- crée des users, games, modes
- crée des tickets + participants
- ajoute des votes de réputation et des reports

---

## 🔌 Endpoints principaux (résumé)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Tickets
- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `POST /tickets/:id/join`
- `PATCH /tickets/:id`
- `PATCH /tickets/:id/close`
- `DELETE /tickets/:id`

### Reputation
- `POST /reputation-votes`
- `GET /users/:id/reputation`

### Reports
- `POST /reports`
- `GET /reports` *(staff)*
- `GET /reports/:id` *(staff)*
- `PATCH /reports/:id/status` *(staff)*
- `PATCH /reports/:id/read` *(staff)*

---

## 🔒 Sécurité

- Auth JWT (access token court + refresh token long)
- RBAC simple : **User / Moderator / Admin**
- Validation stricte des payloads via **Zod**
- Contrôles d’intégrité côté controllers (tickets, participants, votes, reports)
- CORS configurable par environnement
