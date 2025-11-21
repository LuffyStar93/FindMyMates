import { Op } from 'sequelize'
import Tickets from '../models/Tickets'

export function startTicketAutoCloseJob(
  { intervalMs = 60_000, ttlMs = 60 * 60_000 } = {}
) {
  const timer = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - ttlMs)

      const [count] = await Tickets.update(
        { status: 'closed', isActive: false, endedAt: new Date() },
        {
          where: {
            status: 'open',
            createdAt: { [Op.lt]: cutoff },
          },
        }
      )

      if (count > 0) {
        console.log(`⏱️ Auto-closed ${count} ticket(s) (older than ${ttlMs / 60000}min)`)
      }
    } catch (e) {
      console.error('autoClose job error:', e)
    }
  }, intervalMs)

  return timer
}