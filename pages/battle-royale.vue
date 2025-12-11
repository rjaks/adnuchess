<template>
  <div class="tournament-shell">
    <section class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Tournament Mode</p>
        <h1 class="hero-title">Create your own tournament in AdNU chess</h1>
        <p class="hero-subtitle">
          Spin up private or campus-wide events, invite teammates, and go live on the dashboard with a managed bracket.
        </p>
        <div class="hero-actions">
          <button
            class="action primary"
            @click="showCreateModal = true"
            :disabled="!canCreateTournament"
            :class="{ 'disabled-btn': !canCreateTournament }"
          >
            <span class="text-xl leading-none">＋</span>
            <span>Create tournament</span>
          </button>
          <button class="action ghost" @click="scrollToLive">
            View live brackets
          </button>
        </div>
        <div class="hero-meta">
          <div class="meta-tile">
            <p class="meta-label">Live</p>
            <p class="meta-value">{{ liveCount }}</p>
            <p class="meta-sub">active tournaments on dashboard</p>
          </div>
          <div class="meta-tile">
            <p class="meta-label">Queued</p>
            <p class="meta-value">{{ queuedCount }}</p>
            <p class="meta-sub">waiting for start</p>
          </div>
          <div class="meta-tile">
            <p class="meta-label">Yours</p>
            <p class="meta-value">{{ myCount }}</p>
            <p class="meta-sub">joined or hosting</p>
          </div>
        </div>
      </div>
      <div class="hero-card">
        <div class="pill">Tournament Manager</div>
        <h3 class="hero-card-title">Build, invite, publish</h3>
        <p class="hero-card-sub">
          Create the bracket, lock teams, and instantly surface it to the live tournaments feed.
        </p>
        <ul class="hero-card-list">
          <li>Invite players with shareable links</li>
          <li>Seed matchups and auto-advance winners</li>
          <li>Bracket updates show live in dashboard</li>
        </ul>
        <button
          class="action secondary w-full"
          @click="showCreateModal = true"
          :disabled="!canCreateTournament"
          :class="{ 'disabled-btn': !canCreateTournament }"
        >
          Launch bracket editor
        </button>
        <p v-if="!user" class="permission-note">Login required to create</p>
        <p v-else-if="!canCreateTournament" class="permission-note">Admin access required</p>
      </div>
    </section>

    <!-- Selection View -->
    <div v-if="!selectedTournament" class="content-grid" ref="liveSectionRef">
      <section class="panel">
        <header class="panel-head">
          <div>
            <p class="eyebrow">Live tournaments</p>
            <h2 class="panel-title">Active & waiting brackets</h2>
            <p class="panel-sub">Join, invite, or open the bracket manager.</p>
          </div>
          <button class="action ghost" @click="showCreateModal = true" :disabled="!canCreateTournament" :class="{ 'disabled-btn': !canCreateTournament }">
            New tournament
          </button>
        </header>

        <div v-if="loadingTournaments" class="loading-state">
          <div class="spinner"></div>
          <p>Loading tournaments...</p>
        </div>
        <div v-else-if="activeTournaments.length === 0" class="empty-state">
          <div class="empty-icon">🏆</div>
          <p class="empty-title">No active tournaments</p>
          <p class="empty-sub">Create one to get started.</p>
        </div>
        <div v-else class="tournaments-grid">
          <div
            v-for="tournament in activeTournaments"
            :key="tournament._id"
            class="tournament-card"
          >
            <div class="card-top" @click="selectTournament(tournament._id)">
              <div class="card-row">
                <h3 class="tournament-name">{{ tournament.name }}</h3>
                <span class="status-badge" :class="getStatusClass(tournament.status)">
                  {{ tournament.status }}
                </span>
              </div>
              <p class="tournament-id">ID: {{ tournament._id }}</p>
              <div class="card-row meta">
                <span class="pill-lite">{{ tournament.currentPlayers }} / {{ tournament.maxPlayers }} players</span>
                <span class="pill-lite">Best of {{ tournament.bestOf || 1 }}</span>
              </div>
            </div>
            <div class="tournament-actions">
              <button @click="selectTournament(tournament._id)" class="action primary w-full">
                Open bracket
              </button>
              <button
                v-if="tournament.createdBy === currentUserId"
                @click.stop="deleteTournament(tournament._id)"
                class="action danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="myTournamentsList.length > 0" class="panel">
        <header class="panel-head">
          <div>
            <p class="eyebrow">Your seats</p>
            <h2 class="panel-title">Joined & hosting</h2>
            <p class="panel-sub">Jump back into brackets you manage or joined.</p>
          </div>
        </header>
        <div class="tournaments-grid">
          <div
            v-for="tournament in myTournamentsList"
            :key="tournament._id"
            class="tournament-card"
          >
            <div class="card-top" @click="selectTournament(tournament._id)">
              <div class="card-row">
                <h3 class="tournament-name">{{ tournament.name }}</h3>
                <span class="status-badge" :class="getStatusClass(tournament.status)">
                  {{ tournament.status }}
                </span>
              </div>
              <p class="tournament-id">ID: {{ tournament._id }}</p>
              <div class="card-row meta">
                <span class="pill-lite">{{ tournament.currentPlayers }} / {{ tournament.maxPlayers }} players</span>
                <span class="pill-lite">Best of {{ tournament.bestOf || 1 }}</span>
              </div>
            </div>
            <div class="tournament-actions">
              <button @click="selectTournament(tournament._id)" class="action primary w-full">
                Manage
              </button>
              <button
                v-if="tournament.createdBy === currentUserId"
                @click.stop="deleteTournament(tournament._id)"
                class="action danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Bracket View -->
    <div v-else class="tournament-view">
      <div class="manager-bar">
        <div>
          <p class="eyebrow">Tournament Manager</p>
          <h2 class="panel-title">{{ currentTournamentData?.name }}</h2>
          <div class="manager-meta">
            <span class="pill-lite">{{ currentTournamentData?.currentPlayers }} / {{ currentTournamentData?.maxPlayers }} players</span>
            <span class="pill-lite">Best of {{ currentTournamentData?.bestOf || 1 }}</span>
            <span class="status-badge" :class="getStatusClass(currentTournamentData?.status || '')">
              {{ currentTournamentData?.status }}
            </span>
          </div>
        </div>
        <div class="manager-actions">
          <button class="action ghost" @click="selectedTournament = null">Back</button>
          <button class="action secondary" @click="handleStartTournament(currentTournamentData?.players)">Generate bracket</button>
        </div>
      </div>
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
        <div class="pill mb-3">Tournament Builder</div>
        <h2 class="modal-title">Create bracket</h2>
        <p class="modal-sub">Name it, set seats, and choose match format. Once saved, it appears on the live dashboard.</p>
        <form @submit.prevent="handleCreateTournament" class="create-form">
          <div class="form-group">
            <label for="tournament-name">Tournament Name</label>
            <input
              id="tournament-name"
              v-model="newTournament.name"
              type="text"
              placeholder="AdNU Clash – Weeknight"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-row">
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
                <option :value="1">Best of 1</option>
                <option :value="3">Best of 3</option>
                <option :value="5">Best of 5</option>
                <option :value="7">Best of 7</option>
              </select>
              <p class="hint">Winners auto-advance</p>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="action ghost">
              Cancel
            </button>
            <button type="submit" class="action primary" :disabled="creatingTournament" :class="{ 'disabled-btn': creatingTournament }">
              {{ creatingTournament ? 'Creating...' : 'Create tournament' }}
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
import { useNuxtApp } from '#app'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import TournamentBracket from '~/components/TournamentBracket.vue'

