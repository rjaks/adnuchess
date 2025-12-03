<template>
  <div class="battle-royale-page">
    <div class="page-header">
      <h1 class="title">Battle Royale</h1>
      <p class="subtitle">Last Chess Player Standing Wins!</p>
      <!-- Auth status indicator -->
      <div v-if="!user" class="auth-warning">
        <p class="text-yellow-400 text-sm">⚠️ You must be logged in to create or join tournaments</p>
      </div>
    </div>

    <!-- Tournament Selection View -->
    <div v-if="!selectedTournament" class="tournaments-container">
      <!-- Create Tournament Button -->
      <div class="create-tournament-section">
        <button
          @click="showCreateModal = true"
          class="create-btn"
          :disabled="!canCreateTournament"
          :class="{ 'opacity-50 cursor-not-allowed': !canCreateTournament }"
        >
          <span class="text-3xl">+</span>
          <span>Create New Tournament</span>
          <span v-if="!user" class="text-xs block text-yellow-300">(Login Required)</span>
          <span v-else-if="!canCreateTournament" class="text-xs block text-yellow-300">(Admin Access Required)</span>
        </button>
      </div>

      <!-- Active Tournaments List -->
      <div class="tournaments-list">
        <h2 class="section-title">Open Tournaments</h2>
        <div v-if="loadingTournaments" class="loading-state">
          <div class="spinner"></div>
          <p>Loading tournaments...</p>
        </div>
        <div v-else-if="activeTournaments.length === 0" class="empty-state">
          <div class="empty-icon">🏆</div>
          <p class="text-xl text-white/80">No active tournaments</p>
          <p class="text-sm text-white/60">Create one to get started!</p>
        </div>
        <div v-else class="tournaments-grid">
          <div 
            v-for="tournament in activeTournaments" 
            :key="tournament._id"
            class="tournament-card"
          >
            <div class="tournament-info" @click="selectTournament(tournament._id)">
              <h3 class="tournament-name">{{ tournament.name }}</h3>
              <p class="tournament-id">ID: {{ tournament._id }}</p>
              <div class="tournament-meta">
                <span class="player-count">
                  {{ tournament.currentPlayers }} / {{ tournament.maxPlayers }} Players
                </span>
                <span class="status-badge" :class="getStatusClass(tournament.status)">
                  {{ tournament.status }}
                </span>
              </div>
            </div>
            <div class="tournament-actions">
              <button @click="selectTournament(tournament._id)" class="join-quick-btn">
                View Tournament →
              </button>
              <button 
                v-if="tournament.createdBy === currentUserId"
                @click.stop="deleteTournament(tournament._id)"
                class="delete-btn"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- My Tournaments -->
      <div v-if="myTournamentsList.length > 0" class="tournaments-list">
        <h2 class="section-title">My Tournaments</h2>
        <div class="tournaments-grid">
          <div 
            v-for="tournament in myTournamentsList" 
            :key="tournament._id"
            class="tournament-card"
          >
            <div class="tournament-info" @click="selectTournament(tournament._id)">
              <h3 class="tournament-name">{{ tournament.name }}</h3>
              <p class="tournament-id">ID: {{ tournament._id }}</p>
              <div class="tournament-meta">
                <span class="player-count">
                  {{ tournament.currentPlayers }} / {{ tournament.maxPlayers }} Players
                </span>
                <span class="status-badge" :class="getStatusClass(tournament.status)">
                  {{ tournament.status }}
                </span>
              </div>
            </div>
            <div class="tournament-actions">
              <button @click="selectTournament(tournament._id)" class="join-quick-btn">
                View →
              </button>
              <button 
                v-if="tournament.createdBy === currentUserId"
                @click.stop="deleteTournament(tournament._id)"
                class="delete-btn"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament Bracket View -->
    <div v-else class="tournament-view">
      <button @click="selectedTournament = null" class="back-btn">
        ← Back to Tournaments
      </button>
      <TournamentBracket
        v-if="currentTournamentData"
        :tournament="currentTournamentData"
        :current-user-id="currentUserId"
        @join-tournament="handleJoinTournament"
        @leave-tournament="handleLeaveTournament"
        @start-tournament="handleStartTournament"
        @start-match="handleStartMatch"
        @view-game="handleViewGame"
        @player-ready="handlePlayerReady"
        @watch-player="handleWatchPlayer"
        @send-invite="handleSendInvite"
        @game-complete="handleGameComplete"
      />
    </div>

    <!-- Create Tournament Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h2 class="modal-title">Create Tournament</h2>
        <form @submit.prevent="handleCreateTournament" class="create-form">
          <div class="form-group">
            <label for="tournament-name">Tournament Name</label>
            <input
              id="tournament-name"
              v-model="newTournament.name"
              type="text"
              placeholder="Enter tournament name..."
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="max-players">Maximum Players</label>
            <select
              id="max-players"
              v-model.number="newTournament.maxPlayers"
              class="form-input"
            >
              <option :value="4">4 Players</option>
              <option :value="8">8 Players</option>
              <option :value="16">16 Players</option>
              <option :value="32">32 Players</option>
            </select>
          </div>

          <div class="form-group">
            <label>Match Format (Best of)</label>
            <select v-model.number="newTournament.bestOf" class="form-input">
              <option :value="1">Best of 1 (Single Game)</option>
              <option :value="3">Best of 3 (First to 2 wins)</option>
              <option :value="5">Best of 5 (First to 3 wins)</option>
              <option :value="7">Best of 7 (First to 4 wins)</option>
            </select>
            <p class="text-xs text-white/70 mt-1">
              Winners automatically advance to the next round
            </p>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="creatingTournament">
              {{ creatingTournament ? 'Creating...' : 'Create Tournament' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Invite Acceptance Modal -->
    <div v-if="showAcceptanceModal && pendingInviteData" class="modal-overlay" @click="handleDeclineInvite">
      <div class="acceptance-modal" @click.stop>
        <div class="acceptance-icon">🎯</div>
        <h3 class="acceptance-title">Tournament Invitation</h3>
        <p class="acceptance-message">
          <strong>{{ pendingInviteData.playerName }}</strong> received your tournament invitation!
        </p>
        <p class="acceptance-submessage">
          Simulate their response? (In live mode, they would see a notification)
        </p>
        <div class="acceptance-actions">
          <button @click="handleDeclineInvite" class="decline-btn">
            ❌ Decline
          </button>
          <button @click="handleAcceptInvite" class="accept-btn">
            ✅ Accept & Join
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useConvex } from '~/composables/useConvex'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import TournamentBracket from '~/components/TournamentBracket.vue'
import { isAdminEmail } from '~/config/admin'

const router = useRouter()
const { user } = useAuth()
const { $convex } = useNuxtApp()

// Check if user can create tournaments (admin or authorized)
const canCreateTournament = computed(() => {
  if (DEV_MODE.value) return true // Allow in dev mode
  return user.value && isAdminEmail(user.value.email)
})

const showCreateModal = ref(false)
const selectedTournament = ref<string | null>(null)
const loadingTournaments = ref(true)
const creatingTournament = ref(false)

const activeTournaments = ref<any[]>([])
const myTournamentsList = ref<any[]>([])
const currentTournamentData = ref<any>(null)

// Invite acceptance modal
const showAcceptanceModal = ref(false)
const pendingInviteData = ref<{ playerName: string; tournamentId: string; playerId: string } | null>(null)

const newTournament = ref({
  name: '',
  maxPlayers: 8,
  bestOf: 1
})

// Dev mode - set to true to use mock data for frontend design
const DEV_MODE = ref(true)
const MOCK_USER_ID = 'mock-user-1' // Simulated logged-in user

const currentUserId = computed(() => {
  if (DEV_MODE.value) return MOCK_USER_ID
  return user.value?.id || ''
})

// Mock data for development
const mockTournaments = [
  {
    _id: 'mock-1',
    name: 'Ateneo League Championship',
    status: 'waiting',
    maxPlayers: 8,
    currentPlayers: 3,
    createdBy: 'mock-user-1',
    bestOf: 3,
    players: [
      { userId: 'mock-user-1', name: 'Juan Dela Cruz', elo: 1500, department: 'Computer Science', joinedAt: Date.now(), status: 'active' },
      { userId: 'mock-user-2', name: 'Maria Santos', elo: 1450, department: 'Engineering', joinedAt: Date.now(), status: 'active' },
      { userId: 'mock-user-3', name: 'Pedro Reyes', elo: 1600, department: 'Business Admin', joinedAt: Date.now(), status: 'active' },
    ],
    rounds: [],
    currentRound: 0,
    createdAt: Date.now()
  },
  {
    _id: 'mock-2',
    name: 'Quick Tournament (Active)',
    status: 'active',
    maxPlayers: 4,
    currentPlayers: 4,
    createdBy: 'mock-user-2',
    bestOf: 1,
    players: [
      { userId: 'mock-user-1', name: 'You (Mock User)', elo: 1500, department: 'Computer Science', joinedAt: Date.now(), status: 'active' },
      { userId: 'mock-user-2', name: 'Alice Garcia', elo: 1450, department: 'Mathematics', joinedAt: Date.now(), status: 'active' },
      { userId: 'mock-user-3', name: 'Bob Tan', elo: 1600, department: 'Engineering', joinedAt: Date.now(), status: 'active' },
      { userId: 'mock-user-4', name: 'Charlie Wong', elo: 1550, department: 'Business Admin', joinedAt: Date.now(), status: 'active' },
    ],
    rounds: [
      {
        roundNumber: 1,
        status: 'active',
        matches: [
          {
            matchId: 'mock-match-1',
            player1Id: 'mock-user-1',
            player2Id: 'mock-user-2',
            status: 'pending',
            player1Ready: false,
            player2Ready: false,
            games: [],
            player1Score: 0,
            player2Score: 0
          },
          {
            matchId: 'mock-match-2',
            player1Id: 'mock-user-3',
            player2Id: 'mock-user-4',
            status: 'active',
            gameId: 'mock-game-2',
            player1Ready: true,
            player2Ready: true,
            games: [{ gameId: 'mock-game-2', winnerId: null }],
            player1Score: 0,
            player2Score: 0
          }
        ]
      }
    ],
    currentRound: 1,
    createdAt: Date.now()
  }
]

const loadTournaments = async () => {
  try {
    console.log('Loading tournaments...')
    
    // Use mock data in dev mode
    if (DEV_MODE.value) {
      console.log('Using mock tournament data')
      activeTournaments.value = mockTournaments
      loadingTournaments.value = false
      return
    }
    
    const tournaments = await $convex.query(api.tournaments.listActiveTournaments, {})
    
    console.log('Tournaments loaded:', tournaments)
    
    if (tournaments) {
      activeTournaments.value = tournaments.filter((t: any) => t.status !== 'completed')
      
      if (currentUserId.value) {
        myTournamentsList.value = tournaments.filter((t: any) =>
          t.players.some((p: any) => p.userId === currentUserId.value)
        )
      }
      
      // Update current tournament data if viewing one
      if (selectedTournament.value) {
        const current = tournaments.find((t: any) => t._id === selectedTournament.value)
        if (current) {
          currentTournamentData.value = current
          console.log('Updated current tournament data:', current)
        } else {
          console.warn('Selected tournament not found:', selectedTournament.value)
        }
      }
    }
    
    loadingTournaments.value = false
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    console.error('Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      error
    })
    loadingTournaments.value = false
  }
}

