<template>
  <section class="space-y-10">
    <header class="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-glass backdrop-blur-xl">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <div class="relative">
            <span
              v-if="profile?.picture"
              class="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-inner"
            >
              <img :src="profile.picture" :alt="profile?.name" class="h-full w-full object-cover" />
            </span>
            <span
              v-else
              class="grid h-20 w-20 place-items-center rounded-3xl bg-[#021d94]/15 text-2xl font-bold uppercase text-[#021d94]"
            >
              {{ initials }}
            </span>
            
            <!-- Photo Upload Button -->
            <button 
              @click="showPhotoUploadModal = true" 
              class="absolute -bottom-1 -right-1 rounded-full bg-[#021d94] p-2 text-white shadow-lg hover:bg-[#021d94]/90 transition-colors"
              title="Upload profile photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">
              AdNU Player Profile
            </p>
            <div class="flex items-center gap-2">
              <h1 class="text-3xl font-bold text-slate-900">{{ profile?.name }}</h1>
              <button 
                @click="showDisplayNameModal = true" 
                class="inline-flex items-center justify-center rounded-full w-8 h-8 bg-white border border-[#021d94]/20 text-[#021d94] hover:bg-[#021d94]/5 transition-colors"
                title="Edit display name"
              >
                <span class="sr-only">Edit display name</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-slate-500">{{ profile?.email }}</p>

            <!-- Display Name (if it exists) -->
            <p v-if="convexProfile?.displayName && convexProfile.displayName !== profile?.name" class="text-sm italic text-slate-600 mt-1">
              Display name: {{ convexProfile.displayName }}
            </p>

            <!-- ELO Rating display -->
            <p class="text-sm font-semibold text-[#021d94] mt-1">
              ELO Rating: {{ convexProfile?.elo || 1200 }}
            </p>

            <!-- Role pill / link -->
            <div class="mt-2">
              <span
                v-if="roleLabel"
                class="inline-block rounded-full bg-[#021d94] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
              >
                {{ roleLabel }}
              </span>
              <NuxtLink
                v-else
                to="/profile-setup"
                class="text-xs font-medium text-[#021d94] underline"
              >
                Complete your profile (set role)
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Arena Record - New Card Layout -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Games Card -->
          <div class="rounded-2xl bg-white border border-white/60 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900">{{ totalMatches }}</div>
              <div class="text-xs uppercase tracking-wide text-slate-500">Total Games</div>
            </div>
          </div>
          
          <!-- Wins Card -->
          <div class="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-700">{{ profile?.stats.wins ?? 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-green-600">Wins</div>
            </div>
          </div>
          
          <!-- Losses Card -->
          <div class="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-red-700">{{ profile?.stats.losses ?? 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-red-600">Losses</div>
            </div>
          </div>
          
          <!-- Draws Card -->
          <div class="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-700">{{ profile?.stats.draws ?? 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-amber-600">Draws</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <section class="grid gap-6 md:grid-cols-2">
      <div class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
        <h2 class="text-lg font-semibold text-slate-900">Achievements</h2>
        <p class="text-sm text-slate-500">Earned by playing, winning, and discovering brilliant lines.</p>
        <ul class="mt-5 grid gap-3">
          <li
            v-for="achievement in achievements"
            :key="achievement.id"
            class="flex items-center justify-between rounded-2xl border border-[#021d94]/15 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <span>{{ achievement.label }}</span>
            <span class="rounded-full bg-[#021d94]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#021d94]">
              Unlocked
            </span>
          </li>
          <li
            v-if="achievements.length === 0"
            class="rounded-2xl border border-dashed border-white/70 px-4 py-3 text-sm text-slate-500"
          >
            Play more matches to unlock your first achievement.
          </li>
        </ul>
      </div>

      <div class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
        <h2 class="text-lg font-semibold text-slate-900">Badges</h2>
        <p class="text-sm text-slate-500">Collectable mementos for your journey across the arena.</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
          >
            <p class="font-semibold text-[#021d94]">{{ badge.label }}</p>
            <p class="text-xs uppercase tracking-wide text-slate-500">Unlocked</p>
          </div>
          <p
            v-if="badges.length === 0"
            class="rounded-2xl border border-dashed border-white/70 px-4 py-3 text-sm text-slate-500"
          >
            Secure your first win to start earning badges.
          </p>
        </div>
      </div>
    </section>

    <!-- Performance Analytics Section -->
    <section class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
      <h2 class="text-lg font-semibold text-slate-900 mb-4">Performance Analytics</h2>
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Win Rate Chart -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
          <h3 class="text-sm font-semibold text-slate-700 mb-4">Win Rate Distribution</h3>
          <div class="flex items-center justify-center">
            <div class="relative w-32 h-32">
              <!-- SVG Circular Chart -->
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle cx="60" cy="60" r="50" stroke="#e5e7eb" stroke-width="10" fill="none" />
                <!-- Win rate arc -->
                <circle 
                  cx="60" cy="60" r="50" 
                  stroke="#22c55e" 
                  stroke-width="10" 
                  fill="none"
                  :stroke-dasharray="winRateArc + ' ' + (314 - winRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
                <!-- Loss rate arc -->
                <circle 
                  cx="60" cy="60" r="35" 
                  stroke="#ef4444" 
                  stroke-width="8" 
                  fill="none"
                  :stroke-dasharray="lossRateArc + ' ' + (220 - lossRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
                <!-- Draw rate arc -->
                <circle 
                  cx="60" cy="60" r="22" 
                  stroke="#f59e0b" 
                  stroke-width="6" 
                  fill="none"
                  :stroke-dasharray="drawRateArc + ' ' + (138 - drawRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <!-- Center text -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-lg font-bold text-slate-800">{{ winPercentage }}%</div>
                  <div class="text-xs text-slate-600">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
          <!-- Legend -->
          <div class="mt-4 space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Wins: {{ profile?.stats.wins ?? 0 }} ({{ winPercentage }}%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Losses: {{ profile?.stats.losses ?? 0 }} ({{ lossPercentage }}%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Draws: {{ profile?.stats.draws ?? 0 }} ({{ drawPercentage }}%)</span>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="space-y-4">
          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">ELO Progress</span>
              <span class="text-sm font-semibold text-blue-600">{{ convexProfile?.elo || 1200 }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: eloProgress + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>1000</span>
              <span>2000</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Activity Level</span>
              <span class="text-sm font-semibold text-green-600">{{ activityLevel }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: activityPercentage + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>Inactive</span>
              <span>Very Active</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Performance</span>
              <span class="text-sm font-semibold" :class="performanceColor">{{ performanceLevel }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-1000 ease-out"
                :class="performanceBarClass"
                :style="{ width: Math.max(winPercentage, 10) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>Beginner</span>
              <span>Expert</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>

  <!-- Photo Upload Modal -->
  <div v-if="showPhotoUploadModal" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" aria-labelledby="photo-modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showPhotoUploadModal = false"></div>

      <!-- Modal panel -->
      <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#021d94]/10 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#021d94]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg font-medium leading-6 text-gray-900" id="photo-modal-title">Upload Profile Photo</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Choose a photo to use as your profile picture. Supported formats: JPG, PNG, GIF (max 5MB).
                </p>
              </div>
              
              <div class="mt-4">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    ref="fileInput"
                    @change="handleFileSelect"
                    accept="image/*"
                    class="hidden"
                  />
                  <button
                    @click="fileInput?.click()"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#021d94] bg-[#021d94]/10 hover:bg-[#021d94]/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                    Choose File
                  </button>
                  <p class="mt-2 text-xs text-gray-500">Or drag and drop an image here</p>
                </div>
                
                <div v-if="selectedFile" class="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm text-blue-800">Selected: {{ selectedFile.name }}</p>
                  <p class="text-xs text-blue-600">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            @click="uploadPhoto"
            type="button"
            class="inline-flex w-full justify-center rounded-md border border-transparent bg-[#021d94] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#021d94]/90 focus:outline-none focus:ring-2 focus:ring-[#021d94] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="!selectedFile || isUploading"
          >
            <span v-if="isUploading">Uploading...</span>
            <span v-else>Upload</span>
          </button>
          <button
            @click="showPhotoUploadModal = false; selectedFile = null"
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
        
        <div v-if="uploadMessage" class="px-4 py-3 text-center">
          <p class="text-sm" :class="uploadSuccess ? 'text-green-600' : 'text-red-600'">
            {{ uploadMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Display Name Edit Modal -->
  <div v-if="showDisplayNameModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDisplayNameModal = false"></div>

      <!-- Modal panel -->
      <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#021d94]/10 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#021d94]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">Edit Display Name</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Your display name will be shown to other players during matches. Leave empty to use your account name.
                </p>
              </div>
              
              <div class="mt-4">
                <label for="modal-display-name" class="block text-sm font-medium text-gray-700">Display Name</label>
                <div class="mt-1">
                  <input
                    type="text"
                    id="modal-display-name"
                    v-model="displayName"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#021d94] focus:ring-[#021d94] sm:text-sm"
                    :placeholder="profile?.name || 'Your display name'"
                    maxlength="30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            @click="updateDisplayNameAndCloseModal"
            type="button"
            class="inline-flex w-full justify-center rounded-md border border-transparent bg-[#021d94] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#021d94]/90 focus:outline-none focus:ring-2 focus:ring-[#021d94] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="isUpdating"
          >
            <span v-if="isUpdating">Updating...</span>
            <span v-else>Save</span>
          </button>
          <button
            @click="showDisplayNameModal = false"
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
        
        <div v-if="updateMessage" class="px-4 py-3 text-center">
          <p class="text-sm" :class="updateSuccess ? 'text-green-600' : 'text-red-600'">
            {{ updateMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { api } from '@/convex/_generated/api' // if '~' alias complains, use '@/'
const { $convex } = useNuxtApp()

// File input ref for photo upload
const fileInput = ref<HTMLInputElement | null>(null)

const { user, refresh } = useAuth()

// For display name editing
const displayName = ref('')
const isUpdating = ref(false)
const updateMessage = ref('')
const updateSuccess = ref(false)
const showDisplayNameModal = ref(false)

// For photo upload
const showPhotoUploadModal = ref(false)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadMessage = ref('')
const uploadSuccess = ref(false)

const fetchProfile = async () => {
  if (!user.value) return
  
  try {
    // Fetch Convex profile to get role, elo and displayName
    const profile = await $convex.query(api.profiles.getByUserId, {
      userId: user.value.id,
    })
    
    if (profile) {
      convexProfile.value = profile
      // Initialize the display name input with current value (if any)
      displayName.value = profile.displayName || ''
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
  }
}

onMounted(async () => {
  if (!user.value) await refresh()
  await fetchProfile()
})

const updateDisplayName = async () => {
  if (!user.value) return
  
  isUpdating.value = true
  updateMessage.value = ''
  
  try {
    // Use null to remove the display name if it's empty
    const cleanDisplayName = displayName.value.trim() === '' ? null : displayName.value.trim()
    
    await $convex.mutation(api.profiles.updateDisplayName, {
      userId: user.value.id,
      displayName: cleanDisplayName
    })
    
    // Refresh profile after update
    await fetchProfile()
    
    updateSuccess.value = true
    updateMessage.value = 'Profile updated successfully!'
    
    // Clear message after a delay
    setTimeout(() => {
      updateMessage.value = ''
    }, 3000)
  } catch (error) {
    updateSuccess.value = false
    updateMessage.value = 'Failed to update profile. Please try again.'
    console.error("Error updating profile:", error)
  } finally {
    isUpdating.value = false
  }
}

const updateDisplayNameAndCloseModal = async () => {
  await updateDisplayName()
  
  if (updateSuccess.value) {
    // Only close the modal if the update was successful
    setTimeout(() => {
      showDisplayNameModal.value = false
    }, 1000)
  }
}

const profile = computed(() => user.value)

// Convex profile + role pill text
const convexProfile = ref<any | null>(null)
const roleLabel = computed(() => {
  const r = convexProfile.value?.role as string | undefined
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : ''
})

const initials = computed(() => {
  if (!profile.value) return 'AU'
  const source = profile.value.name || profile.value.email
  const parts = source.split(/[\s@._]+/).filter(Boolean)
  return (
    parts
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('') || 'AU'
  )
})

const totalMatches = computed(() => {
  if (!profile.value) return 0
  const { wins, losses, draws } = profile.value.stats || { wins: 0, losses: 0, draws: 0 }
  return wins + losses + draws
})

const achievements = computed(() => profile.value?.achievements ?? [])
const badges = computed(() => profile.value?.badges ?? [])

// Analytics computed properties
const winPercentage = computed(() => {
  const total = totalMatches.value
  if (total === 0) return 0
  return Math.round(((profile.value?.stats.wins ?? 0) / total) * 100)
})

const lossPercentage = computed(() => {
  const total = totalMatches.value
  if (total === 0) return 0
  return Math.round(((profile.value?.stats.losses ?? 0) / total) * 100)
})

const drawPercentage = computed(() => {
  const total = totalMatches.value
  if (total === 0) return 0
  return Math.round(((profile.value?.stats.draws ?? 0) / total) * 100)
})

// SVG arc calculations for circular chart
const winRateArc = computed(() => {
  return (winPercentage.value / 100) * 314 // 314 is circumference for r=50
})

const lossRateArc = computed(() => {
  return (lossPercentage.value / 100) * 220 // 220 is circumference for r=35
})

const drawRateArc = computed(() => {
  return (drawPercentage.value / 100) * 138 // 138 is circumference for r=22
})

const eloProgress = computed(() => {
  const elo = convexProfile.value?.elo || 1200
  // Map ELO 1000-2000 to 0-100%
  return Math.min(Math.max(((elo - 1000) / 1000) * 100, 0), 100)
})

const activityLevel = computed(() => {
  const total = totalMatches.value
  if (total === 0) return 'New Player'
  if (total < 5) return 'Beginner'
  if (total < 20) return 'Active'
  if (total < 50) return 'Regular'
  return 'Very Active'
})

const activityPercentage = computed(() => {
  const total = totalMatches.value
  return Math.min((total / 50) * 100, 100)
})

const performanceLevel = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'Excellent'
  if (winRate >= 60) return 'Great'
  if (winRate >= 50) return 'Good'
  if (winRate >= 40) return 'Average'
  return 'Learning'
})

const performanceColor = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'text-green-600'
  if (winRate >= 60) return 'text-blue-600'
  if (winRate >= 50) return 'text-yellow-600'
  if (winRate >= 40) return 'text-orange-600'
  return 'text-red-600'
})

const performanceBarClass = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'bg-gradient-to-r from-green-400 to-green-600'
  if (winRate >= 60) return 'bg-gradient-to-r from-blue-400 to-blue-600'
  if (winRate >= 50) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
  if (winRate >= 40) return 'bg-gradient-to-r from-orange-400 to-orange-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
})

// Photo upload functions
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadMessage.value = 'Please select a valid image file.'
      uploadSuccess.value = false
      return
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      uploadMessage.value = 'File size must be less than 5MB.'
      uploadSuccess.value = false
      return
    }
    
    selectedFile.value = file
    uploadMessage.value = ''
  }
}

const uploadPhoto = async () => {
  if (!selectedFile.value || !user.value) return
  
  isUploading.value = true
  uploadMessage.value = ''
  
  try {
    // Here you would typically upload to a cloud service like Cloudinary, AWS S3, etc.
    // For now, we'll simulate the upload and use a placeholder
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate upload delay
    
    // In a real implementation, you'd get the uploaded image URL and update the user profile
    // const imageUrl = await uploadToCloudService(selectedFile.value)
    // await updateUserProfilePicture(imageUrl)
    
    uploadSuccess.value = true
    uploadMessage.value = 'Photo uploaded successfully!'
    
    // Close modal after successful upload
    setTimeout(() => {
      showPhotoUploadModal.value = false
      selectedFile.value = null
      uploadMessage.value = ''
    }, 1500)
    
  } catch (error) {
    uploadSuccess.value = false
    uploadMessage.value = 'Failed to upload photo. Please try again.'
    console.error('Photo upload error:', error)
  } finally {
    isUploading.value = false
  }
}
</script>
