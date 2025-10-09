<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <Transition name="modal-content">
          <div
            v-if="isOpen"
            class="relative mx-4 mt-20 w-full max-w-2xl rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <!-- Header -->
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-xl font-bold text-slate-800">Search Players</h2>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                @click="closeModal"
                aria-label="Close search"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative mb-6">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <input
                ref="searchInput"
                v-model="searchTerm"
                type="text"
                placeholder="Search by name or email..."
                class="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 backdrop-blur-sm transition focus:border-[#021d94] focus:outline-none focus:ring-2 focus:ring-[#021d94]/20"
                @input="debouncedSearch"
                @keydown.escape="closeModal"
              />
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-12">
              <div class="flex items-center gap-3">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
                <span class="text-slate-600">Searching...</span>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="rounded-2xl bg-red-50 p-4 text-center">
              <p class="text-red-600">{{ error }}</p>
            </div>

            <!-- No Results -->
            <div v-else-if="searchTerm.length >= 2 && results.length === 0 && !isLoading" class="py-12 text-center">
              <svg class="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <h3 class="mt-4 text-lg font-semibold text-slate-800">No players found</h3>
              <p class="mt-2 text-slate-600">Try adjusting your search term</p>
            </div>

            <!-- Results -->
            <div v-else-if="results.length > 0" class="space-y-3">
              <div class="mb-4">
                <p class="text-sm text-slate-600">
                  Found {{ totalResults }} player{{ totalResults !== 1 ? 's' : '' }}
                  <span v-if="results.length < totalResults">
                    (showing top {{ results.length }})
                  </span>
                </p>
              </div>

              <div class="max-h-96 space-y-2 overflow-y-auto">
                <div
                  v-for="player in results"
                  :key="player.id"
                  class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:bg-white hover:shadow-sm"
                >
                  <!-- Avatar -->
                  <div class="flex-shrink-0">
                    <img
                      v-if="player.picture"
                      :src="player.picture"
                      :alt="player.name"
                      class="h-12 w-12 rounded-full border-2 border-white/70 object-cover shadow-sm"
                    />
                    <div
                      v-else
                      class="flex h-12 w-12 items-center justify-center rounded-full bg-[#021d94]/15 text-sm font-bold uppercase text-[#021d94]"
                    >
                      {{ getInitials(player.name) }}
                    </div>
                  </div>

                  <!-- Player Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold text-slate-800 truncate">{{ player.name }}</h3>
                      <span
                        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        :class="getUserTypeColor(player.userType)"
                      >
                        {{ getUserTypeLabel(player.userType) }}
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 truncate">{{ player.email }}</p>
                    <div class="mt-1 flex items-center gap-4 text-xs text-slate-500">
                      <span>Rating: {{ player.rating }}</span>
                      <span>{{ player.totalMatches }} matches</span>
                      <span v-if="player.totalMatches > 0">{{ player.winRate }}% win rate</span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex-shrink-0">
                    <button
                      type="button"
                      class="rounded-full bg-[#021d94] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#021d94]/90"
                      @click="viewProfile(player.id)"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Initial State -->
            <div v-else class="py-12 text-center">
              <svg class="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <h3 class="mt-4 text-lg font-semibold text-slate-800">Search for players</h3>
              <p class="mt-2 text-slate-600">Enter a name or email to find other players</p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useFetch } from '#imports'

type SearchResult = {
  id: string
  name: string
  email: string
  picture?: string
  rating: number
  department?: string
  userType?: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  stats: {
    wins: number
    losses: number
    draws: number
  }
  totalMatches: number
  winRate: number
}

interface Props {
  isOpen: boolean
}

interface Emits {
  (event: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchInput = ref<HTMLInputElement>()
const searchTerm = ref('')
const results = ref<SearchResult[]>([])
const totalResults = ref(0)
const isLoading = ref(false)
const error = ref('')

let debounceTimeout: NodeJS.Timeout | null = null

const debouncedSearch = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  
  debounceTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  const term = searchTerm.value.trim()
  
  if (term.length < 2) {
    results.value = []
    totalResults.value = 0
    error.value = ''
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/players/search', {
      query: { q: term, limit: 10 }
    })

    results.value = response.results
    totalResults.value = response.totalResults
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to search players'
    results.value = []
    totalResults.value = 0
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const getInitials = (name: string) => {
  return name
    .split(/[\s@._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(segment => segment.charAt(0).toUpperCase())
    .join('')
}

const getUserTypeColor = (userType?: string) => {
  switch (userType) {
    case 'faculty':
      return 'bg-purple-100 text-purple-700'
    case 'staff':
      return 'bg-blue-100 text-blue-700'
    case 'alumni':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-orange-100 text-orange-700'
  }
}

const getUserTypeLabel = (userType?: string) => {
  switch (userType) {
    case 'faculty':
      return 'Faculty'
    case 'staff':
      return 'Staff'
    case 'alumni':
      return 'Alumni'
    default:
      return 'Student'
  }
}

const viewProfile = (playerId: string) => {
  // Navigate to the player's profile page
  navigateTo(`/profile/${playerId}`)
  closeModal()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// Focus search input when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    // Reset search when modal closes
    searchTerm.value = ''
    results.value = []
    totalResults.value = 0
    error.value = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
})
</script>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>