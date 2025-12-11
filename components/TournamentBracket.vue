<template>
  <div class="tournament-bracket-container">
    <div class="bracket-header">
      <h2 class="text-2xl font-bold text-slate-900">{{ tournament.name }}</h2>
      <div class="tournament-status">
        <span class="status-badge" :class="statusClass">
          {{ statusText }}
        </span>
        <span class="player-count">
          {{ tournament.currentPlayers }} / {{ tournament.maxPlayers }} Players
        </span>
        <span v-if="tournament.bestOf > 1" class="best-of-badge">
          Best of {{ tournament.bestOf }}
        </span>
      </div>
    </div>

    <!-- Bracket Visualization -->
    <div v-if="tournament.status === 'active' || tournament.status === 'completed'" class="bracket-main">
      <!-- Classic Tournament Bracket Tree -->
      <div class="bracket-tree">
        <div class="bracket-rounds">
          <div 
            v-for="(round, roundIndex) in rounds" 
            :key="roundIndex"
            class="bracket-round"
            :style="{ flex: 1 }"
          >
            <div class="round-header">
              <h3 class="round-title">{{ getRoundName(roundIndex, rounds.length) }}</h3>
            </div>

            <div class="round-matches" :style="{ gap: getMatchGap(roundIndex) }">
              <div 
                v-for="(match, matchIndex) in round.matches" 
                :key="matchIndex"
                class="bracket-match"
              >
                <!-- Match Bracket Box -->
                <div class="match-box" :class="matchStatusClass(match)">
                  <div 
                    class="match-participant" 
                    :class="{ 'winner': match.winnerId === match.player1Id }"
                  >
                    <span class="participant-name">{{ getPlayerName(match.player1Id) }}</span>
                    <span v-if="tournament.bestOf > 1" class="series-score">{{ match.player1Score || 0 }}</span>
                    <span v-if="match.winnerId === match.player1Id" class="winner-mark">✓</span>
                  </div>
                  <div class="match-divider"></div>
                  <div 
                    class="match-participant"
                    :class="{ 'winner': match.winnerId === match.player2Id }"
                  >
                    <span v-if="match.player2Id" class="participant-name">{{ getPlayerName(match.player2Id) }}</span>
                    <span v-else class="participant-name text-slate-500">BYE</span>
                    <span v-if="tournament.bestOf > 1 && match.player2Id" class="series-score">{{ match.player2Score || 0 }}</span>
                    <span v-if="match.winnerId === match.player2Id" class="winner-mark">✓</span>
                  </div>
                </div>

                <!-- Connector to next round -->
                <svg v-if="roundIndex < rounds.length - 1" class="bracket-connector" :class="`connector-${matchIndex % 2}`" width="64" height="128" viewBox="0 0 64 128">
                  <line x1="0" y1="64" x2="32" y2="64" class="connector-line"></line>
                  <line v-if="matchIndex % 2 === 0" x1="32" y1="64" x2="32" y2="128" class="connector-line"></line>
                  <line v-if="matchIndex % 2 === 1" x1="32" y1="0" x2="32" y2="64" class="connector-line"></line>
                  <line v-if="matchIndex % 2 === 0" x1="32" y1="128" x2="64" y2="128" class="connector-line"></line>
                  <line v-if="matchIndex % 2 === 1" x1="32" y1="0" x2="64" y2="0" class="connector-line"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Match Controls Below Bracket -->
      <div class="match-controls">
        <h3 class="text-lg font-semibold mb-4" style="color: #021d94;">Match Actions</h3>
        <div class="controls-grid">
          <div 
            v-for="(round, roundIndex) in rounds" 
            :key="`controls-${roundIndex}`"
          >
            <div 
              v-for="(match, matchIndex) in round.matches" 
              :key="`control-${matchIndex}`"
              class="match-control-card"
            >
              <div class="match-control-header">
                <span class="font-semibold">{{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}</span>
              </div>

              <!-- Match Actions -->
              <div v-if="match.status === 'pending'" class="match-actions">
                <div v-if="isPlayerInMatch(match)" class="ready-section">
                  <button
                    v-if="!isPlayerReady(match)"
                    @click="$emit('player-ready', { roundIndex, matchIndex, playerId: currentUserId })"
                    class="ready-btn"
                  >
                    ✓ I'm Ready
                  </button>
                  <span v-else class="ready-status">✓ Ready!</span>
                </div>
                
                <button
                  v-if="(isCreator || areBothPlayersReady(match)) && canStartMatch(match)"
                  @click="$emit('start-match', { roundIndex, matchIndex })"
                  class="start-match-btn"
                >
                  Start Game
                </button>
              </div>
              
              <div v-if="match.status === 'active' && match.gameId">
                <button
                  v-if="isPlayerInMatch(match)"
                  @click="$emit('view-game', match.gameId)"
                  class="view-game-btn player-btn"
                >
                  ⚔️ Continue
                </button>
                <button
                  v-else
                  @click="$emit('view-game', match.gameId)"
                  class="view-game-btn spectator-btn"
                >
                  👁️ Watch
                </button>
                
                <!-- Simulate Game Completion (Dev Mode) -->
                <div class="simulate-controls">
                  <p class="text-xs text-slate-600 mt-2 mb-1">Simulate Winner:</p>
                  <div class="flex gap-2">
                    <button
                      @click="simulateGameWin(roundIndex, matchIndex, match.player1Id, match.gameId)"
                      class="simulate-btn"
                    >
                      {{ getPlayerName(match.player1Id) }} Wins
                    </button>
                    <button
                      @click="simulateGameWin(roundIndex, matchIndex, match.player2Id, match.gameId)"
                      class="simulate-btn"
                    >
                      {{ getPlayerName(match.player2Id) }} Wins
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bracket Seeding (Creator Only) -->
    <!-- <BracketSeeding
      v-if="showSeeding && isCreator"
      :players="tournament.players"
      :max-players="tournament.maxPlayers"
      @start-tournament="handleSeedingConfirm"
      @cancel="showSeeding = false"
    /> -->

    <!-- Waiting Lobby - Bracket Setup -->
    <div v-else-if="!tournament.rounds || tournament.rounds.length === 0" class="lobby-setup-container">
      <!-- Visual Bracket Tree (Creator can drag players here) -->
      <div v-if="tournament.currentPlayers >= 2" class="bracket-tree-large">
        <h3 class="bracket-title">Tournament Bracket Setup</h3>
        <p v-if="isCreator" class="bracket-subtitle">Drag players from below into the bracket positions</p>
        
        <!-- Full Tournament Bracket Visualization -->
        <div class="tournament-bracket">
          <!-- Round 1 (First Round) -->
          <div class="bracket-column round-1">
            <div class="round-label">Round 1</div>
            <div 
              v-for="matchNum in Math.floor(tournament.maxPlayers / 2)" 
              :key="`r1-m${matchNum}`"
              class="bracket-matchup"
            >
              <div 
                class="bracket-seed"
                @dragover.prevent
                @drop="handleDropPlayer($event, (matchNum - 1) * 2)"
                @click="isCreator && openPlayerSelector((matchNum - 1) * 2)"
                :class="{ 'clickable-seed': isCreator }"
              >
                <span class="seed-number">{{ (matchNum - 1) * 2 + 1 }}</span>
                <div class="seed-content" :class="{ 'has-player': bracketSlots[(matchNum - 1) * 2] }">
                  <span v-if="bracketSlots[(matchNum - 1) * 2]" class="player-name-display">
                    {{ bracketSlots[(matchNum - 1) * 2].name }}
                  </span>
                  <span v-if="bracketSlots[(matchNum - 1) * 2]" class="player-dept-display">
                    {{ bracketSlots[(matchNum - 1) * 2].department || 'No Department' }}
                  </span>
                  <span v-else class="empty-text">{{ isCreator ? 'Click to assign' : 'TBD' }}</span>
                </div>
                
                <!-- Player Selector Dropdown -->
                <div v-if="selectedSlotIndex === (matchNum - 1) * 2" class="player-dropdown" @click.stop>
                  <div class="dropdown-header">
                    <span>Select Player</span>
                    <button @click="closePlayerSelector" class="close-dropdown">✕</button>
                  </div>
                  <div class="dropdown-options">
                    <button
                      v-for="player in availablePlayers"
                      :key="player.userId"
                      @click="assignPlayerToSlot(player, (matchNum - 1) * 2)"
                      class="dropdown-option"
                      :disabled="isPlayerAssigned(player.userId)"
                    >
                      <span class="option-name">{{ player.name }}</span>
                      <span class="option-dept">{{ player.department || 'No Dept' }}</span>
                      <span v-if="isPlayerAssigned(player.userId)" class="option-assigned">✓</span>
                    </button>
                  </div>
                </div>
              </div>
              <div 
                class="bracket-seed"
                @dragover.prevent
                @drop="handleDropPlayer($event, (matchNum - 1) * 2 + 1)"
                @click="isCreator && openPlayerSelector((matchNum - 1) * 2 + 1)"
                :class="{ 'clickable-seed': isCreator }"
              >
                <span class="seed-number">{{ (matchNum - 1) * 2 + 2 }}</span>
                <div class="seed-content" :class="{ 'has-player': bracketSlots[(matchNum - 1) * 2 + 1] }">
                  <span v-if="bracketSlots[(matchNum - 1) * 2 + 1]" class="player-name-display">
                    {{ bracketSlots[(matchNum - 1) * 2 + 1].name }}
                  </span>
                  <span v-if="bracketSlots[(matchNum - 1) * 2 + 1]" class="player-dept-display">
                    {{ bracketSlots[(matchNum - 1) * 2 + 1].department || 'No Department' }}
                  </span>
                  <span v-else class="empty-text">{{ isCreator ? 'Click to assign' : 'TBD' }}</span>
                </div>
                
                <!-- Player Selector Dropdown -->
                <div v-if="selectedSlotIndex === (matchNum - 1) * 2 + 1" class="player-dropdown" @click.stop>
                  <div class="dropdown-header">
                    <span>Select Player</span>
                    <button @click="closePlayerSelector" class="close-dropdown">✕</button>
                  </div>
                  <div class="dropdown-options">
                    <button
                      v-for="player in availablePlayers"
                      :key="player.userId"
                      @click="assignPlayerToSlot(player, (matchNum - 1) * 2 + 1)"
                      class="dropdown-option"
                      :disabled="isPlayerAssigned(player.userId)"
                    >
                      <span class="option-name">{{ player.name }}</span>
                      <span class="option-dept">{{ player.department || 'No Dept' }}</span>
                      <span v-if="isPlayerAssigned(player.userId)" class="option-assigned">✓</span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="connector-lines">
                <div class="line-h"></div>
                <div class="line-v"></div>
                <div class="line-h-end"></div>
              </div>
            </div>
          </div>

          <!-- Round 2 (Quarterfinals for 16 players, Semifinals for 8) -->
          <div class="bracket-column round-2" v-if="tournament.maxPlayers >= 4">
            <div class="round-label">{{ getRoundTwoLabel }}</div>
            <div 
              v-for="matchNum in Math.floor(tournament.maxPlayers / 4)" 
              :key="`r2-m${matchNum}`"
              class="bracket-matchup"
              :class="{ 'quarterfinal': tournament.maxPlayers === 16, 'semifinal': tournament.maxPlayers === 8 }"
            >
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">W{{ (matchNum - 1) * 2 + 1 }}</span>
                </div>
              </div>
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">W{{ (matchNum - 1) * 2 + 2 }}</span>
                </div>
              </div>
              <div class="connector-lines" v-if="tournament.maxPlayers > 4">
                <div class="line-h"></div>
                <div class="line-v"></div>
                <div class="line-h-end"></div>
              </div>
            </div>
          </div>

          <!-- Round 3 (Semifinals for 16 players, Finals for 8 players) -->
          <div class="bracket-column round-3" v-if="tournament.maxPlayers >= 8">
            <div class="round-label">{{ getRoundThreeLabel }}</div>
            <div 
              v-for="matchNum in Math.floor(tournament.maxPlayers / 8)" 
              :key="`r3-m${matchNum}`"
              class="bracket-matchup"
              :class="{ 'semifinal': tournament.maxPlayers === 16, 'final': tournament.maxPlayers === 8 }"
            >
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">{{ tournament.maxPlayers === 16 ? 'QF W1' : 'SF W1' }}</span>
                </div>
              </div>
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">{{ tournament.maxPlayers === 16 ? 'QF W2' : 'SF W2' }}</span>
                </div>
              </div>
              <div class="connector-lines" v-if="tournament.maxPlayers > 8">
                <div class="line-h"></div>
                <div class="line-v"></div>
                <div class="line-h-end"></div>
              </div>
            </div>
          </div>

          <!-- Round 4 (Finals for 16 players only) -->
          <div class="bracket-column round-4" v-if="tournament.maxPlayers >= 16">
            <div class="round-label">Finals</div>
            <div class="bracket-matchup final">
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">SF W1</span>
                </div>
              </div>
              <div class="bracket-seed result-seed">
                <div class="seed-content">
                  <span class="empty-text text-xs">SF W2</span>
                </div>
              </div>
              <div class="connector-lines champion-line">
                <div class="line-h"></div>
                <div class="line-v"></div>
                <div class="line-h-end"></div>
              </div>
            </div>
          </div>

          <!-- Champion -->
          <div class="bracket-column champion-column" v-if="tournament.maxPlayers >= 4">
            <div class="round-label">Champion</div>
            <div class="champion-box">
              <div class="champion-trophy">🏆</div>
              <div class="champion-text">Winner</div>
            </div>
          </div>
        </div>

        <!-- Spectator Watch Buttons (for non-creators) -->
        <div v-if="!isCreator && tournament.currentPlayers >= tournament.maxPlayers" class="spectator-actions">
          <p class="text-sm text-slate-600 text-center mb-3">👀 Spectator Mode - Watch players compete!</p>
          <div class="watch-buttons-grid">
            <button 
              v-for="n in tournament.maxPlayers"
              :key="`watch-${n}`"
              @click="$emit('watch-player', bracketSlots[n - 1]?.userId)"
              :disabled="!bracketSlots[n - 1]"
              class="watch-player-btn"
              :class="{ 'opacity-50 cursor-not-allowed': !bracketSlots[n - 1] }"
            >
              <span class="watch-seed-num">{{ n }}</span>
              <span class="watch-player-name">{{ bracketSlots[n - 1]?.name || 'Empty' }}</span>
              <span v-if="bracketSlots[n - 1]" class="watch-icon">👁️</span>
            </button>
          </div>
        </div>

        <div v-if="isCreator" class="bracket-setup-actions">
          <button @click="autoSeedBracket" class="setup-btn secondary">
            🎲 Auto-Seed by ELO
          </button>
          <button @click="randomSeedBracket" class="setup-btn secondary">
            🔀 Random Seed
          </button>
          <button 
            @click="confirmBracketSeeding" 
            :disabled="!allPlayersAssigned"
            class="setup-btn primary"
            :class="{ 'opacity-50 cursor-not-allowed': !allPlayersAssigned }"
          >
            Start Tournament →
          </button>
        </div>
      </div>

      <!-- Players Pool -->
      <div class="players-pool-large">
        <div class="pool-header">
          <h3 class="pool-title">Available Players</h3>
          <button 
            v-if="isCreator && tournament.currentPlayers < tournament.maxPlayers"
            @click="showInviteModal = true"
            class="invite-players-btn"
          >
            ✉️ Invite Players
          </button>
        </div>
        <div class="players-grid-large">
          <div 
            v-for="player in tournament.players" 
            :key="player.userId"
            class="player-tile-large"
            :draggable="isCreator"
            @dragstart="handleDragStart($event, player)"
            @dragend="handleDragEnd"
            :class="{ 
              'draggable': isCreator, 
              'assigned': isPlayerAssigned(player.userId),
              'drag-active': draggedPlayer?.userId === player.userId
            }"
          >
            <div class="player-content-large">
              <span class="player-avatar-large">♟️</span>
              <div class="player-details-large">
                <span class="player-name-large">{{ player.name }}</span>
                <span class="player-elo-large">{{ player.department || 'No Department' }}</span>
              </div>
            </div>
            <span v-if="isPlayerAssigned(player.userId)" class="assigned-indicator-large">✓</span>
          </div>
          
          <!-- Empty Slots -->
          <div 
            v-for="n in (tournament.maxPlayers - tournament.currentPlayers)" 
            :key="`empty-${n}`"
            class="player-tile-large empty-slot"
          >
            <span class="text-slate-400">Waiting for player...</span>
          </div>
        </div>
      </div>

      <div class="lobby-footer-actions">
        <button
          v-if="!isPlayerJoined && !isCreator"
          @click="$emit('join-tournament')"
          class="lobby-btn join"
          :disabled="tournament.currentPlayers >= tournament.maxPlayers"
        >
          Join Tournament
        </button>
        <button
          v-else-if="!isCreator"
          @click="$emit('leave-tournament')"
          class="lobby-btn leave"
        >
          Leave Tournament
        </button>
        <div v-if="isCreator" class="creator-info">
          <span class="text-sm text-slate-600">👑 You are the tournament creator</span>
        </div>
      </div>
    </div>

    <!-- Invite Players Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Invite Players to Tournament</h3>
          <button @click="showInviteModal = false" class="modal-close">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Search/Filter Players -->
          <div class="search-section">
            <input 
              v-model="playerSearchQuery"
              type="text"
              placeholder="Search players by name..."
              class="search-input"
            />
          </div>

          <!-- Available Players to Invite -->
          <div class="invitable-players-list">
            <div 
              v-for="player in filteredInvitablePlayers" 
              :key="player.userId"
              class="invitable-player-item"
            >
              <div class="player-info-invite">
                <span class="player-icon">♟️</span>
                <div class="player-details-invite">
                  <span class="player-name-invite">{{ player.name }}</span>
                  <span class="player-dept-invite">{{ player.department || 'No Department' }}</span>
                </div>
              </div>
              <button 
                @click="sendInviteRequest(player)"
                :disabled="isInvitePending(player.userId)"
                class="invite-btn"
              >
                {{ isInvitePending(player.userId) ? '⏳ Pending' : '✉️ Invite' }}
              </button>
            </div>
            <div v-if="filteredInvitablePlayers.length === 0" class="no-players">
              <p class="text-slate-500">No available players to invite</p>
            </div>
          </div>

          <!-- Pending Invites -->
          <div v-if="pendingInvites.length > 0" class="pending-invites-section">
            <h4 class="section-subtitle">Pending Invites</h4>
            <div class="pending-invites-list">
              <div 
                v-for="invite in pendingInvites" 
                :key="invite.userId"
                class="pending-invite-item"
              >
                <span class="pending-player-name">{{ invite.playerName }}</span>
                <span class="pending-status">⏳ Waiting for response...</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showInviteModal = false" class="modal-btn-close">Close</button>
        </div>
      </div>
    </div>

    <!-- Invite Sent Success Modal -->
    <div v-if="showInviteSentModal" class="modal-overlay" @click="showInviteSentModal = false">
      <div class="success-modal-container" @click.stop>
        <div class="success-icon">✉️</div>
        <h3 class="success-title">Invite Sent!</h3>
        <p class="success-message">
          <strong>{{ invitedPlayerName }}</strong> has been invited to the tournament.
        </p>
        <p class="success-submessage">
          They will receive a notification and can accept to join.
        </p>
        <button @click="showInviteSentModal = false" class="success-btn">Got it!</button>
      </div>
    </div>

    <!-- Winner Announcement -->
    <div v-if="tournament.status === 'completed' && tournament.winnerId" class="winner-announcement">
      <div class="trophy-icon">🏆</div>
      <h2 class="text-3xl font-bold text-[#ffaa00]">Tournament Winner!</h2>
      <p class="text-2xl text-slate-900 mt-2">{{ getPlayerName(tournament.winnerId) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
// import BracketSeeding from './BracketSeeding.vue'

interface Player {
  userId: string
  name: string
  elo: number
  department?: string
  joinedAt: number
  status: 'active' | 'eliminated' | 'winner'
  position?: number
}

interface Match {
  matchId: string
  player1Id: string
  player2Id?: string
  gameId?: string
  winnerId?: string
  status: 'pending' | 'active' | 'completed'
  player1Ready?: boolean
  player2Ready?: boolean
}

interface Round {
  roundNumber: number
  matches: Match[]
  status: 'pending' | 'active' | 'completed'
}

interface Tournament {
  _id: string
  name: string
  status: 'waiting' | 'ready' | 'active' | 'completed'
  maxPlayers: number
  bestOf?: number
  currentPlayers: number
  players: Player[]
  rounds: Round[]
  currentRound: number
  winnerId?: string
  createdBy: string
  createdAt: number
}

const props = defineProps<{
  tournament: Tournament
  currentUserId: string
}>()

const emit = defineEmits<{
  (e: 'join-tournament'): void
  (e: 'leave-tournament'): void
  (e: 'start-tournament', seededPlayers?: Player[]): void
  (e: 'start-match', payload: { roundIndex: number; matchIndex: number }): void
  (e: 'view-game', gameId: string): void
  (e: 'player-ready', payload: { roundIndex: number; matchIndex: number; playerId: string }): void
  (e: 'watch-player', playerId: string | undefined): void
  (e: 'send-invite', payload: { playerId: string; playerName: string; tournamentId: string }): void
  (e: 'game-complete', payload: { roundIndex: number; matchIndex: number; winnerId: string; gameId: string }): void
}>()

const showSeeding = ref(false)
const bracketSlots = ref<(Player | null)[]>([])
const draggedPlayer = ref<Player | null>(null)
const selectedSlotIndex = ref<number | null>(null)
const showInviteModal = ref(false)
const playerSearchQuery = ref('')
const pendingInvites = ref<{ userId: string; playerName: string; sentAt: number }[]>([])

const availablePlayers = computed(() => props.tournament.players)

const invitablePlayers = computed(() => [])

const filteredInvitablePlayers = computed(() => [])

const isInvitePending = (userId: string) => {
  return pendingInvites.value.some(i => i.userId === userId)
}

const showInviteSentModal = ref(false)
const invitedPlayerName = ref('')

const sendInviteRequest = (player: any) => {
  // Add to pending invites
  pendingInvites.value.push({
    userId: player.userId,
    playerName: player.name,
    sentAt: Date.now()
  })
  
  // Emit event to backend
  emit('send-invite', { 
    playerId: player.userId, 
    playerName: player.name,
    tournamentId: props.tournament._id 
  })
  
  // Show success modal
  invitedPlayerName.value = player.name
  showInviteSentModal.value = true
}

const openPlayerSelector = (slotIndex: number) => {
  if (!isCreator.value) return
  selectedSlotIndex.value = slotIndex
}

const closePlayerSelector = () => {
  selectedSlotIndex.value = null
}

const assignPlayerToSlot = (player: Player, slotIndex: number) => {
  // Remove player from other slots if already assigned
  const existingIndex = bracketSlots.value.findIndex(p => p?.userId === player.userId)
  if (existingIndex !== -1) {
    bracketSlots.value[existingIndex] = null
  }
  
  // Assign to new slot
  bracketSlots.value[slotIndex] = player
  closePlayerSelector()
}

// Initialize bracket slots
watch(() => props.tournament.maxPlayers, (maxPlayers) => {
  bracketSlots.value = Array(maxPlayers).fill(null)
}, { immediate: true })

watch(
  () => props.tournament.players,
  (players) => {
    const slots = Array(props.tournament.maxPlayers).fill(null)
    players.forEach((player, index) => {
      if (index < slots.length) {
        slots[index] = player
      }
    })
    bracketSlots.value = slots
  },
  { immediate: true, deep: true },
)

const handleSeedingConfirm = (seededPlayers: Player[]) => {
  showSeeding.value = false
  emit('start-tournament', seededPlayers)
}

const handleDragStart = (event: DragEvent, player: Player) => {
  draggedPlayer.value = player
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  draggedPlayer.value = null
}

const handleDropPlayer = (event: DragEvent, slotIndex: number) => {
  event.preventDefault()
  if (draggedPlayer.value) {
    // Remove player from other slots if already assigned
    const existingIndex = bracketSlots.value.findIndex(p => p?.userId === draggedPlayer.value?.userId)
    if (existingIndex !== -1) {
      bracketSlots.value[existingIndex] = null
    }
    
    // Assign to new slot
    bracketSlots.value[slotIndex] = draggedPlayer.value
    draggedPlayer.value = null
  }
}

const isPlayerAssigned = (userId: string) => {
  return bracketSlots.value.some(p => p?.userId === userId)
}

const allPlayersAssigned = computed(() => {
  const assignedCount = bracketSlots.value.filter(p => p !== null).length
  return assignedCount === props.tournament.currentPlayers
})

const autoSeedBracket = () => {
  const sortedPlayers = [...props.tournament.players].sort((a, b) => b.elo - a.elo)
  bracketSlots.value = Array(props.tournament.maxPlayers).fill(null)
  sortedPlayers.forEach((player, index) => {
    bracketSlots.value[index] = player
  })
}

const randomSeedBracket = () => {
  const shuffled = [...props.tournament.players].sort(() => Math.random() - 0.5)
  bracketSlots.value = Array(props.tournament.maxPlayers).fill(null)
  shuffled.forEach((player, index) => {
    bracketSlots.value[index] = player
  })
}

const confirmBracketSeeding = () => {
  const seededPlayers = bracketSlots.value.filter(p => p !== null) as Player[]
  emit('start-tournament', seededPlayers)
}

const rounds = computed(() => props.tournament.rounds || [])

const isPlayerJoined = computed(() => 
  props.tournament.players.some(p => p.userId === props.currentUserId)
)

const isCreator = computed(() => 
  props.tournament.createdBy === props.currentUserId
)

const statusClass = computed(() => ({
  'status-waiting': props.tournament.status === 'waiting',
  'status-ready': props.tournament.status === 'ready',
  'status-active': props.tournament.status === 'active',
  'status-completed': props.tournament.status === 'completed',
}))

const statusText = computed(() => {
  const statuses = {
    waiting: 'Waiting for Players',
    ready: 'Ready to Start',
    active: `Round ${props.tournament.currentRound}`,
    completed: 'Completed'
  }
  return statuses[props.tournament.status]
})

const getPlayerName = (userId: string) => {
  const player = props.tournament.players.find(p => p.userId === userId)
  return player?.name || 'Unknown'
}

// Simulate game completion for testing automatic advancement
const simulateGameWin = (roundIndex: number, matchIndex: number, winnerId: string, gameId: string) => {
  emit('game-complete', { roundIndex, matchIndex, winnerId, gameId })
}

const getRoundName = (index: number, totalRounds: number) => {
  if (index === totalRounds - 1) return 'FINAL'
  if (index === totalRounds - 2) return 'SEMIFINAL'
  return `Round ${index + 1}`
}

const getRoundTwoLabel = computed(() => {
  if (props.tournament.maxPlayers === 4) return 'Finals'
  if (props.tournament.maxPlayers === 8) return 'Semifinals'
  if (props.tournament.maxPlayers === 16) return 'Quarterfinals'
  return 'Round 2'
})

const getRoundThreeLabel = computed(() => {
  if (props.tournament.maxPlayers === 8) return 'Finals'
  if (props.tournament.maxPlayers === 16) return 'Semifinals'
  return 'Round 3'
})

const matchStatusClass = (match: Match) => ({
  'match-pending': match.status === 'pending',
  'match-active': match.status === 'active',
  'match-completed': match.status === 'completed',
})

const canStartMatch = (match: Match) => {
  return match.player1Id && match.player2Id && (
    match.player1Id === props.currentUserId || 
    match.player2Id === props.currentUserId
  )
}

const isPlayerInMatch = (match: Match) => {
  return match.player1Id === props.currentUserId || 
         match.player2Id === props.currentUserId
}

const isPlayerReady = (match: Match) => {
  if (match.player1Id === props.currentUserId) {
    return match.player1Ready === true
  }
  if (match.player2Id === props.currentUserId) {
    return match.player2Ready === true
  }
  return false
}

const getOpponentReadyStatus = (match: Match) => {
  if (match.player1Id === props.currentUserId) {
    return match.player2Ready === true
  }
  if (match.player2Id === props.currentUserId) {
    return match.player1Ready === true
  }
  return false
}

const areBothPlayersReady = (match: Match) => {
  return match.player1Ready === true && match.player2Ready === true
}

const getMatchGap = (roundIndex: number) => {
  // Increase gap between matches in later rounds for bracket effect
  const baseGap = 20
  const multiplier = Math.pow(2, roundIndex)
  return `${baseGap * multiplier}px`
}
</script>

<style scoped>
.tournament-bracket-container {
  @apply p-6;
}

.bracket-header {
  @apply mb-8 text-center;
}

/* ======= LARGE BRACKET TREE STYLES ======= */
.lobby-setup-container {
  @apply flex flex-col gap-8;
}

.bracket-tree-large {
  @apply w-full;
}

.bracket-title {
  @apply text-xl font-bold text-slate-900 mb-2 text-center;
}

.bracket-subtitle {
  @apply text-xs text-slate-600 mb-4 text-center;
}

.tournament-bracket {
  @apply flex justify-start items-center gap-16 p-8 min-h-[500px];
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5));
  backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 2px solid rgba(255,255,255,0.7);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  width: 100%;
}

