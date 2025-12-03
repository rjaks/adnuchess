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
  
  if (tournament.status !== 'ready' && tournament.status !== 'waiting') {
    throw createError({ statusCode: 400, message: 'Tournament is not ready to start' })
  }

  // Need at least 2 players
  if (tournament.players.length < 2) {
    throw createError({ statusCode: 400, message: 'Need at least 2 players to start tournament' })
  }
  
  // Use seeded players if provided, otherwise shuffle randomly
  const orderedPlayers = body.seededPlayers && body.seededPlayers.length === tournament.players.length
    ? body.seededPlayers
    : [...tournament.players].sort(() => Math.random() - 0.5)
  
  // Generate bracket - round 1 matches
  const firstRoundMatches = []
  for (let i = 0; i < orderedPlayers.length; i += 2) {
    if (i + 1 < orderedPlayers.length) {
      firstRoundMatches.push({
        matchId: `match_${Date.now()}_${i}`,
        player1Id: orderedPlayers[i].userId,
        player2Id: orderedPlayers[i + 1].userId,
        winnerId: null,
        gameId: null,
        status: 'pending'
      })
    } else {
      // Bye - player advances automatically
      firstRoundMatches.push({
        matchId: `match_${Date.now()}_${i}`,
        player1Id: orderedPlayers[i].userId,
        player2Id: null,
        winnerId: orderedPlayers[i].userId,
        gameId: null,
        status: 'completed'
      })
    }
  }
  
  tournament.rounds = [{
    roundNumber: 1,
    matches: firstRoundMatches,
    status: 'active'
  }]
  tournament.status = 'active'
  tournament.currentRound = 0
  
  tournamentStorage.set(id, tournament)
  
  return tournament
})
