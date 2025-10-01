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

            <!-- NEW: Role pill / link -->
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
            <!-- /NEW -->
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { api } from '@/convex/_generated/api' // if '~' alias complains, use '@/'
const { $convex } = useNuxtApp()

const { user, refresh } = useAuth()

onMounted(async () => {
  if (!user.value) await refresh()
  if (user.value) {
    // NEW: fetch Convex profile to get role (and elo if you want later)
    convexProfile.value = await $convex.query(api.profiles.getByUserId, {
      userId: user.value.id,
    })
  }
})

const profile = computed(() => user.value)

// NEW: Convex profile + role pill text
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
  const { wins, losses, draws } = profile.value.stats
  return wins + losses + draws
})

const achievements = computed(() => profile.value?.achievements ?? [])
const badges = computed(() => profile.value?.badges ?? [])
</script>
