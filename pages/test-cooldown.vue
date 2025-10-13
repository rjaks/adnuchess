<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div class="container mx-auto px-4">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8 text-slate-900">
          Google OAuth Cooldown Test
        </h1>
        
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol class="list-decimal list-inside space-y-2 text-sm text-slate-600">
            <li>Click the Google Sign-In button below</li>
            <li>When the Google popup appears, <strong>dismiss it</strong> (click X or press ESC)</li>
            <li>Repeat this 3 times to trigger the cooldown</li>
            <li>Observe the cooldown timer and messaging</li>
            <li>Test the "Clear Cache & Reset Cooldown" button</li>
          </ol>
        </div>

        <AuthSignInPanel 
          title="Test Google OAuth Cooldown"
          description="This test page helps verify the cooldown handling works correctly."
          redirect-to="/test-cooldown"
        />

        <div class="mt-8 bg-slate-100 rounded-lg p-4">
          <h3 class="font-semibold mb-2">Expected Behavior:</h3>
          <ul class="text-sm text-slate-600 space-y-1">
            <li>• After 1-2 dismissals: Warning message about remaining dismissals</li>
            <li>• After 3+ dismissals: Cooldown activated with timer display</li>
            <li>• During cooldown: Google button hidden, warning shown</li>
            <li>• After cooldown expires: Normal sign-in restored</li>
            <li>• "Clear Cache" button: Resets cooldown immediately</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This is a test page for verifying Google OAuth cooldown functionality
definePageMeta({
  layout: false,
})
</script>
