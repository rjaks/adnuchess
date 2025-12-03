import { tournamentStorage } from '~/server/utils/tournamentStorage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  const tournament = {
    _id: tournamentId,
    name: body.name,
    status: 'waiting',
    maxPlayers: body.maxPlayers,
    currentPlayers: 0,
    players: [],
    rounds: [],
    currentRound: 0,
    createdBy: body.createdBy,
    createdAt: Date.now()
  }
  
  tournamentStorage.set(tournamentId, tournament)
  
  return { tournamentId, tournament }
})
