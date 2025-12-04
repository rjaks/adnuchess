<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-8">Test Results Page</h1>
      <p class="text-center text-lg">If you can see this, the results directory routing works!</p>
      <div class="text-center mt-8">
        <button @click="$router.back()" class="px-6 py-3 bg-purple-600 text-white rounded-xl">
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
console.log('[TestResults] Test results page loaded!')
</script>
