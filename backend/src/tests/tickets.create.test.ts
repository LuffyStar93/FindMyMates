import { createTicket } from '@/controllers/ticketsController'
import express from 'express'
import request from 'supertest'

// === Mocks Sequelize models ===
jest.mock('@/models/GameModes', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}))

jest.mock('@/models/Tickets', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}))

jest.mock('@/models/UserTicket', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}))

jest.mock('@/models/Games', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/Users', () => ({ __esModule: true, default: {} }))

const GameModes = require('@/models/GameModes').default as any
const Tickets = require('@/models/Tickets').default as any
const UserTicket = require('@/models/UserTicket').default as any

// === App Express de test ===
const app = express()
app.use(express.json())

// route avec auth User
app.post(
  '/tickets',
  (req, _res, next) => {
    ;(req as any).user = { id: 1, role: 'User' }
    next()
  },
  createTicket as any
)

// route avec auth Admin
app.post(
  '/tickets-admin',
  (req, _res, next) => {
    ;(req as any).user = { id: 1, role: 'Admin' }
    next()
  },
  createTicket as any
)

// route sans auth
app.post('/tickets-no-auth', createTicket as any)

describe('POST /tickets (createTicket)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('CT01 - crée un ticket valide et ajoute le créateur en participant', async () => {
    const mode = { id: 5, playersMax: 5 }
    const createdTicket = { id: 10 }

    GameModes.findByPk.mockResolvedValue(mode)
    Tickets.create.mockResolvedValue(createdTicket)

    // reloaded ticket
    Tickets.findByPk.mockResolvedValue({
      id: 10,
      status: 'open',
      isActive: true,
      nbPlayers: 1,
      capacity: 4,
      gameModeId: 5,
      userId: 1,
    })

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 5, capacity: 4 })

    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)

    expect(GameModes.findByPk).toHaveBeenCalledWith(5)

    expect(Tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'open',
        isActive: true,
        nbPlayers: 1,
        capacity: 4,
        gameModeId: 5,
        userId: 1,
      })
    )

    expect(UserTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        ticketId: 10,
      })
    )

    expect(Tickets.findByPk).toHaveBeenCalledWith(
      10,
      expect.any(Object)
    )
  })

  it('CT02 - renvoie 401 si non authentifié', async () => {
    const res = await request(app)
      .post('/tickets-no-auth')
      .send({ userId: 1, gameModeId: 5 })

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ message: 'Auth required' })
  })

  it('CT03 - renvoie 400 si userId ou gameModeId manquant', async () => {
    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1 })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      message: 'userId and gameModeId are required',
    })
  })

  it("CT04 - renvoie 403 si un User tente de créer pour quelqu'un d'autre", async () => {
    const res = await request(app)
      .post('/tickets')
      .send({ userId: 999, gameModeId: 5 })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      message: 'You cannot create a ticket for another user',
    })
  })

  it('CT05 - renvoie 404 si le mode de jeu est introuvable', async () => {
    GameModes.findByPk.mockResolvedValue(null)

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 999 })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ message: 'Game mode not found' })
  })

  it('CT06 - renvoie 400 si le mode ne supporte pas les tickets (playersMax < 2)', async () => {
    GameModes.findByPk.mockResolvedValue({ id: 5, playersMax: 1 })

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 5, capacity: 2 })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      message: 'This mode does not support tickets (playersMax < 2)',
    })
    expect(Tickets.create).not.toHaveBeenCalled()
  })

  it('CT07 - clamp la capacity à playersMax si trop grande', async () => {
    GameModes.findByPk.mockResolvedValue({ id: 5, playersMax: 4 })
    Tickets.create.mockResolvedValue({ id: 10 })
    Tickets.findByPk.mockResolvedValue({ id: 10 })

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 5, capacity: 99 })

    expect(res.status).toBe(201)
    expect(Tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        capacity: 4,
      })
    )
  })

  it('CT08 - met capacity=2 par défaut si absente/invalide', async () => {
    GameModes.findByPk.mockResolvedValue({ id: 5, playersMax: 5 })
    Tickets.create.mockResolvedValue({ id: 10 })
    Tickets.findByPk.mockResolvedValue({ id: 10 })

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 5, capacity: 0 })

    expect(res.status).toBe(201)
    expect(Tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        capacity: 2,
      })
    )
  })

  it('CT09 - un Admin peut créer un ticket pour un autre utilisateur', async () => {
    GameModes.findByPk.mockResolvedValue({ id: 5, playersMax: 5 })
    Tickets.create.mockResolvedValue({ id: 10 })
    Tickets.findByPk.mockResolvedValue({ id: 10 })

    const res = await request(app)
      .post('/tickets-admin')
      .send({ userId: 999, gameModeId: 5, capacity: 3 })

    expect(res.status).toBe(201)
    expect(Tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 999,
        capacity: 3,
      })
    )
  })

  it('CT10 - renvoie 500 si exception interne (Tickets.create fail)', async () => {
    GameModes.findByPk.mockResolvedValue({ id: 5, playersMax: 5 })
    Tickets.create.mockRejectedValue(new Error('boom'))

    const res = await request(app)
      .post('/tickets')
      .send({ userId: 1, gameModeId: 5, capacity: 3 })

    expect(res.status).toBe(500)
    expect(res.body).toMatchObject({ message: 'Internal error' })
  })
})