onMounted(async () => {
  console.log('Battle Royale page mounted')
  console.log('User on mount:', user.value)
  console.log('Current User ID on mount:', currentUserId.value)
  
  await loadTournaments()
  
  // Poll for updates every 2 seconds for real-time sync
  setInterval(() => {
    loadTournaments()
  }, 2000)
})

const handleCreateTournament = async () => {
  console.log('Creating tournament - User:', user.value)
  console.log('Current User ID:', currentUserId.value)
  
  if (!newTournament.value.name.trim()) {
    alert('Please enter a tournament name')
    return
  }

  creatingTournament.value = true
  
  try {
    // Mock mode - create fake tournament for design purposes
    if (DEV_MODE.value) {
      console.log('Creating mock tournament')
      const mockId = `mock-${Date.now()}`
      const newMockTournament = {
        _id: mockId,
        name: newTournament.value.name,
        status: 'waiting',
        maxPlayers: newTournament.value.maxPlayers,
        currentPlayers: 0,
        createdBy: 'mock-user',
        bestOf: newTournament.value.bestOf,
        players: [],
        rounds: [],
        currentRound: 0,
        createdAt: Date.now()
      }
      
      mockTournaments.push(newMockTournament)
      activeTournaments.value = [...mockTournaments]
      
      showCreateModal.value = false
      newTournament.value = { name: '', maxPlayers: 8, bestOf: 1 }
      
      setTimeout(() => {
        selectTournament(mockId)
      }, 500)
      
      creatingTournament.value = false
      return
    }
    
    // Real backend call
    if (!user.value || !currentUserId.value) {
      console.error('User not authenticated:', { user: user.value, userId: currentUserId.value })
      alert('Please sign in to create a tournament. You must be logged in.')
      creatingTournament.value = false
      return
    }
    
    console.log('Calling createTournament with:', {
      name: newTournament.value.name,
      maxPlayers: newTournament.value.maxPlayers,
      createdBy: currentUserId.value
    })
    
    const tournamentId = await $convex.mutation(api.tournaments.createTournament, {
      name: newTournament.value.name,
      maxPlayers: newTournament.value.maxPlayers,
      createdBy: currentUserId.value
    })

    console.log('Tournament created successfully! ID:', tournamentId)
    
    showCreateModal.value = false
    newTournament.value = { name: '', maxPlayers: 8, bestOf: 1 }
    
    await loadTournaments()
    
    // Wait a bit for the tournament to be fully loaded
    setTimeout(() => {
      console.log('Selecting tournament:', tournamentId)
      selectTournament(tournamentId)
    }, 500)
  } catch (error) {
    console.error('Failed to create tournament:', error)
    console.error('Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      error
    })
    alert(`Failed to create tournament: ${(error as any)?.message || 'Unknown error'}. Please try again.`)
  } finally {
    creatingTournament.value = false
  }
}