const router = useRouter()
const { user } = useAuth()
const { $convex } = useNuxtApp()

// Any authenticated player can create a tournament
const canCreateTournament = computed(() => Boolean(user.value))

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

const liveSectionRef = ref<HTMLElement | null>(null)
const scrollToLive = () => {
  liveSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const liveCount = computed(() => activeTournaments.value.filter((t) => t.status === 'active').length)
const queuedCount = computed(() =>
  activeTournaments.value.filter((t) => t.status === 'waiting' || t.status === 'ready').length,
)
const myCount = computed(() => myTournamentsList.value.length)

const currentUserId = computed(() => user.value?.id || '')

const loadTournaments = async () => {
  try {
    const tournaments = await $convex.query(api.tournaments.listActiveTournaments, {})
    const normalized = (tournaments || []).map((t: any) => ({
      ...t,
      bestOf: t.bestOf || 1,
      players: t.players || [],
      rounds: t.rounds || [],
    }))

    activeTournaments.value = normalized.filter((t: any) => t.status !== 'completed')

    if (currentUserId.value) {
      myTournamentsList.value = activeTournaments.value.filter((t: any) =>
        t.players.some((p: any) => p.userId === currentUserId.value),
      )
    } else {
      myTournamentsList.value = []
    }

    // Update current tournament data if viewing one
    if (selectedTournament.value) {
      const current = activeTournaments.value.find((t: any) => t._id === selectedTournament.value)
      if (current) {
        currentTournamentData.value = current
      } else {
        selectedTournament.value = null
        currentTournamentData.value = null
      }
    }

    loadingTournaments.value = false
  } catch (error) {
    console.error('Failed to load tournaments:', error)
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
  if (!newTournament.value.name.trim()) {
    alert('Please enter a tournament name')
    return
  }

  creatingTournament.value = true
  
  try {
    if (!user.value || !currentUserId.value) {
      alert('Please sign in to create a tournament. You must be logged in.')
      creatingTournament.value = false
      return
    }

    const tournamentId = await $convex.mutation(api.tournaments.createTournament, {
      name: newTournament.value.name,
      maxPlayers: newTournament.value.maxPlayers,
      bestOf: newTournament.value.bestOf,
      createdBy: currentUserId.value,
    })

    showCreateModal.value = false
    newTournament.value = { name: '', maxPlayers: 8, bestOf: 1 }
    
    await loadTournaments()
    
    selectTournament(tournamentId)
  } catch (error) {
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
  router.push(`/game/${gameId}`)
}

const handleWatchPlayer = (playerId: string | undefined) => {
  if (!playerId) {
    alert('No player assigned to this position yet')
    return
  }

  // In real mode, navigate to spectator view or open player's active game
  console.log('Watching player:', playerId)
  // TODO: Implement spectator view routing
  alert('Spectator mode coming soon!')
}

const handleSendInvite = (payload: { playerId: string; playerName: string; tournamentId: string }) => {
  console.log('Sending invite to player:', payload)
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
.tournament-shell {
  @apply max-w-6xl md:max-w-7xl mx-auto px-4 pb-12 pt-6 space-y-8;
}

.hero-grid {
  @apply grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-[1.25fr,0.75fr];
}

.hero-copy {
  @apply rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-glass p-6 md:p-8 space-y-5;
}

.hero-card {
  @apply rounded-3xl border border-white/60 bg-gradient-to-br from-[#021d94]/90 via-[#021d94] to-[#1d2bb8] text-white shadow-2xl shadow-[#021d94]/30 p-6 md:p-8 space-y-4;
}

.eyebrow {
  @apply text-[11px] font-semibold uppercase tracking-[0.25em] text-[#021d94]/80;
}

.hero-card .eyebrow {
  @apply text-white/70;
}

.hero-title {
  @apply text-4xl md:text-5xl font-bold text-slate-900 leading-tight;
}

.hero-subtitle {
  @apply text-base md:text-lg text-slate-600 max-w-2xl;
}

.hero-actions {
  @apply flex flex-wrap items-center gap-3;
}

.hero-meta {
  @apply grid grid-cols-3 gap-4 pt-2;
}

.meta-tile {
  @apply rounded-2xl border border-white/60 bg-white/80 backdrop-blur p-4 shadow-sm text-slate-800;
}

.meta-label {
  @apply text-xs uppercase tracking-[0.18em] text-slate-500 mb-1;
}

.meta-value {
  @apply text-3xl font-bold text-[#021d94] leading-none;
}

.meta-sub {
  @apply text-xs text-slate-500 mt-1;
}

.hero-card-title {
  @apply text-2xl md:text-3xl font-bold;
}

.hero-card-sub {
  @apply text-sm md:text-base text-white/80;
}

.hero-card-list {
  @apply space-y-2 text-sm md:text-base text-white/90 list-disc list-inside;
}

.pill {
  @apply inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white;
}

.pill-lite {
  @apply inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700;
}

.permission-note {
  @apply text-xs text-white/80;
}

.content-grid {
  @apply space-y-8;
}

.panel {
  @apply rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-glass p-6 md:p-8;
}

.panel-head {
  @apply flex flex-wrap items-center justify-between gap-4 mb-6;
}

.panel-title {
  @apply text-2xl font-bold text-slate-900;
}

.panel-sub {
  @apply text-sm text-slate-600;
}

.panel .eyebrow {
  @apply text-slate-500;
}

.loading-state,
.empty-state {
  @apply text-center py-14 text-slate-600;
}

.spinner {
  @apply w-12 h-12 border-4 border-[#021d94]/30 border-t-[#021d94] rounded-full animate-spin mx-auto mb-4;
}

.empty-icon {
  @apply text-5xl mb-3;
}

.empty-title {
  @apply text-xl font-semibold text-slate-800;
}

.empty-sub {
  @apply text-sm text-slate-500;
}

.tournaments-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5;
}

.tournament-card {
  @apply rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-glass p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#021d94]/50;
}

.card-top {
  @apply space-y-2 cursor-pointer;
}

.card-row {
  @apply flex items-center justify-between gap-3;
}

.card-row.meta {
  @apply flex-wrap gap-2;
}

.tournament-name {
  @apply text-xl font-semibold text-slate-900;
}

.tournament-id {
  @apply text-xs font-mono text-slate-500;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em];
}

.status-waiting {
  @apply bg-yellow-100 text-yellow-700;
}

.status-ready {
  @apply bg-green-100 text-green-700;
}

.status-active {
  @apply bg-blue-100 text-blue-700;
}

.status-completed {
  @apply bg-slate-900 text-white;
}

.tournament-actions {
  @apply flex items-center gap-2;
}

.manager-bar {
  @apply flex flex-wrap items-center justify-between gap-4 mb-6 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-glass p-5;
}

.manager-meta {
  @apply flex flex-wrap items-center gap-2 mt-2;
}

.manager-actions {
  @apply flex items-center gap-2;
}

.action {
  @apply inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold transition-all duration-200;
}

.action.primary {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white shadow-sm hover:shadow-lg hover:shadow-[#021d94]/25;
}

.action.secondary {
  @apply bg-white/80 border border-white/60 text-[#021d94] hover:bg-white;
}

.action.ghost {
  @apply border border-white/60 bg-white/70 text-slate-800 hover:border-[#021d94]/40;
}

.action.danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.disabled-btn {
  @apply opacity-60 cursor-not-allowed;
}

.tournament-view {
  @apply max-w-[1800px] mx-auto space-y-4;
}

.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  @apply bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-8 max-w-2xl w-full space-y-4;
}

.modal-title {
  @apply text-3xl font-bold text-slate-900;
}

.modal-sub {
  @apply text-sm text-slate-600;
}

.create-form {
  @apply space-y-6 pt-2;
}

.form-group {
  @apply space-y-2;
}

.form-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group label {
  @apply block text-sm font-semibold text-slate-700;
}

.form-input {
  @apply w-full px-4 py-3 rounded-2xl bg-white/70 border border-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#021d94] focus:ring-2 focus:ring-[#021d94]/40 transition-all duration-300;
}

.hint {
  @apply text-xs text-slate-500 mt-1;
}

.modal-actions {
  @apply flex flex-wrap items-center justify-end gap-3 pt-2;
}

/* Invite acceptance modal */
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
