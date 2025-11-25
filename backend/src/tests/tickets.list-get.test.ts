import { getTicket, listTickets } from '@/controllers/ticketsController'
import express from 'express'
import request from 'supertest'

// ===== Mocks Sequelize models =====
jest.mock('@/models/Tickets', () => ({
  __esModule: true,
  default: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  },
}))
jest.mock('@/models/GameModes', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/Games', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/Users', () => ({ __esModule: true, default: {} }))
jest.mock('@/models/UserTicket', () => ({ __esModule: true, default: {} }))

const Tickets = require('@/models/Tickets').default as any

// ===== App Express de test =====
const app = express()
app.use(express.json())

app.get('/tickets', listTickets as any)
app.get('/tickets/:id', getTicket as any)

describe('Tickets - listTickets & getTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /tickets (listTickets)', () => {
    it('LT01 - renvoie une liste paginée', async () => {
      Tickets.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1 }, { id: 2 }],
        count: 2,
      })

      const res = await request(app).get('/tickets')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        items: [{ id: 1 }, { id: 2 }],
        page: 1,
        limit: 50,
        total: 2,
        pageCount: 1,
      })
      expect(Tickets.findAndCountAll).toHaveBeenCalledTimes(1)
    })

    it('LT02 - applique les filtres status + modeId + pagination', async () => {
      Tickets.findAndCountAll.mockResolvedValue({ rows: [], count: 0 })

      const res = await request(app).get(
        '/tickets?status=open&modeId=3&page=2&limit=10&order=asc'
      )

      expect(res.status).toBe(200)
      expect(Tickets.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'open', gameModeId: 3 },
          limit: 10,
          offset: 10,
          order: [['createdAt', 'ASC']],
        })
      )
    })

    it('LT03 - renvoie 500 si exception', async () => {
      Tickets.findAndCountAll.mockRejectedValue(new Error('boom'))

      const res = await request(app).get('/tickets')

      expect(res.status).toBe(500)
      expect(res.body).toMatchObject({ message: 'Internal error' })
    })
  })

  describe('GET /tickets/:id (getTicket)', () => {
    it('GT01 - renvoie 400 si id invalide', async () => {
      const res = await request(app).get('/tickets/abc')

      expect(res.status).toBe(400)
      expect(res.body).toMatchObject({ message: 'Invalid ticket id' })
    })

    it('GT02 - renvoie 404 si ticket introuvable', async () => {
      Tickets.findByPk.mockResolvedValue(null)

      const res = await request(app).get('/tickets/999')

      expect(res.status).toBe(404)
      expect(res.body).toMatchObject({ message: 'Ticket not found' })
    })

    it('GT03 - renvoie le ticket si trouvé', async () => {
      Tickets.findByPk.mockResolvedValue({ id: 10, status: 'open' })

      const res = await request(app).get('/tickets/10')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 10, status: 'open' })
    })

    it('GT04 - renvoie 500 si exception', async () => {
      Tickets.findByPk.mockRejectedValue(new Error('boom'))

      const res = await request(app).get('/tickets/10')

      expect(res.status).toBe(500)
      expect(res.body).toMatchObject({ message: 'Internal error' })
    })
  })
})