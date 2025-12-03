import { tournamentStorage } from '~/server/utils/tournamentStorage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Tournament ID required' })
  }
  
  const tournament: any = tournamentStorage.get(id)
  
  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournament not found' })
  }
  
  // Remove player
  tournament.players = tournament.players.filter((p: any) => p.userId !== body.userId)
  tournament.currentPlayers = tournament.players.length
  
  // Update status
  if (tournament.currentPlayers < 2) {
    tournament.status = 'waiting'
  }
  
  tournamentStorage.set(id, tournament)
  
  return tournament
})
