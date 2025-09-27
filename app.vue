<template>
  <div
    class="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#021d94]/15 via-[#021d94]/5 to-[#ffaa00]/15 text-slate-800"
  >
    <div class="pointer-events-none fixed inset-0 -z-30 opacity-80">
      <div class="absolute left-[5%] top-[12%] h-72 w-72 rounded-full bg-[#021d94]/30 blur-3xl"></div>
      <div class="absolute right-[8%] top-[38%] h-96 w-96 rounded-full bg-[#ffaa00]/40 blur-3xl"></div>
      <div class="absolute bottom-[-10%] left-1/3 h-80 w-80 rounded-full bg-[#021d94]/20 blur-3xl"></div>
    </div>
    <div
      class="pointer-events-none fixed inset-0 -z-20 transition duration-500"
      :style="spotlightStyle"
    ></div>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
    >
      Skip to main content
    </a>
    <header v-if="showHeader" class="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl">
      <div class="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <NuxtLink to="/" class="flex items-center gap-3 font-semibold text-lg text-slate-700">
          <span
            class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-glass"
          >
            <img
              src="/adnuchesslogo.png"
              alt="AdNU Chess logo"
              class="h-10 w-10 object-contain drop-shadow"
              loading="lazy"
            />
          </span>
          <span class="flex flex-col leading-tight">
            <span class="text-sm uppercase tracking-widest text-slate-500">AdNU</span>
            <span class="text-xl font-extrabold text-[#021d94]">Chess Arena</span>
          </span>
        </NuxtLink>
        <button
          class="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white md:hidden"
          type="button"
          @click="isMenuOpen = !isMenuOpen"
          :aria-expanded="isMenuOpen"
          aria-label="Toggle navigation"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
            <path
              v-if="!isMenuOpen"
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              v-else
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <nav
          class="absolute inset-x-4 top-[calc(100%+0.75rem)] mx-auto rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl transition md:static md:inset-auto md:mx-0 md:flex md:h-auto md:items-center md:gap-1 md:rounded-full md:border-transparent md:bg-white/40 md:px-2 md:py-1 md:shadow-sm"
          :class="isMenuOpen ? 'grid gap-3' : 'hidden md:flex'"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :class="linkClass(item.to)"
            @click="isMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink
            to="/play"
            class="md:ml-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#021d94]/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            @click="isMenuOpen = false"
          >
            Play Now
          </NuxtLink>
          <div
            v-if="isLoggedIn"
            class="flex flex-col gap-2 md:flex-row md:items-center md:gap-2"
          >
            <NuxtLink
              to="/account"
              class="flex w-full items-center justify-between gap-3 rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/60 hover:bg-white md:w-auto"
              @click="isMenuOpen = false"
            >
              <span class="flex items-center gap-3">
                <span
                  v-if="authUser?.picture"
                  class="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-white/70 bg-white/60 shadow-sm"
                >
                  <img :src="authUser.picture" :alt="authUserName" class="h-full w-full object-cover" />
                </span>
                <span
                  v-else
                  class="grid h-8 w-8 place-items-center rounded-full bg-[#021d94]/15 text-xs font-bold uppercase text-[#021d94]"
                >
                  {{ authUserInitials }}
                </span>
                <span>{{ authUserName }}</span>
              </span>
              <span class="text-xs uppercase tracking-wide text-[#021d94]/70">Profile</span>
            </NuxtLink>
            <button
              type="button"
              class="w-full rounded-full border border-transparent bg-[#021d94]/10 px-4 py-2 text-sm font-semibold text-[#021d94] transition hover:bg-[#021d94]/15 md:w-auto"
              @click="handleLogout"
            >
              Sign out
            </button>
          </div>
          <NuxtLink
            v-else
            to="/welcome"
            class="w-full rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-2 text-center text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60 hover:bg-white md:w-auto"
            @click="isMenuOpen = false"
          >
            Sign in
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main id="main-content" class="relative mx-auto max-w-6xl px-4 pb-24 pt-12">
      <div class="pointer-events-none absolute inset-x-[-40vw] top-[-10vw] -z-10 h-[50vw] rounded-[40%] bg-gradient-to-br from-white/70 via-transparent to-white/20 blur-3xl"></div>
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { navigateTo, useFetch, useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '~/composables/useAuth'

type NavigationItem = {
  label: string
  to: string
}

type PointerState = {
  x: number
  y: number
}

const navItems: readonly NavigationItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Leaderboards', to: '/leaderboard' },
  { label: 'Settings', to: '/settings' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Modes', to: '/modes' },
] as const

const isMenuOpen = ref(false)
const route = useRoute()
const currentPath = computed(() => route.path)
const pointer = ref<PointerState>({ x: 720, y: 360 })

const hideHeaderPaths = ['/welcome', '/login'] as const

const showHeader = computed(() => !hideHeaderPaths.some((path) => currentPath.value.startsWith(path)))


const { user: authUser, refresh, logout } = useAuth()
// Preload session on server during SSR using useAsyncData to avoid direct process.server checks
const { data: sessionData } = await useAsyncData('session', () =>
  $fetch<{ user: AuthUser | null }>('/api/auth/session')
)
if (sessionData.value?.user) {
  authUser.value = sessionData.value.user
}

const isActive = (target: string) => {
  if (target === '/') {
    return currentPath.value === '/'
  }

  return currentPath.value.startsWith(target)
}

const linkClass = (target: string) => [
  'px-4 py-2 rounded-full text-sm font-semibold transition duration-150 md:px-3',
  isActive(target)
    ? 'bg-white text-[#021d94] shadow-sm shadow-[#021d94]/10'
    : 'text-slate-600 hover:bg-white/70 hover:text-[#021d94]'
]

const spotlightStyle = computed(() => {
  const { x, y } = pointer.value
  return {
    background: `radial-gradient(600px at ${x}px ${y}px, rgba(255,170,0,0.22), rgba(2,29,148,0.12) 45%, transparent 70%)`
  }
})

const isLoggedIn = computed(() => Boolean(authUser.value))
const authUserName = computed(() => authUser.value?.name || authUser.value?.email || 'AdNU Player')
const authUserInitials = computed(() => {
  if (!authUser.value) {
    return 'AU'
  }
  const source = authUser.value.name || authUser.value.email
  const initials = source
    .split(/[\s@._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('')
  return initials || 'AU'
})

const handlePointerMove = (event: PointerEvent) => {
  pointer.value = { x: event.clientX, y: event.clientY }
}

const handleLogout = async () => {
  await logout()
  isMenuOpen.value = false
  await navigateTo('/welcome')
}

onMounted(() => {
  refresh()
  pointer.value = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
})

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
  }
)
</script>


