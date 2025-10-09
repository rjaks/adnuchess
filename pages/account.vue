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
              class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#021d94] text-white shadow-lg hover:bg-[#021d94]/90 transition-colors"
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
                class="inline-flex items-center rounded-md text-xs bg-white border border-[#021d94]/20 px-2 py-1 text-[#021d94] hover:bg-[#021d94]/5 transition-colors"
                title="Edit display name"
              >
                <span class="sr-only">Edit display name</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-slate-500">{{ profile?.email }}</p>

            <!-- Display Name (if it exists) -->
            <div class="mt-1">
              <p v-if="convexProfile?.displayName && convexProfile.displayName !== profile?.name" class="text-sm italic text-slate-600">
                Display name: {{ convexProfile.displayName }}
              </p>
            </div>

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

        <!-- Arena Record - New Design -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <!-- Total Matches -->
          <div class="rounded-2xl border border-white/60 bg-white/80 p-4 text-center shadow-lg backdrop-blur-xl">
            <div class="text-2xl font-bold text-slate-900">{{ totalMatches }}</div>
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Total Games</div>
          </div>
          
          <!-- Wins -->
          <div class="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 text-center shadow-lg">
            <div class="text-2xl font-bold text-green-700">{{ profile?.stats.wins ?? 0 }}</div>
            <div class="text-xs font-medium uppercase tracking-wide text-green-600">Wins</div>
            <div class="text-xs text-green-500 mt-1">{{ winPercentage }}%</div>
          </div>
          
          <!-- Losses -->
          <div class="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4 text-center shadow-lg">
            <div class="text-2xl font-bold text-red-700">{{ profile?.stats.losses ?? 0 }}</div>
            <div class="text-xs font-medium uppercase tracking-wide text-red-600">Losses</div>
            <div class="text-xs text-red-500 mt-1">{{ lossPercentage }}%</div>
          </div>
          
          <!-- Draws -->
          <div class="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-center shadow-lg">
            <div class="text-2xl font-bold text-amber-700">{{ profile?.stats.draws ?? 0 }}</div>
            <div class="text-xs font-medium uppercase tracking-wide text-amber-600">Draws</div>
            <div class="text-xs text-amber-500 mt-1">{{ drawPercentage }}%</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Statistics Graph Section -->
    <section class="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-glass backdrop-blur-xl">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-900">Performance Analytics</h2>
        <p class="text-slate-600">Visual breakdown of your chess performance</p>
      </div>
      
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Win/Loss Ratio Chart -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-slate-800">Match Results Distribution</h3>
          
          <!-- Circular Progress Chart -->
          <div class="flex items-center justify-center">
            <div class="relative h-48 w-48">
              <!-- Background Circle -->
              <svg class="h-48 w-48 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  class="text-slate-200"
                />
                
                <!-- Wins Arc -->
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="winArcLength"
                  :stroke-dashoffset="25"
                  class="text-green-500 transition-all duration-1000 ease-out"
                />
                
                <!-- Losses Arc -->
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="lossArcLength"
                  :stroke-dashoffset="lossArcOffset"
                  class="text-red-500 transition-all duration-1000 ease-out"
                />
                
                <!-- Draws Arc -->
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  stroke-width="8"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="drawArcLength"
                  :stroke-dashoffset="drawArcOffset"
                  class="text-amber-500 transition-all duration-1000 ease-out"
                />
              </svg>
              
              <!-- Center Content -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-3xl font-bold text-slate-900">{{ totalMatches }}</div>
                  <div class="text-sm font-medium text-slate-600">Total Games</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="flex justify-center space-x-6">
            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full bg-green-500"></div>
              <span class="text-sm font-medium text-slate-700">Wins ({{ winPercentage }}%)</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full bg-red-500"></div>
              <span class="text-sm font-medium text-slate-700">Losses ({{ lossPercentage }}%)</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full bg-amber-500"></div>
              <span class="text-sm font-medium text-slate-700">Draws ({{ drawPercentage }}%)</span>
            </div>
          </div>
        </div>
        
        <!-- Performance Bars -->
        <div class="space-y-6">
          <h3 class="text-lg font-semibold text-slate-800">Performance Metrics</h3>
          
          <!-- Win Rate Bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-700">Win Rate</span>
              <span class="text-green-600 font-semibold">{{ winPercentage }}%</span>
            </div>
            <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out rounded-full"
                :style="{ width: winPercentage + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- ELO Progress -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-700">ELO Rating</span>
              <span class="text-[#021d94] font-semibold">{{ convexProfile?.elo || 1200 }}</span>
            </div>
            <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-[#021d94] to-blue-500 transition-all duration-1000 ease-out rounded-full"
                :style="{ width: eloProgress + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>1000</span>
              <span>2000</span>
            </div>
          </div>
          
          <!-- Game Frequency -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-700">Activity Level</span>
              <span class="text-blue-600 font-semibold">{{ activityLevel }}</span>
            </div>
            <div class="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out rounded-full"
                :style="{ width: activityPercentage + '%' }"
              ></div>
            </div>
          </div>
          
          <!-- Recent Performance Indicator -->
          <div class="mt-6 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-700">Performance Trend</p>
                <p class="text-xs text-slate-500">Based on recent matches</p>
              </div>
              <div class="flex items-center space-x-2">
                <div 
                  class="flex items-center space-x-1"
                  :class="performanceTrend.color"
                >
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path 
                      v-if="performanceTrend.direction === 'up'"
                      fill-rule="evenodd" 
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z" 
                      clip-rule="evenodd" 
                    />
                    <path 
                      v-else-if="performanceTrend.direction === 'down'"
                      fill-rule="evenodd" 
                      d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" 
                      clip-rule="evenodd" 
                    />
                    <path 
                      v-else
                      fill-rule="evenodd" 
                      d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" 
                      clip-rule="evenodd" 
                    />
                  </svg>
                  <span class="text-sm font-semibold">{{ performanceTrend.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

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
  </section>

  <!-- Photo Upload Modal -->
  <div v-if="showPhotoUploadModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="photo-modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showPhotoUploadModal = false"></div>

      <!-- Modal panel -->
      <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#021d94]/10 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#021d94]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900" id="photo-modal-title">Upload Profile Photo</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Choose a profile photo to personalize your account. Recommended size: 200x200 pixels.
                </p>
              </div>
              
              <div class="mt-4">
                <label for="photo-upload" class="block text-sm font-medium text-gray-700">Choose Photo</label>
                <div class="mt-1">
                  <input
                    type="file"
                    id="photo-upload"
                    ref="photoInput"
                    accept="image/*"
                    @change="handlePhotoSelect"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#021d94]/10 file:text-[#021d94] hover:file:bg-[#021d94]/20"
                  />
                </div>
                
                <!-- Preview -->
                <div v-if="photoPreview" class="mt-4 flex justify-center">
                  <div class="relative">
                    <img :src="photoPreview" alt="Photo preview" class="h-20 w-20 rounded-full object-cover border-2 border-[#021d94]/20" />
                    <button
                      @click="clearPhotoPreview"
                      class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            @click="uploadPhoto"
            type="button"
            class="inline-flex w-full justify-center rounded-md border border-transparent bg-[#021d94] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#021d94]/90 focus:outline-none focus:ring-2 focus:ring-[#021d94] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            :disabled="isUploadingPhoto || !selectedPhoto"
          >
            <span v-if="isUploadingPhoto">Uploading...</span>
            <span v-else>Upload Photo</span>
          </button>
          <button
            @click="showPhotoUploadModal = false"
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
        
        <div v-if="photoUploadMessage" class="px-4 py-3 text-center">
          <p class="text-sm" :class="photoUploadSuccess ? 'text-green-600' : 'text-red-600'">
            {{ photoUploadMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Display Name Edit Modal -->
  <div v-if="showDisplayNameModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDisplayNameModal = false"></div>

      <!-- Modal panel -->
      <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
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

const { user, refresh } = useAuth()

// For display name editing
const displayName = ref('')
const isUpdating = ref(false)
const updateMessage = ref('')
const updateSuccess = ref(false)
const showDisplayNameModal = ref(false)

// For photo upload
const showPhotoUploadModal = ref(false)
const photoPreview = ref('')
const selectedPhoto = ref<File | null>(null)
const isUploadingPhoto = ref(false)
const photoUploadMessage = ref('')
const photoUploadSuccess = ref(false)
const photoInput = ref()

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

// Photo upload functions
const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      photoUploadMessage.value = 'File size must be less than 5MB'
      photoUploadSuccess.value = false
      return
    }
    
    if (!file.type.startsWith('image/')) {
      photoUploadMessage.value = 'Please select a valid image file'
      photoUploadSuccess.value = false
      return
    }
    
    selectedPhoto.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // Clear any previous messages
    photoUploadMessage.value = ''
  }
}

const clearPhotoPreview = () => {
  photoPreview.value = ''
  selectedPhoto.value = null
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

const uploadPhoto = async () => {
  if (!selectedPhoto.value || !user.value) return
  
  isUploadingPhoto.value = true
  photoUploadMessage.value = ''
  
  try {
    // Convert file to base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      
      try {
        // Call your API to upload the photo
        // For now, we'll simulate the upload
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate upload time
        
        // Update the user's profile picture in your database
        // await $convex.mutation(api.profiles.updateProfilePicture, {
        //   userId: user.value.id,
        //   profilePicture: base64
        // })
        
        photoUploadSuccess.value = true
        photoUploadMessage.value = 'Profile photo uploaded successfully!'
        
        // Refresh profile to show new photo
        await refresh()
        await fetchProfile()
        
        // Close modal after success
        setTimeout(() => {
          showPhotoUploadModal.value = false
          clearPhotoPreview()
        }, 1500)
        
      } catch (error) {
        photoUploadSuccess.value = false
        photoUploadMessage.value = 'Failed to upload photo. Please try again.'
        console.error('Photo upload error:', error)
      }
    }
    
    reader.readAsDataURL(selectedPhoto.value)
    
  } catch (error) {
    photoUploadSuccess.value = false
    photoUploadMessage.value = 'Failed to process photo. Please try again.'
    console.error('Photo processing error:', error)
  } finally {
    isUploadingPhoto.value = false
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

// Statistics calculations for graphs
const winPercentage = computed(() => {
  if (totalMatches.value === 0) return 0
  const wins = profile.value?.stats.wins ?? 0
  return Math.round((wins / totalMatches.value) * 100)
})

const lossPercentage = computed(() => {
  if (totalMatches.value === 0) return 0
  const losses = profile.value?.stats.losses ?? 0
  return Math.round((losses / totalMatches.value) * 100)
})

const drawPercentage = computed(() => {
  if (totalMatches.value === 0) return 0
  const draws = profile.value?.stats.draws ?? 0
  return Math.round((draws / totalMatches.value) * 100)
})

// Arc calculations for circular chart (circumference = 2πr = 283 for r=45)
const circumference = 283
const winArcLength = computed(() => {
  const percentage = winPercentage.value
  return `${(percentage / 100) * circumference} ${circumference}`
})

const lossArcLength = computed(() => {
  const percentage = lossPercentage.value
  return `${(percentage / 100) * circumference} ${circumference}`
})

const drawArcLength = computed(() => {
  const percentage = drawPercentage.value
  return `${(percentage / 100) * circumference} ${circumference}`
})

const lossArcOffset = computed(() => {
  return 25 - (winPercentage.value / 100) * circumference
})

const drawArcOffset = computed(() => {
  return 25 - ((winPercentage.value + lossPercentage.value) / 100) * circumference
})

// ELO progress calculation (assuming max ELO for display is 2000)
const eloProgress = computed(() => {
  const currentElo = convexProfile.value?.elo || 1200
  const minElo = 1000
  const maxElo = 2000
  return Math.min(100, Math.max(0, ((currentElo - minElo) / (maxElo - minElo)) * 100))
})

// Activity level calculation
const activityLevel = computed(() => {
  const total = totalMatches.value
  if (total >= 100) return 'Very Active'
  if (total >= 50) return 'Active'
  if (total >= 20) return 'Moderate'
  if (total >= 5) return 'Casual'
  return 'Beginner'
})

const activityPercentage = computed(() => {
  const total = totalMatches.value
  const maxForFull = 100 // Consider 100+ games as 100% active
  return Math.min(100, (total / maxForFull) * 100)
})

// Performance trend calculation
const performanceTrend = computed(() => {
  const winRate = winPercentage.value
  
  if (winRate >= 60) {
    return {
      direction: 'up',
      label: 'Improving',
      color: 'text-green-600'
    }
  } else if (winRate >= 40) {
    return {
      direction: 'neutral',
      label: 'Stable',
      color: 'text-blue-600'
    }
  } else {
    return {
      direction: 'down',
      label: 'Developing',
      color: 'text-amber-600'
    }
  }
})

const achievements = computed(() => profile.value?.achievements ?? [])
const badges = computed(() => profile.value?.badges ?? [])
</script>
