<template>
  <section class="space-y-16 pb-12">
    <div class="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
      <div class="relative overflow-hidden rounded-4xl border border-white/60 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
        <div class="absolute -right-10 top-10 h-40 w-40 rounded-full bg-[#ffaa00]/30 blur-2xl"></div>
        <div class="absolute -bottom-10 left-20 h-44 w-44 rounded-full bg-[#021d94]/30 blur-2xl"></div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/80">Exclusive for Ateneo de Naga</p>
        <h1 class="mt-6 text-4xl font-bold leading-snug text-slate-900 sm:text-5xl">
          Chess battle for the
          <span class="bg-gradient-to-r from-[#021d94] via-[#021d94] to-[#ffaa00] bg-clip-text text-transparent">
            Ateneo de Naga Community
          </span>
        </h1>
        <p class="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Queue into luminous arenas, tackle brain-tingling puzzles, and climb the collegiate leaderboards built exclusively for Ateneans. Everything feels fast, fluid, and just a touch magical.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <NuxtLink
            to="/play"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#021d94]/25 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span>Find a Match</span>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 10h7M10 5l5 5-5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/modes"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-[#021d94]/30 bg-white/70 px-6 py-3 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/50 hover:bg-white"
          >
            Explore Modes
          </NuxtLink>
          <NuxtLink
            to="/leaderboard"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-[#021d94]/10 px-6 py-3 text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/30"
          >
            View Leaderboards
          </NuxtLink>
        </div>
        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <div
            v-for="stat in heroStats"
            :key="stat.label"
            class="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 text-slate-700 shadow-inner"
          >
            <p class="text-2xl font-semibold text-[#021d94]">{{ stat.value }}</p>
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ stat.label }}</p>
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#021d94]/20 blur-2xl"></div>
        <div class="absolute -right-8 bottom-0 h-28 w-28 rounded-full bg-[#ffaa00]/30 blur-2xl"></div>
        <div class="relative grid gap-5">
          <div
            v-for="card in highlightCards"
            :key="card.title"
            class="group relative overflow-hidden rounded-4xl border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div class="absolute -top-24 right-0 h-48 w-48 rounded-full opacity-10 blur-3xl" :class="card.accent"></div>
            <div class="flex items-center gap-3">
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold uppercase tracking-wide text-white shadow"
                :class="card.tint"
              >
                {{ card.icon }}
              </span>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{{ card.tag }}</p>
            </div>
            <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ card.title }}</h3>
            <p class="mt-2 text-sm text-slate-600">{{ card.desc }}</p>
            <div class="mt-4 flex items-center gap-2 text-sm font-semibold text-[#021d94]">
              <span>{{ card.cta }}</span>
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 10h7M10 5l5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-4xl border border-white/70 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/80">Spotlight modes</p>
          <h2 class="mt-2 text-3xl font-semibold text-slate-900">Choose your arena vibe</h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="mode in spotlightModes"
            :key="mode.key"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
            :class="
              activeMode === mode.key
                ? 'border-transparent bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white shadow-lg shadow-[#021d94]/20'
                : 'border-white/70 bg-white/40 text-[#021d94] hover:border-[#021d94]/40 hover:bg-white'
            "
            @mouseenter="activeMode = mode.key"
            @focus="activeMode = mode.key"
          >
            <span class="text-xs font-bold uppercase tracking-wide">{{ mode.tag }}</span>
            <span>{{ mode.title }}</span>
          </button>
        </div>
      </div>
      <div class="mt-8 grid gap-8 md:grid-cols-[1.2fr,0.8fr]">
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <p class="text-sm font-semibold uppercase tracking-wide text-[#021d94]">{{ activeModeData?.headline }}</p>
          <h3 class="mt-3 text-2xl font-semibold text-slate-900">{{ activeModeData?.summary }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ activeModeData?.description }}</p>
          <ul class="mt-5 grid gap-4 sm:grid-cols-2">
            <li
              v-for="highlight in activeModeData?.highlights ?? []"
              :key="highlight"
              class="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600"
            >
              <span class="mt-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00]"></span>
              <span>{{ highlight }}</span>
            </li>
          </ul>
        </div>
        <div class="grid gap-4">
          <div class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Upcoming club events</p>
            <ul class="mt-4 space-y-4 text-sm text-slate-600">
              <li v-for="event in upcomingEvents" :key="event.title" class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-slate-800">{{ event.title }}</p>
                  <p class="text-xs uppercase tracking-wide text-slate-500">{{ event.detail }}</p>
                </div>
                <span class="rounded-full bg-[#021d94]/10 px-3 py-1 text-xs font-semibold text-[#021d94]">{{ event.when }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded-3xl border border-white/60 bg-gradient-to-br from-white/70 via-white/40 to-white/20 p-6 shadow-inner">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Trending opponents</p>
            <div class="mt-4 grid gap-3 text-sm text-slate-600">
              <div v-for="rival in trendingRivals" :key="rival.handle" class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-slate-800">{{ rival.name }}</p>
                  <p class="text-xs uppercase tracking-wide text-slate-500">{{ rival.department }}</p>
                </div>
                <span class="rounded-full bg-[#ffaa00]/10 px-3 py-1 text-xs font-semibold text-[#021d94]">{{ rival.handle }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-8">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-900">Quick links across the campus hub</h2>
          <p class="text-sm text-slate-600">Browse features wrapped in frosted, bubbly panels.</p>
        </div>
        <NuxtLink
          to="/faq"
          class="inline-flex items-center gap-2 rounded-full border border-[#021d94]/20 bg-white/60 px-5 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:bg-white"
        >
          Need help?
        </NuxtLink>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MenuLink
          v-for="link in featureLinks"
          :key="link.to"
          :to="link.to"
          :title="link.title"
          :desc="link.desc"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MenuLink from '~/components/MenuLink.vue'

type HeroStat = {
  label: string
  value: string
}

type HighlightCard = {
  title: string
  desc: string
  cta: string
  icon: string
  tag: string
  accent: string
  tint: string
}

type SpotlightMode = {
  key: string
  title: string
  tag: string
  headline: string
  summary: string
  description: string
  highlights: string[]
}

type EventItem = {
  title: string
  detail: string
  when: string
}

type Rival = {
  name: string
  handle: string
  department: string
}

type FeatureLink = {
  to: string
  title: string
  desc: string
}

const heroStats: readonly HeroStat[] = [
  { label: 'Players Online', value: '128' },
  { label: 'Daily Matches', value: '342' },
  { label: 'Tournament Slots', value: '12' },
]

const highlightCards: readonly HighlightCard[] = [
  {
    title: 'Adaptive Elo Boards',
    desc: 'Watch rankings refract in real-time as every campus duel resolves.',
    cta: 'See the momentum',
    icon: 'ELO',
    tag: 'Live data',
    accent: 'bg-[#021d94]/35',
    tint: 'bg-[#021d94]/90'
  },
  {
    title: 'AI Coach: Bishop Bias',
    desc: 'Break down openings, scan tactics, and receive playful nudges mid-match.',
    cta: 'Summon the coach',
    icon: 'AI',
    tag: 'Smart assist',
    accent: 'bg-[#ffaa00]/45',
    tint: 'bg-[#ffaa00]/80'
  },
  {
    title: 'Puzzle Rush Aurora',
    desc: 'Glassy streaks guide you through escalating combinations and trick shots.',
    cta: 'Enter the streak',
    icon: 'PZL',
    tag: 'Arcade',
    accent: 'bg-[#021d94]/30',
    tint: 'bg-[#021d94]/70'
  },
]

const spotlightModes: readonly SpotlightMode[] = [
  {
    key: 'gauntlet',
    title: 'Arena Gauntlet',
    tag: 'Live',
    headline: 'Lightning-fast queues',
    summary: 'Continuous matchmaking that keeps the adrenaline flowing.',
    description:
      'Opt into a rolling arena where matches snap into place with minimal downtime. Perfect for testing new prep or grinding your Elo curve.',
    highlights: [
      'Seamless auto-rematch when both players opt in',
      'Momentum boosts give bonus points for streaks',
      'Spectator rail with real-time emoji reactions',
      'Integrated voice notes for post-game reflections'
    ]
  },
  {
    key: 'skirmish',
    title: 'Skirmish Teams',
    tag: 'Co-op',
    headline: 'Squad-based rivalries',
    summary: 'Form alliances with classmates and tag-team against other faculties.',
    description:
      'Queue up with your course-mates, rotate boards mid-game, and strategise in shared team rooms with glassy overlays.',
    highlights: [
      'Faculty vs. faculty ladders with seasonal resets',
      'Dynamic board handoffs after each phase',
      'Shared notebook that saves annotated lines',
      'Weekly scrimmages streamed on campus screens'
    ]
  },
  {
    key: 'zen',
    title: 'Zen Puzzles',
    tag: 'Solo',
    headline: 'Calm, meditative drills',
    summary: 'Immerse in chilled ambient puzzles with adaptive difficulty.',
    description:
      'Slow down with curated situational drills, each wrapped in soft gradients and gentle soundscapes generated for focus.',
    highlights: [
      'Adaptive rating tracks your improvements',
      'Timer-free mode with optional guidance',
      'Ambient soundtrack that syncs to puzzle tension',
      'Shareable puzzle playlists for your club'
    ]
  }
]

const upcomingEvents: readonly EventItem[] = [
  { title: 'Intrams Finals', detail: 'Main Arena - Board 1 spotlight', when: 'Fri 7 PM' },
  { title: 'Coach Iris Workshop', detail: 'CS Lab - Tactical visualisation', when: 'Sun 2 PM' },
  { title: 'Freshmen Blitz Draft', detail: 'Student Lounge - 5+0 Swiss', when: 'Wed 5 PM' },
]

const trendingRivals: readonly Rival[] = [
  { name: 'Mara Sison', handle: '@marasison', department: 'AB PolSci' },
  { name: 'Gio Franco', handle: '@giofranco', department: 'BS IT' },
  { name: 'Luis Tan', handle: '@luistan', department: 'BSBA Finance' },
]

const featureLinks: readonly FeatureLink[] = [
  { to: '/play', title: 'Play AdNU Chess!', desc: 'Bot, fellow Atenean, or AI Coach' },
  { to: '/modes', title: 'Extra Modes', desc: 'PuzzleNida, Battle Royale, QuizMania' },
  { to: '/account', title: 'Account', desc: 'Profile, roles, preferences' },
  { to: '/leaderboard', title: 'Leaderboards', desc: 'Elo tiers and departments' },
  { to: '/faq', title: 'FAQs', desc: 'Rules & help center' },
  { to: '/settings', title: 'Settings', desc: 'Chat filter & more' }
]

const activeMode = ref(spotlightModes[0]?.key ?? '')

const activeModeData = computed(() => spotlightModes.find((mode) => mode.key === activeMode.value))
</script>