.bracket-column {
  @apply flex flex-col justify-around items-center gap-4 relative;
  min-width: 300px;
  flex-shrink: 0;
}

.round-label {
  @apply text-sm font-bold text-slate-800 mb-4 text-center uppercase tracking-wide;
}

.bracket-matchup {
  @apply relative flex flex-col gap-3;
  margin: 12px 0;
}

.bracket-matchup.semifinal {
  margin: 30px 0;
}

.bracket-matchup.final {
  margin: 60px 0;
}

.bracket-matchup.quarterfinal {
  margin: 20px 0;
}

.bracket-seed {
  @apply relative;
}

.clickable-seed {
  cursor: pointer;
}

.clickable-seed:hover .seed-content {
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.seed-number {
  @apply absolute -left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600;
}

.seed-content {
  @apply w-72 h-16 flex flex-col items-start justify-center px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.seed-content.has-player {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
}

.seed-content:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.result-seed .seed-content {
  background: rgba(255, 255, 255, 0.7);
  border-color: #e2e8f0;
  color: #64748b;
  font-weight: 700;
}

.empty-text {
  @apply text-slate-400 text-xs text-center w-full;
}

.player-name-display {
  @apply text-slate-900 font-bold text-sm truncate w-full;
}

.player-dept-display {
  @apply text-slate-600 text-xs truncate w-full;
}

/* ======= PLAYER SELECTOR DROPDOWN ======= */
.player-dropdown {
  @apply absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-blue-400 z-50;
  max-height: 300px;
  overflow: hidden;
}

.dropdown-header {
  @apply flex items-center justify-between px-4 py-3 bg-blue-500 text-white font-bold text-sm border-b border-blue-600;
}

.close-dropdown {
  @apply w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-600 transition-colors text-white font-bold;
}

.dropdown-options {
  @apply overflow-y-auto;
  max-height: 250px;
}

.dropdown-option {
  @apply w-full px-4 py-3 text-left flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-200;
}

.dropdown-option:disabled {
  @apply opacity-40 cursor-not-allowed bg-slate-50;
}

.option-name {
  @apply font-semibold text-slate-900 text-sm flex-1;
}

.option-dept {
  @apply text-slate-600 text-xs mr-2;
}

.option-assigned {
  @apply text-green-600 font-bold text-lg;
}

/* CONNECTOR LINES - Tournament Bracket Style */
.connector-lines {
  @apply absolute right-0 top-1/2;
  width: 64px;
  height: 80px;
  transform: translateY(-50%) translateX(100%);
  pointer-events: none;
}

.quarterfinal .connector-lines {
  height: 120px;
}

.semifinal .connector-lines {
  height: 180px;
}

.final .connector-lines {
  height: 320px;
}

.line-h {
  @apply absolute left-0 top-1/4;
  width: 32px;
  height: 2px;
  background: #475569;
}

.bracket-matchup .bracket-seed:last-of-type ~ .connector-lines .line-h {
  top: 75%;
}

.line-v {
  @apply absolute left-8;
  top: 25%;
  width: 2px;
  height: 50%;
  background: #475569;
}

.line-h-end {
  @apply absolute left-8 top-1/2;
  width: 56px;
  height: 2px;
  background: #475569;
  transform: translateY(-50%);
}

.champion-line .line-h-end {
  background: #f59e0b;
  height: 3px;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

/* CHAMPION SECTION */
.champion-column {
  @apply flex flex-col items-center justify-center gap-4;
  min-width: 180px;
  flex-shrink: 0;
}

.champion-box {
  @apply flex flex-col items-center justify-center p-4 rounded-xl;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 3px solid #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
}

.champion-trophy {
  @apply text-4xl mb-2;
}

.champion-text {
  @apply text-xs font-bold text-amber-900 text-center uppercase tracking-wide;
}

/* BRACKET SETUP ACTIONS */
.bracket-setup-actions {
  @apply flex justify-center gap-3 mt-6;
}

.setup-btn {
  @apply px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200;
}

.setup-btn.secondary {
  background: rgba(255, 255, 255, 0.95);
  border: 3px solid #cbd5e1;
  color: #475569;
}

.setup-btn.secondary:hover {
  background: #f1f5f9;
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.setup-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

.setup-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.5);
}

/* PLAYERS POOL - LARGE VERSION */
.players-pool-large {
  @apply mt-6;
}

.pool-header {
  @apply flex justify-between items-center mb-4;
}

.pool-title {
  @apply text-lg font-bold text-slate-900;
}

.invite-players-btn {
  @apply px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
}

.invite-players-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(139, 92, 246, 0.4);
}

.players-grid-large {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl;
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5));
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255,255,255,0.7);
}