const selectTournament = (tournamentId: string) => {
  console.log('Selecting tournament:', tournamentId)
  selectedTournament.value = tournamentId
  const tournament = activeTournaments.value.find(t => t._id === tournamentId) ||
                     myTournamentsList.value.find(t => t._id === tournamentId)
  if (tournament) {
    currentTournamentData.value = tournament
    console.log('Tournament selected:', tournament)
  } else {
    console.error('Tournament not found in lists:', {
      tournamentId,
      activeTournaments: activeTournaments.value.map(t => t._id),
      myTournaments: myTournamentsList.value.map(t => t._id)
    })
  }
}

const handleJoinTournament = async () => {
  if (!selectedTournament.value) return

  try {
    // Mock mode - add player to tournament
    if (DEV_MODE.value) {
      console.log('Joining mock tournament')
      const tournament = activeTournaments.value.find(t => t._id === selectedTournament.value)
      if (tournament && !tournament.players.some((p: any) => p.userId === currentUserId.value)) {
        tournament.players.push({
          userId: currentUserId.value,
          name: 'You (Mock User)',
          elo: 1500,
          joinedAt: Date.now(),
          status: 'active'
        })
        tournament.currentPlayers++
        currentTournamentData.value = { ...tournament }
      }
      return
    }

    if (!user.value) return
    await $convex.mutation(api.tournaments.joinTournament, {
      tournamentId: selectedTournament.value as Id<"tournaments">,
      userId: user.value.id,
      name: user.value.email || user.value.id,
      elo: 1200
    })
    
    await loadTournaments()
  } catch (error) {
    console.error('Failed to join tournament:', error)
    alert((error as any).message || 'Failed to join tournament')
  }
}

