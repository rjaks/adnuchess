<template>
  <section>
    <h2 class="text-2xl font-semibold mb-6">Extra Modes</h2>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- PuzzleNida Card -->
      <NuxtLink 
        to="/puzzlenida"
        class="group block p-6 bg-white/70 border border-white/60 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-800 group-hover:text-[#021d94] transition-colors">PuzzleNida</h3>
            <p class="text-sm text-slate-600">Tactical Puzzles</p>
          </div>
        </div>
        <p class="text-slate-600 text-sm leading-relaxed">
          Sharpen your chess tactics with carefully curated puzzles. Solve mate-in-2, tactical combinations, and endgame positions to improve your chess skills.
        </p>
        <div class="mt-4 flex items-center text-sm text-purple-600 font-medium">
          <span>Play Puzzles</span>
          <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </NuxtLink>

      <!-- Battle Royale Card (Coming Soon) -->
      <div class="p-6 bg-gray-100/70 border border-gray-200/60 rounded-2xl shadow-sm opacity-60">
        <div class="flex items-center gap-4 mb-4">
          <div class="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700">Battle Royale</h3>
            <p class="text-sm text-gray-500">Coming Soon</p>
          </div>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">
          Compete against multiple players in fast-paced elimination rounds. Last player standing wins the crown!
        </p>
      </div>

      <!-- QuizMania Card -->
      <NuxtLink 
        to="/quizmania"
        class="group block p-6 bg-white/70 border border-white/60 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-800 group-hover:text-[#021d94] transition-colors">QuizMania</h3>
            <p class="text-sm text-slate-600">Chess Knowledge Quiz</p>
          </div>
        </div>
        <p class="text-slate-600 text-sm leading-relaxed">
          Test your chess knowledge with fast-paced quiz battles! Answer questions about openings, tactics, history, and famous games.
        </p>
        <div class="mt-4 flex items-center text-sm text-indigo-600 font-medium">
          <span>Start Quiz</span>
          <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
