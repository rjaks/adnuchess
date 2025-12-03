<template>
  <div class="bracket-seeding-container">
    <div class="seeding-header">
      <h2 class="text-2xl font-bold text-slate-900">Setup Tournament Bracket</h2>
      <p class="text-sm text-slate-600 mt-1">Drag players to bracket positions or use auto-seed</p>
    </div>

    <div class="seeding-content">
      <!-- Available Players Pool -->
      <div class="players-pool">
        <h3 class="text-lg font-semibold text-slate-900 mb-3">Available Players</h3>
        <div class="players-list">
          <div
            v-for="player in unassignedPlayers"
            :key="player.userId"
            :draggable="true"
            @dragstart="handleDragStart($event, player)"
            @dragend="handleDragEnd"
            class="player-chip draggable"
          >
            <span class="player-icon">♟️</span>
            <span class="player-name">{{ player.name }}</span>
            <span class="player-elo">{{ player.elo }}</span>
          </div>
          <div v-if="unassignedPlayers.length === 0" class="text-slate-400 text-sm">
            All players assigned
          </div>
        </div>
      </div>

      <!-- Bracket Preview -->
      <div class="bracket-preview">
        <h3 class="text-lg font-semibold text-slate-900 mb-3">Round 1 Bracket</h3>
        <div class="bracket-slots">
          <div
            v-for="(slot, index) in bracketSlots"
            :key="index"
            class="bracket-slot-card"
            :class="{ 'has-player': slot.player }"
          >
            <div class="slot-header">
              <span class="slot-label">Position {{ index + 1 }}</span>
              <button
                v-if="slot.player"
                @click="removePlayer(index)"
                class="remove-btn"
              >
                ×
              </button>
            </div>
            <div
              class="slot-dropzone"
              @dragover.prevent="handleDragOver($event, index)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, index)"
              :class="{ 'drag-over': dragOverIndex === index }"
            >
              <div v-if="slot.player" class="assigned-player">
                <span class="player-icon">♟️</span>
                <span class="player-name">{{ slot.player.name }}</span>
                <span class="player-elo">{{ slot.player.elo }}</span>
              </div>
              <div v-else class="empty-slot">
                <span class="text-slate-400">Drop player here</span>
              </div>
            </div>
            <div v-if="index % 2 === 0" class="match-indicator">
              vs Position {{ index + 2 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="seeding-actions">
      <button @click="autoSeed" class="action-btn auto-seed-btn">
        🎲 Auto-Seed by ELO
      </button>
      <button @click="randomSeed" class="action-btn random-seed-btn">
        🔀 Random Seed
      </button>
      <button
        @click="confirmSeeding"
        :disabled="!allSlotsAssigned"
        class="action-btn confirm-btn"
        :class="{ 'disabled': !allSlotsAssigned }"
      >
        Start Tournament →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Player {
  userId: string
  name: string
  elo: number
}

interface BracketSlot {
  player: Player | null
}

const props = defineProps<{
  players: Player[]
  maxPlayers: number
}>()

const emit = defineEmits<{
  'start-tournament': [seededPlayers: Player[]]
  'cancel': []
}>()

// Initialize bracket slots based on power of 2
const getBracketSize = () => {
  const playerCount = props.players.length
  // Find next power of 2
  let size = 2
  while (size < playerCount) {
    size *= 2
  }
  return size
}

const bracketSlots = ref<BracketSlot[]>([])
const draggedPlayer = ref<Player | null>(null)
const dragOverIndex = ref<number | null>(null)

// Initialize slots
const initializeSlots = () => {
  const size = getBracketSize()
  bracketSlots.value = Array(size).fill(null).map(() => ({ player: null }))
}

initializeSlots()

const unassignedPlayers = computed(() => {
  const assignedIds = bracketSlots.value
    .filter(slot => slot.player)
    .map(slot => slot.player!.userId)
  return props.players.filter(p => !assignedIds.includes(p.userId))
})

const allSlotsAssigned = computed(() => {
  return unassignedPlayers.value.length === 0 && 
         bracketSlots.value.slice(0, props.players.length).every(slot => slot.player)
})

const handleDragStart = (event: DragEvent, player: Player) => {
  draggedPlayer.value = player
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', player.userId)
  }
}

const handleDragEnd = () => {
  draggedPlayer.value = null
  dragOverIndex.value = null
}

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragOverIndex.value = index
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

const handleDrop = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragOverIndex.value = null
  
  if (draggedPlayer.value && index < props.players.length) {
    // Remove player from current slot if already assigned
    const currentSlotIndex = bracketSlots.value.findIndex(
      slot => slot.player?.userId === draggedPlayer.value!.userId
    )
    if (currentSlotIndex >= 0) {
      bracketSlots.value[currentSlotIndex].player = null
    }
    
    // Assign to new slot
    bracketSlots.value[index].player = draggedPlayer.value
  }
  
  draggedPlayer.value = null
}

