import { tournamentStorage } from '~/server/utils/tournamentStorage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Tournament ID required' })
  }
  
  const tournament = tournamentStorage.get(id)
  
  if (!tournament) {
    throw createError({ statusCode: 404, message: 'Tournament not found' })
  }
  
  return tournament
})
