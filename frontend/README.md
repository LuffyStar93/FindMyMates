
# 🌌 Find My Mates – Frontend

**Application React + TypeScript + Vite**

Interface utilisateur du projet *Find My Mates* — plateforme de recherche de joueurs, création de tickets, réputation et modération.

---

## 🚀 1. Présentation du projet

Le frontend gère l’interface utilisateur complète avec :

- Création et consultation des **tickets**

- Système de **réputation**

- Signalements (**reports**) + interface modération

- Authentification par **JWT**

- Thème **dark / light**

- Navigation dynamique (React Router)

Technos clés :

- React 18

- TypeScript

- Vite

- SCSS Modules

- Axios

- Context API (AuthContext + ThemeContext)

---

## 📁 2. Architecture générale

```
frontend/

├── public/

├── src/

│ ├── components/

│ ├── context/

│ ├── hooks/

│ ├── lib/

│ ├── pages/

│ ├── routes/

│ ├── styles/

│ ├── main.tsx

│ └── App.tsx

└── vite.config.ts
```

### 📌 Dossiers importants

-  **context/** → Authentification + Thème

-  **pages/** → Chaque écran principal (Home, Login, Browse, Reports, Admin…)

-  **components/** → Navbar, footer, cartes, UI réutilisable

-  **styles/** → Variables SCSS + base globale

-  **lib/api.ts** → Axios configuré (JWT, interceptors)

---

## 🔐 3. Authentification (AuthContext)

Le frontend utilise :

- stockage du **JWT** en cookie httpOnly

- récupération automatique de l’utilisateur

- protection des routes privées

- redirection après login

---

## 🎨 4. Thème (ThemeContext)

- Stockage dans localStorage

- Toggle dark/light dans la navbar

- Variables CSS dynamiques via `data-theme="dark"` / `"light"`

--- 

## 🛠️ 5. Scripts

|Commande|Description|
|--|--|
| `npm install` | Installation |
| `npm run dev` | Démarrage local |
| `npm run build` | Build production |
| `npm run preview` | Prévisualisation du build |

---

## 🚢 6. CI/CD – Déploiement

Le frontend est déployé via GitHub Actions :

- Build Vite

- Upload automatique via FTP sur o2switch

- Nettoyage du dossier dist

- Déploiement séparé du backend

Workflow → `.github/workflows/deploy.yml`.

---
## 🧪 7. Qualité & Test

- ESLint + TypeScript

- Structure facilitant l’ajout de tests unitaires (React Testing Library ou Vitest)

- CI/CD bloquant en cas d’erreur