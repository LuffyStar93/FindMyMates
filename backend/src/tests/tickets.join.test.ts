import { joinTicket } from '@/controllers/ticketsController'
import express from 'express'
import request from 'supertest'

// === Mocks Sequelize models ===
jest.mock('@/models/Tickets', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}))

jest.mock('@/models/UserTicket', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

const Tickets = require('@/models/Tickets').default as any
const UserTicket = require('@/models/UserTicket').default as any

// === App Express de test ===
const app = express()
app.use(express.json())

// middleware d’auth pour injecter req.user
app.post(
  '/tickets/:id/join',
  (req, _res, next) => {
    ;(req as any).user = { id: 1, role: 'User' }
    next()
  },
  joinTicket as any
)

// route sans auth pour tester le 401
app.post('/tickets/:id/join-no-auth', joinTicket as any)

describe('POST /tickets/:id/join (joinTicket)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('JE06 - permet à un utilisateur de rejoindre un ticket ouvert et non plein', async () => {
    const ticket = {
      id: 10,
      status: 'open',
      isActive: true,
      nbPlayers: 1,
      capacity: 3,
      userId: 999,
      save: jest.fn().mockResolvedValue(undefined),
    }

    const updatedTicket = {
      ...ticket,
      nbPlayers: 2,
      isActive: true,
    }

    // 1er findByPk : avant modification
    // 2e findByPk : après join (rechargement)
    ;(Tickets.findByPk as jest.Mock)
      .mockResolvedValueOnce(ticket)
      .mockResolvedValueOnce(updatedTicket)

    ;(UserTicket.findOne as jest.Mock).mockResolvedValue(null)
    ;(UserTicket.create as jest.Mock).mockResolvedValue({})

    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 1 })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    expect(UserTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        ticketId: 10,
      })
    )

    expect(ticket.save).toHaveBeenCalled()

    expect(res.body.ticket).toMatchObject({
      id: 10,
      nbPlayers: 2,
      isActive: true,
    })
  })

  it('JE07 - renvoie 401 si non authentifié', async () => {
    const res = await request(app)
      .post('/tickets/10/join-no-auth')
      .send({ userId: 1 })

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({
      message: 'Auth required',
    })
  })

  it('JE08 - renvoie 400 si paramètres invalides', async () => {
    const res = await request(app)
      .post('/tickets/abc/join')
      .send({ userId: 1 })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Invalid parameters',
    })
  })

  it("JE09 - renvoie 403 si l'utilisateur tente de rejoindre pour un autre user", async () => {
    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 999 })

    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({
      message: 'You cannot join on behalf of another user',
    })
  })

  it('JE10 - renvoie 404 si le ticket est introuvable', async () => {
    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .post('/tickets/999/join')
      .send({ userId: 1 })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({
      message: 'Ticket not found',
    })
  })

  it('JE11 - renvoie 409 si le ticket est fermé', async () => {
    const ticket = {
      id: 10,
      status: 'closed',
      isActive: false,
      nbPlayers: 1,
      capacity: 3,
      save: jest.fn(),
    }

    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(ticket)

    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 1 })

    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({
      message: 'Ticket is closed',
    })
  })

  it('JE12 - renvoie 409 si le ticket est marqué inactif', async () => {
    const ticket = {
      id: 10,
      status: 'open',
      isActive: false,
      nbPlayers: 1,
      capacity: 3,
      save: jest.fn(),
    }

    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(ticket)

    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 1 })

    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({
      message: 'Ticket is full or not active',
    })
  })

  it('JE13 - renvoie 409 si utilisateur déjà présent dans le ticket', async () => {
    const ticket = {
      id: 10,
      status: 'open',
      isActive: true,
      nbPlayers: 2,
      capacity: 3,
      save: jest.fn(),
    }

    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(ticket)
    ;(UserTicket.findOne as jest.Mock).mockResolvedValue({
      id: 999,
      userId: 1,
      ticketId: 10,
    })

    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 1 })

    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({
      message: 'Already joined',
    })
  })

  it('JE14 - renvoie 409 si le ticket est déjà plein', async () => {
    const ticket = {
      id: 10,
      status: 'open',
      isActive: true,
      nbPlayers: 3,
      capacity: 3,
      save: jest.fn(),
    }

    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(ticket)
    ;(UserTicket.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .post('/tickets/10/join')
      .send({ userId: 1 })

    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({
      message: 'Ticket is already full',
    })
  })
})