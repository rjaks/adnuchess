import { tournamentStorage } from '~/server/utils/tournamentStorage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Tournament ID required' })
  }
  
  tournamentStorage.delete(id)
  
  return { success: true }
})
