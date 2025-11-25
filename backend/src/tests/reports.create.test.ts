import { createReport } from '@/controllers/reportsController'
import express from 'express'
import request from 'supertest'

// === Mocks Sequelize models ===
jest.mock('@/models/Tickets', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}))

jest.mock('@/models/Reports', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}))

jest.mock('@/models/UserReport', () => ({
  __esModule: true,
  default: {
    bulkCreate: jest.fn(),
  },
}))

const Tickets = require('@/models/Tickets').default as any
const Reports = require('@/models/Reports').default as any
const UserReport = require('@/models/UserReport').default as any

// === App Express de test ===
const app = express()
app.use(express.json())

// route avec auth
app.post(
  '/reports',
  (req, _res, next) => {
    ;(req as any).user = { id: 1, role: 'User' }
    next()
  },
  createReport as any
)

// route sans auth
app.post('/reports-no-auth', createReport as any)

describe('POST /reports (createReport)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('RP01 - crée un signalement simple (sans cible) si ticket existe', async () => {
    ;(Tickets.findByPk as jest.Mock).mockResolvedValue({ id: 10 })

    const createdReport = { id: 55 }
    ;(Reports.create as jest.Mock).mockResolvedValue(createdReport)

    // report complet rechargé, avec toJSON pour passer dans toDto
    ;(Reports.findByPk as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        id: 55,
        description: 'toxic',
        reason: 'bug',
        ticketId: 10,
        userId: 1,
        status: 'open',
        createdAt: new Date().toISOString(),
        reporter: { id: 1, pseudo: 'max', name: 'Max' },
        reportedUsers: [],
        ticket: null,
      }),
    })

    const res = await request(app).post('/reports').send({
      description: 'toxic player',
      reason: 'bug',
      ticketId: 10,
    })

    expect(res.status).toBe(201)
    expect(Tickets.findByPk).toHaveBeenCalledWith(10)

    expect(Reports.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'toxic player',
        reason: 'bug',
        ticketId: 10,
        userId: 1,
      })
    )

    expect(UserReport.bulkCreate).not.toHaveBeenCalled()
    expect(Reports.findByPk).toHaveBeenCalledWith(
      55,
      expect.any(Object)
    )
  })

  it('RP02 - crée un signalement avec joueurs ciblés et bulkCreate des liens', async () => {
    ;(Tickets.findByPk as jest.Mock).mockResolvedValue({ id: 10 })

    const createdReport = { id: 56 }
    ;(Reports.create as jest.Mock).mockResolvedValue(createdReport)

    ;(UserReport.bulkCreate as jest.Mock).mockResolvedValue(undefined)

    ;(Reports.findByPk as jest.Mock).mockResolvedValue({
      toJSON: () => ({
        id: 56,
        description: 'insultes',
        reason: 'other',
        ticketId: 10,
        userId: 1,
        status: 'open',
        createdAt: new Date().toISOString(),
        reporter: { id: 1, pseudo: 'max', name: 'Max' },
        reportedUsers: [
          { id: 2, pseudo: 'p2', name: 'P2' },
          { id: 3, pseudo: 'p3', name: 'P3' },
        ],
        ticket: null,
      }),
    })

    const res = await request(app).post('/reports').send({
      description: 'insultes vocales',
      reason: 'other',
      ticketId: 10,
      targetUserIds: [2, 3],
    })

    expect(res.status).toBe(201)

    expect(UserReport.bulkCreate).toHaveBeenCalledWith(
      [
        { reportId: 56, userId: 2 },
        { reportId: 56, userId: 3 },
      ],
      { ignoreDuplicates: true }
    )
  })

  it('RP03 - renvoie 401 si non authentifié', async () => {
    const res = await request(app).post('/reports-no-auth').send({
      description: 'x',
      reason: 'bug',
      ticketId: 10,
    })

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ message: 'Auth required' })
  })

  it('RP04 - renvoie 400 si champs manquants', async () => {
    const res = await request(app).post('/reports').send({
      reason: 'bug',
      ticketId: 10,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ message: 'Missing fields' })
  })

  it('RP05 - renvoie 404 si ticket introuvable', async () => {
    ;(Tickets.findByPk as jest.Mock).mockResolvedValue(null)

    const res = await request(app).post('/reports').send({
      description: 'bad',
      reason: 'other',
      ticketId: 999,
    })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ message: 'Ticket not found' })
  })
})