const handleLeaveTournament = async () => {
  if (!selectedTournament.value || !currentUserId.value) return

  try {
    // Mock mode - remove player from tournament
    if (DEV_MODE.value) {
      console.log('Leaving mock tournament')
      const tournament = activeTournaments.value.find(t => t._id === selectedTournament.value)
      if (tournament) {
        tournament.players = tournament.players.filter((p: any) => p.userId !== currentUserId.value)
        tournament.currentPlayers--
        currentTournamentData.value = { ...tournament }
      }
      return
    }

    await $convex.mutation(api.tournaments.leaveTournament, {
      tournamentId: selectedTournament.value as Id<"tournaments">,
      userId: currentUserId.value
    })
    
    await loadTournaments()
  } catch (error) {
    console.error('Failed to leave tournament:', error)
    alert((error as any).message || 'Failed to leave tournament')
  }
}

const handleStartTournament = async (seededPlayers?: any[]) => {
  if (!selectedTournament.value) return

  try {
    // Mock mode - generate bracket
    if (DEV_MODE.value) {
      console.log('Starting mock tournament with seeded players:', seededPlayers)
      const tournament = activeTournaments.value.find(t => t._id === selectedTournament.value)
      if (tournament) {
        const players = seededPlayers || tournament.players
        const matches = []
        
        // Create first round matches
        for (let i = 0; i < players.length; i += 2) {
          matches.push({
            matchId: `mock-match-${i/2}`,
            player1Id: players[i].userId,
            player2Id: players[i + 1]?.userId,
            status: 'pending',
            player1Ready: false,
            player2Ready: false
          })
        }
        
        tournament.status = 'active'
        tournament.rounds = [{
          roundNumber: 1,
          status: 'active',
          matches
        }]
        tournament.currentRound = 1
        currentTournamentData.value = { ...tournament }
      }
      return
    }

    await $convex.mutation(api.tournaments.startTournament, {
      tournamentId: selectedTournament.value as Id<"tournaments">,
      seededPlayers: seededPlayers || undefined
    })
    
    await loadTournaments()
  } catch (error) {
    console.error('Failed to start tournament:', error)
    alert((error as any).message || 'Failed to start tournament')
  }
}

