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
  
  if (tournament.status !== 'waiting' && tournament.status !== 'ready') {
    throw createError({ statusCode: 400, message: 'Tournament already started or completed' })
  }
  
  if (tournament.currentPlayers >= tournament.maxPlayers) {
    throw createError({ statusCode: 400, message: 'Tournament is full' })
  }
  
  // Check if already joined
  const alreadyJoined = tournament.players.some((p: any) => p.userId === body.userId)
  if (alreadyJoined) {
    throw createError({ statusCode: 400, message: 'Already joined this tournament' })
  }
  
  // Add player
  tournament.players.push({
    userId: body.userId,
    name: body.name,
    elo: body.elo || 1200
  })
  tournament.currentPlayers = tournament.players.length
  
  // Update status to ready if enough players
  if (tournament.currentPlayers >= 2) {
    tournament.status = 'ready'
  }
  
  tournamentStorage.set(id, tournament)
  
  return tournament
})
