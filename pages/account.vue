<template>
  <section class="space-y-10">
    <header class="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-glass backdrop-blur-xl">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
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
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">
              AdNU Player Profile
            </p>
            <h1 class="text-3xl font-bold text-slate-900">{{ profile?.name }}</h1>
            <p class="text-sm text-slate-500">{{ profile?.email }}</p>

            <!-- Display Name (if it exists) -->
            <div class="flex items-center gap-2 mt-1">
              <p v-if="convexProfile?.displayName && convexProfile.displayName !== profile?.name" class="text-sm italic text-slate-600">
                Display name: {{ convexProfile.displayName }}
              </p>
              <button 
                @click="showDisplayNameModal = true" 
                class="inline-flex items-center rounded-md text-xs bg-white border border-[#021d94]/20 px-2 py-1 text-[#021d94] hover:bg-[#021d94]/5"
                title="Edit display name"
              >
                <span class="sr-only">Edit display name</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
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

        <div class="rounded-3xl border border-[#021d94]/20 bg-[#021d94]/10 px-5 py-4 text-sm text-[#021d94]">
          <p class="font-semibold">Arena Record</p>
          <p class="text-xs uppercase tracking-[0.3em] text-[#021d94]/70">{{ totalMatches }} Matches</p>
          <div class="mt-2 flex gap-4 text-xs font-semibold uppercase">
            <span>Wins: {{ profile?.stats.wins ?? 0 }}</span>
            <span>Losses: {{ profile?.stats.losses ?? 0 }}</span>
            <span>Draws: {{ profile?.stats.draws ?? 0 }}</span>
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

    <!-- Profile Settings Section -->
    <section class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Profile Settings</h2>
          <p class="text-sm text-slate-500">Customize how you appear to other players.</p>
        </div>
        <button 
          @click="showDisplayNameModal = true" 
          class="inline-flex items-center rounded-md border border-transparent bg-[#021d94] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#021d94]/90 focus:outline-none focus:ring-2 focus:ring-[#021d94] focus:ring-offset-2"
        >
          Edit Display Name
        </button>
      </div>
      
      <div class="mt-5 space-y-4">
        <div class="rounded-lg bg-white p-4 shadow-sm border border-[#021d94]/10">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-medium text-slate-900">Display Name</h3>
              <p class="text-sm text-slate-500">Shown to other players during matches</p>
            </div>
            <p class="text-sm font-medium text-[#021d94]">
              {{ convexProfile?.displayName || profile?.name || 'Not set' }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </section>

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

const { user, refresh } = useAuth()

// For display name editing
const displayName = ref('')
const isUpdating = ref(false)
const updateMessage = ref('')
const updateSuccess = ref(false)
const showDisplayNameModal = ref(false)

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
</script>