const handleStartMatch = async (payload: { roundIndex: number; matchIndex: number }) => {
  if (!currentTournamentData.value || !selectedTournament.value) return

  try {
    const tournament = currentTournamentData.value
    const round = tournament.rounds[payload.roundIndex]
    const match = round.matches[payload.matchIndex]

    if (!match.player1Id || !match.player2Id) {
      alert('Cannot start match - missing players')
      return
    }

    // Mock mode - just update local state
    if (DEV_MODE.value) {
      console.log('Starting mock match:', match)
      match.status = 'active'
      alert('Match would start now! (Mock mode)')
      return
    }

    // Generate a unique game ID
    const gameId = `tournament_${selectedTournament.value}_${match.matchId}`

    // Update match with game ID
    match.gameId = gameId
    match.status = 'active'

    // Save tournament state
    await $fetch(`/api/tournaments/${selectedTournament.value}`, {
      method: 'POST',
      body: tournament
    })

    // Navigate to tournament game page
    router.push({
      path: '/tournament/game',
      query: {
        gameId: gameId,
        player1: match.player1Id,
        player2: match.player2Id,
        tournament: selectedTournament.value
      }
    })
  } catch (error) {
    console.error('Failed to start match:', error)
    alert('Failed to start match. Please try again.')
  }
}

const handlePlayerReady = async (payload: { roundIndex: number; matchIndex: number; playerId: string }) => {
  if (!currentTournamentData.value || !selectedTournament.value) return

  try {
    const tournament = currentTournamentData.value
    const round = tournament.rounds[payload.roundIndex]
    const match = round.matches[payload.matchIndex]

    // Mark player as ready
    if (match.player1Id === payload.playerId) {
      match.player1Ready = true
    } else if (match.player2Id === payload.playerId) {
      match.player2Ready = true
    }

    // Mock mode - just update local state
    if (DEV_MODE.value) {
      console.log('Player marked as ready (mock mode):', payload.playerId)
      // Force re-render
      currentTournamentData.value = { ...tournament }
      
      // Auto-start if both ready
      if (match.player1Ready && match.player2Ready) {
        setTimeout(() => {
          handleStartMatch(payload)
        }, 1000)
      }
      return
    }

    // Real backend - save to Convex
    await $convex.mutation(api.tournaments.markPlayerReady, {
      tournamentId: selectedTournament.value as Id<"tournaments">,
      roundIndex: payload.roundIndex,
      matchIndex: payload.matchIndex,
      playerId: payload.playerId
    })

    await loadTournaments()
  } catch (error) {
    console.error('Failed to mark player as ready:', error)
    alert('Failed to mark as ready. Please try again.')
  }
}

