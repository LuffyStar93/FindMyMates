import { Request, Response } from 'express'
import { Op, WhereOptions } from 'sequelize'
import GameModes from '../models/GameModes'
import Games from '../models/Games'
import Tickets from '../models/Tickets'

// GET /api/modes?gameId=&ranked=true|false&q=&page=&pageSize=
export const listGamemodes = async (req: Request, res: Response) => {
  try {
    const gameId = req.query.gameId !== undefined ? Number(req.query.gameId) : undefined
    const rankedStr = req.query.ranked as string | undefined
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)))

    const where: WhereOptions = {}
    if (Number.isFinite(gameId)) where['gameId'] = gameId!
    if (rankedStr === 'true') where['isRanked'] = true
    if (rankedStr === 'false') where['isRanked'] = false
    if (q) where['modeName'] = { [Op.like]: `%${q}%` }

    const { rows, count } = await GameModes.findAndCountAll({
      where,
      attributes: ['id', 'modeName', 'playersMax', 'gameId', 'isRanked'],
      include: [{ model: Games, as: 'game', attributes: ['id', 'name', 'urlImage'] }],
      order: [['id', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    res.json({
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    })
  } catch (e) {
    console.error('listGamemodes error:', e)
    res.status(500).json({ message: 'Internal error' })
  }
}

// GET /api/modes/:id
export const getGamemode = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid mode id' })

    const row = await GameModes.findByPk(id, {
      attributes: ['id', 'modeName', 'playersMax', 'gameId', 'isRanked'],
      include: [{ model: Games, as: 'game', attributes: ['id', 'name', 'urlImage'] }],
    })
    if (!row) return res.status(404).json({ message: 'Game mode not found' })

    res.json(row)
  } catch (e) {
    console.error('getGamemode error:', e)
    res.status(500).json({ message: 'Internal error' })
  }
}

// POST /api/modes
export const createGamemode = async (req: Request, res: Response) => {
  try {
    const { modeName, playersMax, gameId, isRanked } = req.body as {
      modeName?: string
      playersMax?: number
      gameId?: number
      isRanked?: boolean
    }

    if (!modeName || playersMax == null || gameId == null) {
      return res.status(400).json({ message: 'modeName, playersMax and gameId are required' })
    }

    const name = String(modeName).trim()
    const pmax = Number(playersMax)
    const gId = Number(gameId)
    const ranked = Boolean(isRanked ?? false)

    if (!Number.isInteger(pmax) || pmax <= 0) {
      return res.status(400).json({ message: 'playersMax must be a positive integer' })
    }

    // Vérifier que le jeu existe
    const game = await Games.findByPk(gId, { attributes: ['id'] })
    if (!game) return res.status(404).json({ message: 'Game not found' })

    // Anti-doublon: même nom de mode dans le même jeu
    const dupe = await GameModes.findOne({ where: { gameId: gId, modeName: name } })
    if (dupe) return res.status(409).json({ message: 'A mode with this name already exists for this game' })

    const mode = await GameModes.create({
      modeName: name,
      playersMax: pmax,
      gameId: gId,
      isRanked: ranked,
    })
    res.status(201).json({ ok: true, mode })
  } catch (e) {
    console.error('createGamemode error:', e)
    res.status(500).json({ message: 'Internal error' })
  }
}

// PUT /api/modes/:id
export const updateGamemode = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid mode id' })

    const { modeName, playersMax, gameId, isRanked } = req.body as {
      modeName?: string
      playersMax?: number
      gameId?: number
      isRanked?: boolean
    }

    const payload: any = {}
    if (modeName !== undefined) payload.modeName = String(modeName).trim()
    if (playersMax !== undefined) {
      if (!Number.isInteger(playersMax) || playersMax <= 0) {
        return res.status(400).json({ message: 'playersMax must be a positive integer' })
      }
      payload.playersMax = playersMax
    }
    if (gameId !== undefined) {
      const gId = Number(gameId)
      const game = await Games.findByPk(gId, { attributes: ['id'] })
      if (!game) return res.status(404).json({ message: 'Game not found' })
      payload.gameId = gId
    }
    if (isRanked !== undefined) payload.isRanked = Boolean(isRanked)

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' })
    }

    // Garde-fou : si playersMax diminue, s’assurer qu’aucun ticket n’excède la nouvelle valeur
    if (payload.playersMax !== undefined) {
      const tooMany = await Tickets.count({
        where: {
          gameModeId: id,
          capacity: { [Op.gt]: payload.playersMax },
        },
      })
      if (tooMany > 0) {
        return res
          .status(409)
          .json({ message: 'Some tickets have capacity greater than new playersMax' })
      }
    }

    // Anti-doublon de nom dans le même jeu
    if (payload.modeName || payload.gameId) {
      const current = await GameModes.findByPk(id, { attributes: ['gameId'] })
      if (!current) return res.status(404).json({ message: 'Game mode not found' })
      const targetGameId = payload.gameId ?? current.gameId
      const dupe = await GameModes.findOne({
        where: {
          id: { [Op.ne]: id },
          gameId: targetGameId,
          modeName: payload.modeName ?? undefined,
        },
      })
      if (dupe) return res.status(409).json({ message: 'A mode with this name already exists for this game' })
    }

    const [count] = await GameModes.update(payload, { where: { id } })
    if (count === 0) return res.status(404).json({ message: 'Game mode not found' })

    const mode = await GameModes.findByPk(id, {
      attributes: ['id', 'modeName', 'playersMax', 'gameId', 'isRanked'],
      include: [{ model: Games, as: 'game', attributes: ['id', 'name', 'urlImage'] }],
    })
    res.json({ ok: true, mode })
  } catch (e) {
    console.error('updateGamemode error:', e)
    res.status(500).json({ message: 'Internal error' })
  }
}

// DELETE /api/modes/:id?force=true
export const deleteGamemode = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const force = String(req.query.force ?? 'false') === 'true'
    if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid mode id' })
    if (!force) {
      const tickets = await Tickets.count({ where: { gameModeId: id } })
      if (tickets > 0) {
        return res
          .status(409)
          .json({ message: 'Mode has related tickets. Use ?force=true to delete.' })
      }
    }

    const deleted = await GameModes.destroy({ where: { id } })
    if (!deleted) return res.status(404).json({ message: 'Game mode not found' })

    res.json({ ok: true, message: 'Game mode deleted', id })
  } catch (e) {
    console.error('deleteGamemode error:', e)
    res.status(500).json({ message: 'Internal error' })
  }
}