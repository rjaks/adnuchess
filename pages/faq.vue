<template>
  <div class="mx-auto max-w-5xl px-4 py-16">
    <header class="mb-12 space-y-3 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">FAQ</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Questions? answered.</h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
        Everything you need to know about signing in, queuing for matches, and keeping the arena running smoothly.
      </p>
    </header>

    <div class="space-y-16">
      <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">Getting started</h2>
        <dl class="grid gap-4">
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">Who can join the AdNU Chess Arena?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              The arena is currently open to Ateneo de Naga University students, faculty, and staff with an active
              <span class="font-semibold">@gbox.adnu.edu.ph</span> Google account. Club officers can request guest access for
              exhibition matches by emailing the moderators.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">How do I sign in?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Head to the welcome page and click <span class="font-semibold">Sign in to play</span>. Approve the Google prompt
              using your ADNU credentials and you'll be redirected back with your profile, rating, and badges ready to go.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">What data are you storing?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              We capture your name, ADNU email, profile photo, and chess activity generated inside the arena (matches, moves,
              ratings, and achievements). Passwords stay with Google&mdash;we never store them.
            </dd>
          </div>
        </dl>
      </section>

      <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">Playing matches</h2>
        <dl class="grid gap-4">
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">Can I practice against Stockfish?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Yes! Switch to <span class="font-semibold">Solo Mode</span> and set the Stockfish strength that fits your skill level.
              Each practice match still counts toward your training stats so you can track improvement.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">How do I challenge classmates?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Use <span class="font-semibold">Matchmaking</span> to queue for rated games or send a direct invite from a player's
              profile. When both players confirm, the match launches instantly with clocks and PGN tracking.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">Do casual games affect my rating?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Casual matches and analysis boards are unrated. Only games started through ranked matchmaking impact your ELO,
              streaks, and leaderboard placement.
            </dd>
          </div>
        </dl>
      </section>

      <section class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-900">Troubleshooting & support</h2>
        <dl class="grid gap-4">
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">My ADNU login isn't recognized.</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Make sure you're using your official <span class="font-semibold">@gbox.adnu.edu.ph</span> account. If you recently
              joined the university, it can take up to 24 hours for our roster sync. Reach out to the moderators if you need
              urgent access for a tournament.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">The board isn't loading or moves lag.</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Refresh the page first. If the issue persists, try a different browser tab or clear cached data for
              <span class="font-semibold">adnuchess.com</span>. Slow campus Wi-Fi can also delay Stockfish responses&mdash;wired
              connections are more stable for events.
            </dd>
          </div>
          <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-glass backdrop-blur">
            <dt class="text-lg font-semibold text-slate-900">Where can I report a bug or request a feature?</dt>
            <dd class="mt-3 text-sm text-slate-600">
              Submit issues through the <span class="font-semibold">#arena-support</span> channel in the Chess Club Discord or
              email <span class="font-semibold">chessar@adnu.edu.ph</span>. Include screenshots or PGN files so we can reproduce
              fast.
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <footer class="mt-20 rounded-3xl border border-[#021d94]/10 bg-[#021d94]/5 p-10 text-center shadow-glass backdrop-blur">
      <p class="text-base font-semibold text-[#021d94]">Can't find what you need?</p>
      <p class="mt-2 text-sm text-slate-600">
        Contact us via email <span class="font-semibold">adnuchess@gmail.com</span>. We're happy
        to help with onboarding, match disputes, or tournament prep.
      </p>
    </footer>
  </div>
</template>