.player-tile-large {
  @apply relative p-3 rounded-lg transition-all duration-200;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #cbd5e1;
}

.player-tile-large.draggable {
  @apply cursor-move;
}

.player-tile-large.draggable:hover {
  @apply border-blue-400 transform -translate-y-2;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}

.player-tile-large.assigned {
  @apply border-green-400 bg-green-50;
}

.player-tile-large.drag-active {
  @apply opacity-50;
}

.player-content-large {
  @apply flex items-center gap-2;
}

.player-avatar-large {
  @apply text-2xl;
}

.player-details-large {
  @apply flex flex-col;
}

.player-name-large {
  @apply font-bold text-sm text-slate-900;
}

.player-elo-large {
  @apply text-xs text-slate-600 font-medium;
}

.assigned-indicator-large {
  @apply absolute top-1 right-1 text-lg text-green-600;
}

.empty-slot {
  @apply opacity-50 cursor-default;
}

/* LOBBY FOOTER */
.lobby-footer-actions {
  @apply flex justify-center items-center gap-3 mt-4;
}

.creator-info {
  @apply px-4 py-2 rounded-lg bg-amber-100 border border-amber-300;
}

.lobby-btn {
  @apply px-5 py-2 rounded-lg font-semibold text-sm transition-all;
}

.lobby-btn.join {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.lobby-btn.join:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.5);
}

