<template>
  <section class="space-y-16 pb-12">
    <div class="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
      <div class="bubble-card relative overflow-hidden border border-white/60 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
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
            to="/matchmaking"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#021d94]/25 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span>Find Player Match</span>
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
            to="/play"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-[#021d94]/30 bg-white/70 px-6 py-3 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/50 hover:bg-white"
          >
            Play vs AI
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
            class="bubble-card-soft border border-white/70 bg-white/80 px-5 py-4 text-slate-700 shadow-inner"
          >
            <p class="text-2xl font-semibold text-[#021d94]">
              <span v-if="stat.loading">—</span>
              <span v-else>{{ stat.value }}</span>
            </p>
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
            class="bubble-card group relative overflow-hidden border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:shadow-xl"
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
            <NuxtLink
              v-if="card.to"
              :to="card.to"
              class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#021d94] transition hover:translate-x-0.5"
            >
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
            </NuxtLink>
            <div v-else class="mt-4 flex items-center gap-2 text-sm font-semibold text-[#021d94]">
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

    <div class="bubble-card border border-white/70 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/80">Spotlight modes</p>
        <h2 class="text-3xl font-semibold text-slate-900">Pick the mode that fits you</h2>
        <p class="text-sm text-slate-600">Each mode links to its own page—no guessing, no placeholders.</p>
      </div>
      <div class="mt-8 grid gap-6 lg:grid-cols-3">
        <article
          v-for="mode in spotlightModes"
          :key="mode.key"
          class="bubble-card-soft border border-white/70 bg-white/80 p-6 shadow-inner"
        >
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-[#021d94]/10 px-3 py-1 text-xs font-semibold text-[#021d94] uppercase tracking-wide">
              {{ mode.tag }}
            </span>
            <p class="text-xs text-slate-500">{{ mode.headline }}</p>
          </div>
          <h3 class="mt-3 text-xl font-semibold text-slate-900">{{ mode.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ mode.summary }}</p>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li v-for="highlight in mode.highlights.slice(0, 3)" :key="highlight" class="flex items-start gap-2">
              <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00]"></span>
              <span>{{ highlight }}</span>
            </li>
          </ul>
          <NuxtLink
            v-if="mode.to"
            :to="mode.to"
            class="mt-4 inline-flex items-center gap-2 rounded-full border border-[#021d94]/20 bg-white px-4 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/50 hover:bg-white"
          >
            Explore {{ mode.title }}
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <path d="M5 10h7M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
        </article>
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
import { computed } from 'vue'
import MenuLink from '~/components/MenuLink.vue'

type HeroStat = {
  label: string
  value: string | number
  loading?: boolean
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
  to?: string
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

const { data: dashboardStats, pending: statsPending } = await useFetch('/api/dashboard/stats')

const heroStats = computed<HeroStat[]>(() => {
  const stats = dashboardStats.value
  const loading = statsPending.value || !stats
  return [
    { label: 'Players Online', value: stats?.playersOnline ?? 0, loading },
    { label: 'Daily Matches', value: stats?.dailyMatches ?? 0, loading },
    { label: 'Tournament Slots', value: stats?.tournamentSlots ?? 0, loading },
  ]
})

const highlightCards: readonly HighlightCard[] = [
  {
    title: 'Leaderboards',
    desc: 'Watch rankings refract in real-time as every campus duel resolves.',
    cta: 'See the leaderboards',
    icon: 'ELO',
    tag: 'Live data',
    accent: 'bg-[#021d94]/35',
    tint: 'bg-[#021d94]/90',
    to: '/leaderboard'
  },
  {
    title: 'AI Coach: Bishop Bias',
    desc: 'Break down openings, scan tactics, and get beginner-friendly tutorials mid-match.',
    cta: 'Summon the coach',
    icon: 'AI',
    tag: 'Smart assist',
    accent: 'bg-[#ffaa00]/45',
    tint: 'bg-[#ffaa00]/80',
    to: '/training'
  },
  {
    title: 'QuizMania',
    desc: 'Glassy streaks guide you through escalating chess trivia and trick-shot questions.',
    cta: 'Enter QuizMania',
    icon: 'QZ',
    tag: 'Arcade',
    accent: 'bg-[#021d94]/30',
    tint: 'bg-[#021d94]/70',
    to: '/quizmania'
  },
]

const spotlightModes: readonly SpotlightMode[] = [
  {
    key: 'puzzlenida',
    title: 'PuzzleNida',
    tag: 'Puzzle',
    headline: 'Solve pre-built scenarios',
    summary: 'Race against the move limit to crack curated AdNU puzzle boards.',
    description:
      'PuzzleNida! drops you into handcrafted mid-game positions with a clear objective. Plan precise sequences, beat the move cap, and compare streaks with the campus puzzle ladder.',
    highlights: [
      'Pre-arranged boards inspired by collegiate games',
      'Move counter that rewards perfect solutions',
      'Hints unlockable with earned puzzle points',
      'Weekly puzzle packs from club tacticians'
    ],
    to: '/puzzlenida'
  },
  {
    key: 'battle-royale',
    title: 'Battle Royale',
    tag: 'Draft',
    headline: 'Build your army first',
    summary: 'Draft chess pieces, deploy custom lineups, and clash on classic boards.',
    description:
      'Before the first move, alternate drafting queens, rooks, bishops, knights, and pawns to forge your dream roster. Once the timer hits zero, place your pieces and dive into chaotic, strategic battles.',
    highlights: [
      'Snake draft with visibility into your opponent picks',
      'Budget system to balance power selections',
      'Pre-game sandbox to map opening formations',
      'Event-ready scorecards for campus tournaments'
    ]
  },
  {
    key: 'quizmania',
    title: 'QuizMania',
    tag: 'Trivia',
    headline: 'Test your chess knowledge',
    summary: 'Fast-paced quiz bee showdowns covering tactics, history, and theory.',
    description:
      'QuizMania swaps boards for buzzers. Answer timed questions, bet on difficulty tiers, and climb the knowledge ladder alone or with classmates cheering you on.',
    highlights: [
      'Timed rounds with escalating point multipliers',
      'Question banks curated by AdNU coaches',
      'Power-ups to freeze rivals or reveal hints',
      'Seasonal leaderboards for trivia champs'
    ],
    to: '/quizmania'
  }
]
const featureLinks: readonly FeatureLink[] = [
  { to: '/matchmaking', title: 'Player vs Player', desc: 'Real-time matches against fellow Ateneans' },
  { to: '/play', title: 'Play vs AI', desc: 'Challenge Stockfish engine' },
  { to: '/modes', title: 'Extra Modes', desc: 'PuzzleNida, Battle Royale, QuizMania' },
  { to: '/account', title: 'Account', desc: 'Profile, roles, preferences' },
  { to: '/leaderboard', title: 'Leaderboards', desc: 'Elo tiers and departments' },
  { to: '/faq', title: 'FAQs', desc: 'Rules & help center' },
  { to: '/settings', title: 'Settings', desc: 'Chat filter & more' }
]
</script>

<style scoped>
.bubble-card {
  border-radius: 28px;
}

.bubble-card-soft {
  border-radius: 22px;
}
</style>