const handleViewGame = (gameId: string) => {
  if (DEV_MODE.value) {
    alert('Game view would open here (mock mode)')
    return
  }
  router.push(`/game/${gameId}`)
}

const handleWatchPlayer = (playerId: string | undefined) => {
  if (!playerId) {
    alert('No player assigned to this position yet')
    return
  }
  
  if (DEV_MODE.value) {
    alert(`Spectating player: ${playerId}\\n\\nIn live mode, you would see their game perspective.`)
    return
  }
  
  // In real mode, navigate to spectator view or open player's active game
  console.log('Watching player:', playerId)
  // TODO: Implement spectator view routing
  alert('Spectator mode coming soon!')
}

const handleSendInvite = (payload: { playerId: string; playerName: string; tournamentId: string }) => {
  console.log('Sending invite to player:', payload)
  
  if (DEV_MODE.value) {
    // Mock mode - simulate invite notification
    console.log(`Mock invite sent to ${payload.playerName} for tournament ${payload.tournamentId}`)
    
    // Simulate player receiving invite after 2 seconds
    setTimeout(() => {
      pendingInviteData.value = payload
      showAcceptanceModal.value = true
    }, 2000)
    return
  }
  
  // Real backend - send invite via Convex
  // TODO: Implement backend invite system
  alert('Invite system will be connected to backend!')
}

// Handle game completion and automatic bracket advancement
const handleGameComplete = (payload: { 
  roundIndex: number; 
  matchIndex: number; 
  winnerId: string;
  gameId: string;
}) => {
  if (!currentTournamentData.value) return
  
  const tournament = currentTournamentData.value
  const round = tournament.rounds[payload.roundIndex]
  const match = round.matches[payload.matchIndex]
  
  // Add game result to match
  if (!match.games) match.games = []
  match.games.push({ gameId: payload.gameId, winnerId: payload.winnerId })
  
  // Update scores
  if (payload.winnerId === match.player1Id) {
    match.player1Score = (match.player1Score || 0) + 1
  } else if (payload.winnerId === match.player2Id) {
    match.player2Score = (match.player2Score || 0) + 1
  }
  
  // Calculate wins needed based on best-of format
  const winsNeeded = Math.ceil(tournament.bestOf / 2)
  
  // Check if match is complete (someone reached winning score)
  if (match.player1Score >= winsNeeded || match.player2Score >= winsNeeded) {
    const matchWinnerId = match.player1Score >= winsNeeded ? match.player1Id : match.player2Id
    match.status = 'completed'
    match.winnerId = matchWinnerId
    
    console.log(`Match completed! Winner: ${matchWinnerId} (Best of ${tournament.bestOf})`)
    
    // Automatically advance winner to next round
    advanceWinnerToNextRound(tournament, payload.roundIndex, payload.matchIndex, matchWinnerId)
  } else {
    // Match continues - reset for next game
    match.status = 'pending'
    match.player1Ready = false
    match.player2Ready = false
    match.gameId = undefined
    
    console.log(`Match continues: ${match.player1Score}-${match.player2Score} (Best of ${tournament.bestOf})`)
  }
  
  // Force update
  currentTournamentData.value = { ...tournament }
}