.lobby-btn.join:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.lobby-btn.leave {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.lobby-btn.leave:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.5);
}

/* ======= SPECTATOR WATCH FUNCTIONALITY ======= */
.spectator-actions {
  @apply mt-6 p-4 rounded-xl;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.watch-buttons-grid {
  @apply grid grid-cols-2 sm:grid-cols-4 gap-2;
}

.watch-player-btn {
  @apply relative px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-between gap-1;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #cbd5e1;
}

.watch-player-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.watch-seed-num {
  @apply flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold;
}

.watch-player-name {
  @apply flex-1 truncate text-slate-900;
}

.watch-icon {
  @apply text-base;
}

/* ======= ACTIVE TOURNAMENT MATCH STYLES ======= */
.tournament-status {
  @apply flex items-center justify-center gap-4 mt-4;
}

.status-badge {
  @apply px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider;
}

.status-waiting {
  @apply bg-yellow-500/20 text-yellow-700 border border-yellow-500/50;
}

.status-ready {
  @apply bg-green-500/20 text-green-700 border border-green-500/50;
}

.status-active {
  @apply bg-blue-500/20 text-blue-700 border border-blue-500/50;
}

.status-completed {
  @apply bg-[#021d94]/20 text-[#021d94] border border-[#021d94]/50;
}

.matches-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.match-card {
  @apply p-6 rounded-2xl;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.match-header {
  @apply flex justify-between items-center mb-4;
}

.match-label {
  @apply text-lg font-bold text-slate-900;
}

.match-status {
  @apply px-3 py-1 rounded-full text-sm font-semibold;
}

.match-status.ready {
  @apply bg-green-100 text-green-800;
}

.match-status.waiting {
  @apply bg-yellow-100 text-yellow-800;
}

.match-players {
  @apply flex justify-between items-center mb-4;
}

.player-section {
  @apply flex-1 text-center;
}

.player-section .name {
  @apply text-xl font-bold text-slate-900;
}

.player-section .elo {
  @apply text-sm text-slate-600;
}

.player-section .ready-badge {
  @apply inline-block mt-2 px-2 py-1 rounded text-xs font-bold;
}

.player-section .ready-badge.ready {
  @apply bg-green-500 text-white;
}

.player-section .ready-badge.not-ready {
  @apply bg-slate-300 text-slate-700;
}

.vs-divider {
  @apply text-2xl font-bold text-slate-400 mx-4;
}

.match-actions {
  @apply flex gap-3 justify-center;
}

.match-btn {
  @apply px-6 py-3 rounded-xl font-bold transition-all;
}

.match-btn.ready-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.match-btn.ready-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
}

.match-btn.watch-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.match-btn.watch-btn:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
}

.match-btn.replay-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #cbd5e1;
  color: #475569;
}