const removePlayer = (index: number) => {
  bracketSlots.value[index].player = null
}

const autoSeed = () => {
  // Sort by ELO (highest first)
  const sorted = [...props.players].sort((a, b) => b.elo - a.elo)
  
  // Assign to bracket positions
  sorted.forEach((player, index) => {
    if (index < bracketSlots.value.length) {
      bracketSlots.value[index].player = player
    }
  })
}

const randomSeed = () => {
  // Shuffle players
  const shuffled = [...props.players].sort(() => Math.random() - 0.5)
  
  // Assign to bracket positions
  shuffled.forEach((player, index) => {
    if (index < bracketSlots.value.length) {
      bracketSlots.value[index].player = player
    }
  })
}

const confirmSeeding = () => {
  if (!allSlotsAssigned.value) return
  
  const seededPlayers = bracketSlots.value
    .slice(0, props.players.length)
    .map(slot => slot.player!)
    .filter(Boolean)
  
  emit('start-tournament', seededPlayers)
}
</script>

<style scoped>
.bracket-seeding-container {
  @apply rounded-3xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl;
}

.seeding-header {
  @apply mb-6;
}

.seeding-content {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6;
}

.players-pool {
  @apply rounded-2xl border border-slate-200 bg-white p-4;
}

.players-list {
  @apply space-y-2;
}

.player-chip {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#021d94]/10 to-[#ffaa00]/10 border border-[#021d94]/20 cursor-move transition-all;
}

.player-chip.draggable:hover {
  @apply shadow-lg scale-105;
}

.player-icon {
  @apply text-lg;
}

.player-name {
  @apply flex-1 font-medium text-slate-900;
}

.player-elo {
  @apply text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded;
}

.bracket-preview {
  @apply lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4;
}

.bracket-slots {
  @apply grid grid-cols-2 gap-4;
}

.bracket-slot-card {
  @apply rounded-lg border-2 border-dashed border-slate-300 p-3 transition-all;
}

.bracket-slot-card.has-player {
  @apply border-solid border-[#021d94]/30 bg-gradient-to-br from-[#021d94]/5 to-[#ffaa00]/5;
}

.slot-header {
  @apply flex items-center justify-between mb-2;
}

.slot-label {
  @apply text-xs font-semibold text-slate-600 uppercase tracking-wide;
}

.remove-btn {
  @apply w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 transition-colors;
}

.slot-dropzone {
  @apply min-h-[60px] flex items-center justify-center rounded-lg transition-all;
}

.slot-dropzone.drag-over {
  @apply bg-[#021d94]/10 border-2 border-[#021d94] border-dashed;
}

.assigned-player {
  @apply flex items-center gap-2 w-full;
}

.empty-slot {
  @apply text-center;
}

.match-indicator {
  @apply text-xs text-slate-500 text-center mt-2 py-1 bg-slate-100 rounded;
}

.seeding-actions {
  @apply flex gap-3 justify-end;
}

.action-btn {
  @apply px-6 py-3 rounded-full font-bold transition-all duration-300;
}

.auto-seed-btn {
  @apply bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/25;
}

.random-seed-btn {
  @apply bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg hover:shadow-green-500/25;
}

.confirm-btn {
  @apply bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white hover:shadow-lg hover:shadow-[#021d94]/25;
}

.confirm-btn.disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
