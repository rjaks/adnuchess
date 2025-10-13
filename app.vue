<template>
  <div
    class="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#021d94]/15 via-[#021d94]/5 to-[#ffaa00]/15 text-slate-800"
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
      <div class="mx-auto relative flex h-20 max-w-6xl items-center justify-between px-4">
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
          class="hidden md:flex md:h-auto md:items-center md:gap-1 md:rounded-full md:border-transparent md:bg-white/40 md:px-2 md:py-1 md:shadow-sm"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :class="linkClass(item.to)"
            @click="closeMenu"
          >
            {{ item.label }}
          </NuxtLink>

          <!-- Search Button -->
          <button
            v-if="isLoggedIn"
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/70 hover:text-[#021d94]"
            @click="openSearchModal"
            aria-label="Search players"
            title="Search players"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          <div
            v-if="isLoggedIn"
            class="relative flex flex-col gap-2 md:flex-row md:items-center md:gap-2"
          >
            <div class="relative">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/60 hover:bg-white md:w-auto"
                @click="toggleProfileDropdown"
                :aria-expanded="isProfileDropdownOpen"
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
                <svg
                  class="h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-180': isProfileDropdownOpen }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="isProfileDropdownOpen"
                  class="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[200px] rounded-2xl border border-white/70 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
                >
                  <NuxtLink
                    to="/account"
                    class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/70 hover:text-[#021d94]"
                    @click="closeProfileDropdown"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </NuxtLink>
                  
                  <button
                    v-if="isAdmin"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/70 hover:text-[#021d94]"
                    @click="handleAdminAccess"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                    Admin Panel
                  </button>

                  <div class="my-2 h-px bg-slate-200"></div>
                  
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    @click="handleLogout"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </Transition>

              <!-- Backdrop for mobile -->
              <Transition name="fade">
                <div
                  v-if="isProfileDropdownOpen"
                  class="fixed inset-0 z-40 md:hidden"
                  @click="closeProfileDropdown"
                />
              </Transition>
            </div>
          </div>
          <NuxtLink
            v-else
            to="/welcome"
            class="w-full rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-2 text-center text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60 hover:bg-white md:w-auto"
            @click="closeMenu"
          >
            Sign in
          </NuxtLink>
        </nav>
        <Transition name="fade">
          <div
            v-if="isMenuOpen"
            class="fixed inset-0 z-30 bg-white/80 backdrop-blur-sm md:hidden"
            @click="closeMenu"
          />
        </Transition>
        <Transition name="mobile-nav">
          <nav
            v-if="isMenuOpen"
            class="md:hidden absolute left-4 right-4 top-[calc(100%+0.75rem)] z-40 flex flex-col gap-3 rounded-3xl border border-white/70 bg-white p-4 shadow-xl backdrop-blur-xl"
          >
            <NuxtLink
              v-for="item in navItems"
              :key="'mobile-' + item.to"
              :to="item.to"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              :class="[linkClass(item.to), 'w-full text-left']"
              @click="closeMenu"
            >
              {{ item.label }}
            </NuxtLink>

            <!-- Mobile Search Button -->
            <button
              v-if="isLoggedIn"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-[#021d94]"
              @click="openSearchModal"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Search Players
            </button>

            <div v-if="isLoggedIn" class="flex flex-col gap-3 pt-1">
              <NuxtLink
                to="/account"
                class="flex w-full items-center gap-3 rounded-2xl border border-[#021d94]/30 bg-white px-4 py-3 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/60 hover:bg-white"
                @click="closeMenu"
              >
                <span
                  v-if="authUser?.picture"
                  class="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/70 bg-white/60 shadow-sm"
                >
                  <img :src="authUser.picture" :alt="authUserName" class="h-full w-full object-cover" />
                </span>
                <span
                  v-else
                  class="grid h-9 w-9 place-items-center rounded-full bg-[#021d94]/15 text-sm font-bold uppercase text-[#021d94]"
                >
                  {{ authUserInitials }}
                </span>
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile</span>
              </NuxtLink>
              
              <button
                v-if="isAdmin"
                type="button"
                class="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white px-4 py-3 text-sm font-semibold text-[#021d94] transition hover:bg-white/80"
                @click="handleAdminAccess"
              >
                <div class="grid h-9 w-9 place-items-center rounded-full bg-[#021d94]/15 text-[#021d94]">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                </div>
                <span>Admin Panel</span>
              </button>
              
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                @click="handleLogout"
              >
                <div class="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-600">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span>Sign out</span>
              </button>
            </div>
            <NuxtLink
              v-else
              to="/welcome"
              class="w-full rounded-2xl border border-[#021d94]/30 bg-white px-4 py-3 text-center text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60 hover:bg-white"
              @click="closeMenu"
            >
              Sign in
            </NuxtLink>
          </nav>
        </Transition>
      </div>
    </header>
    <main id="main-content" class="relative mx-auto flex-1 max-w-6xl px-4 pb-24 pt-12">
      <div class="pointer-events-none absolute inset-x-[-40vw] top-[-10vw] -z-10 h-[50vw] rounded-[40%] bg-gradient-to-br from-white/70 via-transparent to-white/20 blur-3xl"></div>
      <NuxtPage />
    </main>
    <footer class="border-t border-white/40 bg-white/60 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl items-center justify-center px-4 py-6">
        <p class="flex items-center gap-2 text-sm text-slate-600">
          <span>Made with</span>
          <span class="inline-flex h-5 w-5 items-center justify-center text-[#ff4d6d]" aria-hidden="true">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </span>
          <span class="sr-only">love</span>
          <span>by</span>
          <span class="font-semibold text-[#021d94]">IMissYou</span>
          <span class="font-semibold text-[#021d94]">Copyright &copy; 2025</span>
        </p>
      </div>
    </footer>

    <!-- Player Search Modal -->
    <PlayerSearchModal :is-open="isSearchModalOpen" @close="closeSearchModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { navigateTo, useFetch, useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '~/composables/useAuth'

// Set favicon and COOP headers for all pages
useHead({
  title: 'ADNU Chess Arena',
  meta: [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { 'http-equiv': 'Cross-Origin-Opener-Policy', content: 'same-origin-allow-popups' },
    { 'http-equiv': 'Cross-Origin-Embedder-Policy', content: 'unsafe-none' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/adnuchesslogo.png' },
    { rel: 'shortcut icon', href: '/adnuchesslogo.png' },
    { rel: 'apple-touch-icon', href: '/adnuchesslogo.png' }
  ]
})

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
const isSearchModalOpen = ref(false)
const isProfileDropdownOpen = ref(false)

const closeMenu = () => {
  isMenuOpen.value = false
}

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false
}

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}

const openSearchModal = () => {
  isSearchModalOpen.value = true
  closeMenu() // Close mobile menu if open
}

const closeSearchModal = () => {
  isSearchModalOpen.value = false
}
const route = useRoute()
const currentPath = computed(() => route.path)
const pointer = ref<PointerState>({ x: 720, y: 360 })

const hideHeaderPaths = ['/welcome', '/login'] as const

const showHeader = computed(() => !hideHeaderPaths.some((path) => currentPath.value.startsWith(path)))


const { user: authUser, refresh, logout } = useAuth()

// On server-side, try to get auth state for proper SSR
if (process.server) {
  try {
    await refresh()
  } catch (error) {
    // Ignore server-side auth errors
    console.debug('Server-side auth refresh failed:', error)
  }
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

// Admin authorization check
const isAdmin = computed(() => {
  // Authorized ADNU personnel emails
  const adminEmails = [
    'lojenar@gbox.adnu.edu.ph', // Your email
    // Add other authorized ADNU admin emails here as needed
    // 'admin@gbox.adnu.edu.ph',
    // 'it.admin@gbox.adnu.edu.ph',
    // 'faculty.admin@gbox.adnu.edu.ph'
  ]
  return authUser.value && adminEmails.includes(authUser.value.email)
})

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
  closeMenu()
  closeProfileDropdown()
  await navigateTo('/welcome')
}

const handleAdminAccess = () => {
  closeProfileDropdown()
  closeMenu()
  navigateTo('/admin')
}

onMounted(() => {
  pointer.value = { x: window.innerWidth / 2, y: window.innerHeight / 3 }
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
})

watch(
  () => route.fullPath,
  () => {
    closeMenu()
    closeProfileDropdown()
  }
)
</script>













<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}
</style>