.match-btn.replay-btn:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.match-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* ======= OLD BRACKET STYLES (UNUSED) ======= */
.tournament-status {
  @apply flex items-center justify-center gap-4 mt-4;
}

.status-badge {
  @apply px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider;
}

.status-waiting {
  @apply bg-yellow-500/20 text-yellow-700 border border-yellow-500/50;
}

.status-ready {
  @apply bg-green-500/20 text-green-700 border border-green-500/50;
}

.status-active {
  @apply bg-blue-500/20 text-blue-700 border border-blue-500/50;
}

.status-completed {
  @apply bg-[#021d94]/20 text-[#021d94] border border-[#021d94]/50;
}

.player-count {
  @apply text-lg font-medium text-slate-600;
}

.best-of-badge {
  @apply px-3 py-1 rounded-full text-sm font-semibold;
  background: rgba(2, 29, 148, 0.1);
  color: #021d94;
  border: 1px solid rgba(2, 29, 148, 0.2);
}

.bracket-main {
  @apply space-y-8;
}

.bracket-tree {
  @apply rounded-3xl p-8 overflow-x-auto;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(2, 29, 148, 0.1);
}

.bracket-rounds {
  @apply flex gap-16 min-w-max;
}

.bracket-round {
  @apply flex flex-col;
}

.round-header {
  @apply text-center mb-6 pb-3 border-b-2 border-slate-700;
}

.round-title {
  @apply text-lg font-bold text-white uppercase tracking-wider;
}

.round-matches {
  @apply flex flex-col justify-around;
  min-height: 300px;
}

.bracket-match {
  @apply relative;
}

.match-box {
  @apply bg-slate-800 border-2 border-slate-700 rounded-lg w-48 overflow-hidden;
}

.match-box.match-active {
  border-color: #021d94;
  box-shadow: 0 8px 20px rgba(2, 29, 148, 0.25);
}

.match-box.match-completed {
  border-color: #10b981;
  opacity: 0.8;
}

.match-participant {
  @apply px-3 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700/50 transition;
}

.match-participant.winner {
  @apply bg-[#ffaa00]/20 text-white font-semibold;
}

.participant-name {
  @apply flex-1 truncate;
}

.series-score {
  @apply px-2 py-0.5 rounded text-xs font-bold ml-2;
  background: rgba(2, 29, 148, 0.1);
  color: #021d94;
  border: 1px solid rgba(2, 29, 148, 0.2);
}

.winner-mark {
  @apply text-[#ffaa00] font-bold;
}

.match-divider {
  @apply h-px;
  background: rgba(2, 29, 148, 0.15);
}

.bracket-connector {
  @apply absolute left-full top-1/2 w-16 h-32 pointer-events-none;
  transform: translateY(-50%);
}

.connector-line {
  stroke: rgba(2, 29, 148, 0.3);
  stroke-width: 2;
  fill: none;
}

.match-controls {
  @apply rounded-3xl p-6;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(2, 29, 148, 0.1);
}

.controls-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.match-control-card {
  @apply rounded-lg p-4;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(2, 29, 148, 0.15);
}

.match-control-header {
  @apply mb-3 pb-3;
  border-bottom: 1px solid rgba(2, 29, 148, 0.15);
  color: #1e293b;
  font-weight: 600;
}

.match-actions {
  @apply mt-3 space-y-2;
}

.ready-section {
  @apply space-y-2;
}

.ready-btn {
  @apply w-full px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-xs;
  background: rgba(2, 29, 148, 0.1);
  color: #021d94;
  border: 1px solid rgba(2, 29, 148, 0.2);
}

.ready-btn:hover {
  background: rgba(2, 29, 148, 0.15);
  border-color: #021d94;
}

.ready-status {
  @apply block w-full px-3 py-1.5 rounded-lg font-medium text-center text-xs;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.opponent-status {
  @apply text-center text-xs py-1;
  color: #64748b;
}

.spectator-section {
  @apply text-center py-2;
}

.start-match-btn, .view-game-btn {
  @apply w-full px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-xs;
}

.start-match-btn {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.start-match-btn:hover {
  background: rgba(16, 185, 129, 0.15);
}

.view-game-btn.player-btn {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white hover:opacity-90;
}

.view-game-btn.spectator-btn {
  background: rgba(2, 29, 148, 0.1);
  color: #021d94;
  border: 1px solid rgba(2, 29, 148, 0.2);
  @apply flex items-center justify-center gap-1 text-xs;
}

.view-game-btn.spectator-btn:hover {
  background: rgba(2, 29, 148, 0.15);
}

.view-game-btn.replay-btn {
  background: rgba(100, 116, 139, 0.1);
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.simulate-controls {
  @apply mt-3 pt-3;
  border-top: 1px solid rgba(2, 29, 148, 0.15);
}

.simulate-btn {
  @apply flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.simulate-btn:hover {
  background: rgba(99, 102, 241, 0.15);
}

/* Lobby and Bracket Setup */
.lobby-container {
  @apply space-y-8;
}

.section-title {
  @apply text-2xl font-bold text-slate-900 mb-6;
}

.bracket-tree-setup {
  @apply mb-12;
}

.bracket-visual {
  @apply py-8;
}

.bracket-level {
  @apply grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto;
}

.bracket-position {
  @apply relative;
}

.position-number {
  @apply text-xs font-bold text-slate-400 mb-2;
}

.position-slot {
  @apply relative border-2 rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center transition-all;
  @apply bg-white/50 backdrop-blur border-slate-300;
}

.position-slot.drop-target {
  @apply hover:border-[#021d94] hover:bg-[#021d94]/5 cursor-pointer;
}

.position-slot.has-player {
  @apply border-[#021d94] bg-gradient-to-br from-[#021d94]/10 to-[#ffaa00]/10;
}

.slot-player {
  @apply text-slate-900 font-semibold text-sm;
}

.slot-empty {
  @apply text-slate-400 text-sm;
}

.match-connector {
  @apply absolute -right-8 top-1/2 transform -translate-y-1/2 flex flex-col items-center;
}

.connector-bracket {
  @apply w-6 h-px bg-slate-300 mb-1;
}

.vs-label {
  @apply text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-300;
}

.bracket-setup-actions {
  @apply flex gap-3 justify-center mt-8 flex-wrap;
}

.setup-btn {
  @apply px-6 py-3 rounded-xl font-semibold transition-all duration-300;
}

.setup-btn.secondary {
  @apply bg-white border-2 border-slate-300 text-slate-700 hover:border-[#021d94] hover:text-[#021d94];
}

.setup-btn.primary {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white hover:shadow-xl hover:shadow-[#021d94]/25;
}

.players-pool-section {
  @apply py-8;
}

.players-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.player-tile {
  @apply relative border-2 rounded-xl p-4 transition-all duration-300;
  @apply bg-white/70 backdrop-blur border-slate-300;
}

.player-tile.draggable {
  @apply cursor-move hover:border-[#021d94] hover:shadow-lg hover:scale-105;
}

.player-tile.drag-active {
  @apply opacity-50 scale-95;
}

.player-tile.assigned {
  @apply border-green-500 bg-green-50/70;
}

.player-tile.empty-slot {
  @apply border-dashed opacity-50;
}

.player-content {
  @apply flex items-center gap-3;
}

.player-avatar {
  @apply text-3xl;
}

.player-details {
  @apply flex flex-col;
}

.player-name {
  @apply font-semibold text-slate-900 text-sm;
}

.player-elo {
  @apply text-xs text-slate-600;
}

.assigned-indicator {
  @apply absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold;
}

.lobby-footer-actions {
  @apply flex gap-4 justify-center mt-8;
}

.lobby-btn {
  @apply px-8 py-3 rounded-xl font-semibold transition-all duration-300;
}

.lobby-btn.join {
  @apply bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50;
}

.lobby-btn.leave {
  @apply bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-red-500/50;
}

.lobby-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.waiting-lobby {
  @apply rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-glass p-8;
}

.players-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8;
}

.player-card {
  @apply rounded-xl border border-white/60 bg-white/50 p-4 backdrop-blur-sm;
}

.player-card.empty {
  @apply border-dashed border-slate-300;
}

.player-info {
  @apply flex flex-col gap-1;
}

.player-name {
  @apply text-slate-900 font-semibold;
}

.player-elo {
  @apply text-sm text-slate-600;
}

.lobby-actions {
  @apply flex flex-wrap gap-4 justify-center mt-8;
}

.action-btn {
  @apply px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed;
}

.join-btn {
  @apply bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50;
}

.leave-btn {
  @apply bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:shadow-red-500/50;
}

.start-btn {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white hover:shadow-lg hover:shadow-[#021d94]/25;
}

.winner-announcement {
  @apply mt-12 text-center py-12 rounded-3xl border border-[#ffaa00]/50 bg-gradient-to-r from-[#ffaa00]/10 to-[#021d94]/10 backdrop-blur-xl;
}

.trophy-icon {
  @apply text-8xl mb-4;
}

/* ======= INVITE PLAYERS MODAL ======= */
.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.modal-container {
  @apply bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4;
  max-height: 90vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { 
    transform: translateY(20px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-500 to-purple-600;
}

.modal-title {
  @apply text-xl font-bold text-white;
}

.modal-close {
  @apply w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-700 transition-colors text-white font-bold text-lg;
}

.modal-body {
  @apply p-6 overflow-y-auto;
  max-height: calc(90vh - 180px);
}

.search-section {
  @apply mb-6;
}

.search-input {
  @apply w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-purple-500 focus:outline-none text-sm;
}

.invitable-players-list {
  @apply space-y-2 mb-6;
}

.invitable-player-item {
  @apply flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200;
}

.player-info-invite {
  @apply flex items-center gap-3;
}

.player-icon {
  @apply text-2xl;
}

.player-details-invite {
  @apply flex flex-col;
}

.player-name-invite {
  @apply font-bold text-slate-900 text-sm;
}

.player-dept-invite {
  @apply text-xs text-slate-600;
}

.invite-btn {
  @apply px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.invite-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.4);
}

.invite-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.no-players {
  @apply text-center py-8;
}

.pending-invites-section {
  @apply mt-6 pt-6 border-t border-slate-200;
}

.section-subtitle {
  @apply text-sm font-bold text-slate-700 mb-3;
}

.pending-invites-list {
  @apply space-y-2;
}

.pending-invite-item {
  @apply flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200;
}

.pending-player-name {
  @apply font-semibold text-slate-900 text-sm;
}

.pending-status {
  @apply text-xs text-amber-700;
}

.modal-footer {
  @apply px-6 py-4 border-t border-slate-200 flex justify-end;
}

.modal-btn-close {
  @apply px-6 py-2 rounded-lg font-semibold text-sm transition-all;
  background: #64748b;
  color: white;
}

.modal-btn-close:hover {
  background: #475569;
}

/* ======= SUCCESS MODAL ======= */
.success-modal-container {
  @apply rounded-2xl shadow-2xl p-10 max-w-md text-center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  animation: scaleIn 0.3s ease-out;
}

.success-icon {
  @apply text-6xl mb-4;
  animation: bounceIn 0.5s ease-out 0.2s backwards;
}

.success-title {
  @apply text-3xl font-bold text-white mb-4;
}

.success-message {
  @apply text-white/95 text-lg mb-2;
}

.success-submessage {
  @apply text-white/80 text-sm mb-8;
}

.success-btn {
  @apply bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-xl;
}

.success-btn:hover {
  transform: translateY(-2px);
}
</style>
