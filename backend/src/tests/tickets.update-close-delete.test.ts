import {
  closeTicketByOwner,
  deleteTicket,
  updateTicket,
} from '@/controllers/ticketsController'
import express from 'express'
import request from 'supertest'

// ===== Mocks Sequelize models =====
jest.mock('@/models/Tickets', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}))
jest.mock('@/models/GameModes', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}))
jest.mock('@/models/Games', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/Users', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/UserTicket', () => ({
  __esModule: true,
  default: {
    destroy: jest.fn(),
  },
}))

const Tickets = require('@/models/Tickets').default as any
const GameModes = require('@/models/GameModes').default as any
const UserTicket = require('@/models/UserTicket').default as any

// ===== App Express de test =====
const app = express()
app.use(express.json())

// inject auth user
function authAs(user: any) {
  return (req: any, _res: any, next: any) => {
    req.user = user
    next()
  }
}

app.put('/tickets/:id', authAs({ id: 1, role: 'User' }), updateTicket as any)
app.patch(
  '/tickets/:id/close',
  authAs({ id: 1, role: 'User' }),
  closeTicketByOwner as any
)
app.delete(
  '/tickets/:id',
  authAs({ id: 1, role: 'User' }),
  deleteTicket as any
)

describe('Tickets - update / close / delete', () => {
  beforeEach(() => jest.clearAllMocks())

  // -------- UPDATE --------
  describe('PUT /tickets/:id (updateTicket)', () => {
    it('UT01 - 400 si id invalide', async () => {
      const res = await request(app).put('/tickets/abc').send({ status: 'closed' })
      expect(res.status).toBe(400)
      expect(res.body).toMatchObject({ message: 'Invalid ticket id' })
    })

    it('UT02 - 404 si ticket introuvable', async () => {
      Tickets.findByPk.mockResolvedValue(null)

      const res = await request(app).put('/tickets/10').send({ status: 'closed' })
      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ message: 'Ticket not found' })
    })

    it('UT03 - 403 si pas owner/staff', async () => {
      Tickets.findByPk.mockResolvedValue({
        id: 10,
        userId: 999,
        nbPlayers: 1,
        capacity: 3,
        status: 'open',
      })

      const res = await request(app).put('/tickets/10').send({ status: 'closed' })
      expect(res.status).toBe(403)
      expect(res.body).toMatchObject({ message: 'Forbidden' })
    })

    it('UT04 - 409 si tentative réouverture ticket clos', async () => {
      const ticket = {
        id: 10,
        userId: 1,
        nbPlayers: 2,
        capacity: 3,
        status: 'closed',
        isActive: false,
        save: jest.fn(),
      }
      Tickets.findByPk.mockResolvedValue(ticket)

      const res = await request(app).put('/tickets/10').send({ status: 'open' })
      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({ message: 'Closed tickets cannot be reopened' })
    })

    it('UT05 - 400 si capacity invalide', async () => {
      const ticket = {
        id: 10,
        userId: 1,
        nbPlayers: 2,
        capacity: 3,
        status: 'open',
        isActive: true,
        gameModeId: 5,
        save: jest.fn(),
      }
      Tickets.findByPk.mockResolvedValue(ticket)
      GameModes.findByPk.mockResolvedValue({ playersMax: 5 })

      const res = await request(app).put('/tickets/10').send({ capacity: 'nope' })
      expect(res.status).toBe(400)
      expect(res.body).toMatchObject({ message: 'Invalid capacity' })
    })

    it('UT06 - 200 met à jour capacity + isActive', async () => {
      const ticket = {
        id: 10,
        userId: 1,
        nbPlayers: 2,
        capacity: 3,
        status: 'open',
        isActive: true,
        gameModeId: 5,
        save: jest.fn().mockResolvedValue(undefined),
      }
      Tickets.findByPk
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce({ ...ticket, capacity: 4 })

      GameModes.findByPk.mockResolvedValue({ playersMax: 6 })

      const res = await request(app).put('/tickets/10').send({ capacity: 4 })

      expect(res.status).toBe(200)
      expect(ticket.capacity).toBe(4)
      expect(ticket.save).toHaveBeenCalled()
      expect(res.body.ok).toBe(true)
      expect(res.body.ticket.capacity).toBe(4)
    })
  })

  // -------- CLOSE --------
  describe('PATCH /tickets/:id/close (closeTicketByOwner)', () => {
    it('CT01 - 404 si ticket introuvable', async () => {
      Tickets.findByPk.mockResolvedValue(null)

      const res = await request(app).patch('/tickets/10/close')
      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ message: 'Ticket not found' })
    })

    it('CT02 - 409 si déjà closed', async () => {
      Tickets.findByPk.mockResolvedValue({
        id: 10,
        userId: 1,
        status: 'closed',
      })

      const res = await request(app).patch('/tickets/10/close')
      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({ message: 'Ticket already closed' })
    })

    it('CT03 - 200 ferme le ticket', async () => {
      const ticket = {
        id: 10,
        userId: 1,
        status: 'open',
        isActive: true,
        endedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
      }

      Tickets.findByPk
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce({ ...ticket, status: 'closed', isActive: false })

      const res = await request(app).patch('/tickets/10/close')

      expect(res.status).toBe(200)
      expect(ticket.status).toBe('closed')
      expect(ticket.isActive).toBe(false)
      expect(ticket.save).toHaveBeenCalled()
      expect(res.body.ok).toBe(true)
    })
  })

  // -------- DELETE --------
  describe('DELETE /tickets/:id (deleteTicket)', () => {
    it('DT01 - 404 si ticket introuvable', async () => {
      Tickets.findByPk.mockResolvedValue(null)

      const res = await request(app).delete('/tickets/10')
      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ message: 'Ticket not found' })
    })

    it('DT02 - 403 si pas owner/staff', async () => {
      Tickets.findByPk.mockResolvedValue({
        id: 10,
        userId: 999,
      })

      const res = await request(app).delete('/tickets/10')
      expect(res.status).toBe(403)
      expect(res.body).toMatchObject({ message: 'Forbidden' })
    })

    it('DT03 - 200 supprime relations + ticket', async () => {
      const ticket = {
        id: 10,
        userId: 1,
        destroy: jest.fn().mockResolvedValue(undefined),
      }

      Tickets.findByPk.mockResolvedValue(ticket)
      UserTicket.destroy.mockResolvedValue(1)

      const res = await request(app).delete('/tickets/10')

      expect(res.status).toBe(200)
      expect(UserTicket.destroy).toHaveBeenCalledWith({ where: { ticketId: 10 } })
      expect(ticket.destroy).toHaveBeenCalled()
      expect(res.body).toMatchObject({ ok: true, deleted: true })
    })
  })
})