// Advance winner to the next round bracket position
const advanceWinnerToNextRound = (tournament: any, roundIndex: number, matchIndex: number, winnerId: string) => {
  const nextRoundIndex = roundIndex + 1
  
  // Create next round if it doesn't exist
  if (!tournament.rounds[nextRoundIndex]) {
    const previousRoundMatchCount = tournament.rounds[roundIndex].matches.length
    const nextRoundMatchCount = Math.floor(previousRoundMatchCount / 2)
    
    if (nextRoundMatchCount === 0) {
      // Tournament complete!
      tournament.status = 'completed'
      tournament.winnerId = winnerId
      console.log('Tournament complete! Winner:', winnerId)
      alert(`🏆 Tournament Complete!\\n\\nWinner: ${getPlayerName(winnerId)}`)
      return
    }
    
    tournament.rounds[nextRoundIndex] = {
      roundNumber: nextRoundIndex + 1,
      status: 'pending',
      matches: Array(nextRoundMatchCount).fill(null).map((_, i) => ({
        matchId: `match-r${nextRoundIndex}-m${i}`,
        player1Id: undefined,
        player2Id: undefined,
        status: 'pending',
        player1Ready: false,
        player2Ready: false,
        games: [],
        player1Score: 0,
        player2Score: 0
      }))
    }
  }
  
  const nextRound = tournament.rounds[nextRoundIndex]
  const nextMatchIndex = Math.floor(matchIndex / 2)
  const nextMatch = nextRound.matches[nextMatchIndex]
  
  // Assign winner to the appropriate position
  if (matchIndex % 2 === 0) {
    nextMatch.player1Id = winnerId
  } else {
    nextMatch.player2Id = winnerId
  }
  
  console.log(`Winner ${winnerId} advanced to Round ${nextRoundIndex + 1}, Match ${nextMatchIndex + 1}`)
  
  // Check if next match is ready to start
  if (nextMatch.player1Id && nextMatch.player2Id) {
    nextMatch.status = 'ready'
    console.log(`Match ${nextMatchIndex + 1} in Round ${nextRoundIndex + 1} is ready!`)
  }
}

const getPlayerName = (playerId: string) => {
  if (!currentTournamentData.value) return 'Unknown'
  const player = currentTournamentData.value.players.find((p: any) => p.userId === playerId)
  return player?.name || playerId
}

const handleAcceptInvite = () => {
  if (!pendingInviteData.value) return
  
  const payload = pendingInviteData.value
  const tournament = mockTournaments.find(t => t._id === payload.tournamentId)
  
  if (tournament) {
    tournament.players.push({
      userId: payload.playerId,
      name: payload.playerName,
      elo: 1500,
      department: 'Invited Player',
      joinedAt: Date.now(),
      status: 'active'
    })
    tournament.currentPlayers++
    
    // Update current tournament data if viewing it
    if (selectedTournament.value === payload.tournamentId) {
      currentTournamentData.value = { ...tournament }
    }
  }
  
  // Close modal
  showAcceptanceModal.value = false
  pendingInviteData.value = null
}

const handleDeclineInvite = () => {
  showAcceptanceModal.value = false
  pendingInviteData.value = null
}

const deleteTournament = async (tournamentId: string) => {
  if (!confirm('Are you sure you want to delete this tournament?')) {
    return
  }

  try {
    // Mock mode - delete from mock data
    if (DEV_MODE.value) {
      console.log('Deleting mock tournament:', tournamentId)
      const index = mockTournaments.findIndex(t => t._id === tournamentId)
      if (index > -1) {
        mockTournaments.splice(index, 1)
        activeTournaments.value = [...mockTournaments]
      }
      
      // If viewing the deleted tournament, go back
      if (selectedTournament.value === tournamentId) {
        selectedTournament.value = null
      }
      return
    }
    
    // Real backend call
    await $convex.mutation(api.tournaments.deleteTournament, {
      tournamentId: tournamentId as Id<"tournaments">,
      userId: currentUserId.value
    })
    
    // If viewing the deleted tournament, go back
    if (selectedTournament.value === tournamentId) {
      selectedTournament.value = null
    }
    
    await loadTournaments()
  } catch (error) {
    console.error('Failed to delete tournament:', error)
    alert('Failed to delete tournament')
  }
}

const getStatusClass = (status: string) => ({
  'status-waiting': status === 'waiting',
  'status-ready': status === 'ready',
  'status-active': status === 'active',
  'status-completed': status === 'completed'
})
</script>

<style scoped>
.battle-royale-page {
  @apply p-6;
}

.page-header {
  @apply text-center mb-12;
}

.title {
  @apply text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#021d94] to-[#ffaa00] bg-clip-text text-transparent mb-4;
}

.subtitle {
  @apply text-xl text-slate-600;
}

.tournaments-container {
  @apply max-w-7xl mx-auto space-y-8;
}

.create-tournament-section {
  @apply mb-8;
}

