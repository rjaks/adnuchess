import { tournamentStorage } from '~/server/utils/tournamentStorage'

export default defineEventHandler(async () => {
  // Return all tournaments from in-memory storage
  return Array.from(tournamentStorage.values())
})
