import dotenv from 'dotenv'
dotenv.config()

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import sequelize from './config/db'
import { startTicketAutoCloseJob } from './jobs/closeExpiredTickets'
import { errorHandler } from './middlewares/errorHandler'
import { notFound } from './middlewares/notFound'
import './models'
import apiRouter from './routes'


const app = express()

app.set('trust proxy', 1)

// --- Helmet : sécurité HTTP ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}))

// --- Middlewares globaux ---
app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173']).map(s => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(cookieParser())

// --- Connexion DB + Job de fermeture automatique des tickets ---
sequelize.authenticate()
  .then(() => {
    console.log('DB connected')
    startTicketAutoCloseJob({
      intervalMs: 60_000,  
      ttlMs: 60 * 60_000,
    })
  })
  .catch((err) => console.error('DB error:', err))

// --- Health check ---
app.get(['/health', '/api/health'], (_req, res) => res.json({ ok: true }))

// --- Routes principales ---
app.use('/', apiRouter)

// --- 404 + gestion globale des erreurs ---
app.use(notFound)
app.use(errorHandler)

// --- Démarrage du serveur ---
const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`))