.create-btn {
  @apply w-full md:w-auto px-8 py-6 rounded-3xl border-2 border-dashed border-white/60 bg-white/70 backdrop-blur-xl shadow-glass hover:border-[#021d94]/50 hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-4 text-slate-900 font-semibold text-lg;
}

.tournaments-list {
  @apply mb-12;
}

.section-title {
  @apply text-2xl font-bold text-slate-900 mb-6;
}

.loading-state, .empty-state {
  @apply text-center py-16 text-slate-600;
}

.spinner {
  @apply w-12 h-12 border-4 border-[#021d94]/30 border-t-[#021d94] rounded-full animate-spin mx-auto mb-4;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.tournaments-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.tournament-card {
  @apply rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-glass p-6 cursor-pointer transition-all duration-300 hover:border-[#021d94]/50 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1;
}

.tournament-info {
  @apply mb-4;
}

.tournament-name {
  @apply text-xl font-bold text-slate-900 mb-3;
}

.tournament-id {
  @apply text-xs text-slate-500 mb-2 font-mono;
}

.tournament-meta {
  @apply flex items-center justify-between gap-3 text-sm;
}

.player-count {
  @apply text-slate-600;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider;
}

.status-waiting {
  @apply bg-yellow-500/20 text-yellow-700;
}

.status-ready {
  @apply bg-green-500/20 text-green-700;
}

.status-active {
  @apply bg-blue-500/20 text-blue-700;
}

.status-completed {
  @apply bg-[#021d94]/20 text-[#021d94];
}

.tournament-actions {
  @apply flex gap-2 mt-4;
}

.join-quick-btn {
  @apply flex-1 px-4 py-2 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white font-semibold hover:shadow-lg hover:shadow-[#021d94]/25 transition-all duration-300;
}

.delete-btn {
  @apply px-4 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-300;
}

.tournament-view {
  @apply max-w-[1800px] mx-auto;
}

.back-btn {
  @apply mb-6 px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl shadow-glass border border-white/60 text-slate-900 font-semibold hover:bg-white/80 transition-all duration-300;
}

.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4;
}

.modal-content {
  @apply bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-glass p-8 max-w-md w-full;
}

.modal-title {
  @apply text-2xl font-bold text-slate-900 mb-6;
}

.create-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.form-group label {
  @apply block text-sm font-semibold text-slate-700;
}

.form-input {
  @apply w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#021d94] focus:ring-2 focus:ring-[#021d94]/50 transition-all duration-300;
}

.modal-actions {
  @apply flex gap-4 mt-8;
}

.cancel-btn, .submit-btn {
  @apply flex-1 px-6 py-3 rounded-full font-semibold transition-all duration-300;
}

.cancel-btn {
  @apply bg-white/70 text-slate-900 border border-white/60 hover:bg-white/80;
}

.submit-btn {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white hover:shadow-lg hover:shadow-[#021d94]/25 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* ======= INVITE ACCEPTANCE MODAL ======= */
.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999];
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.acceptance-modal {
  @apply rounded-3xl shadow-2xl p-12 max-w-lg text-center;
  background: linear-gradient(135deg, #021d94 0%, #4338ca 50%, #6366f1 100%);
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.acceptance-icon {
  @apply text-7xl mb-6;
  animation: bounceIn 0.5s ease-out 0.2s backwards;
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.acceptance-title {
  @apply text-3xl font-bold text-white mb-4;
}

.acceptance-message {
  @apply text-white/95 text-xl mb-3;
}

.acceptance-submessage {
  @apply text-white/75 text-sm mb-8;
}

.acceptance-actions {
  @apply flex gap-4 justify-center;
}

.decline-btn, .accept-btn {
  @apply px-8 py-4 rounded-xl font-bold text-lg transition-all;
}

.decline-btn {
  @apply bg-red-500/90 text-white hover:bg-red-600 hover:shadow-xl;
}

.decline-btn:hover {
  transform: translateY(-2px);
}

.accept-btn {
  @apply bg-green-500 text-white hover:bg-green-600 hover:shadow-xl;
}

.accept-btn:hover {
  transform: translateY(-2px);
}
</style>
