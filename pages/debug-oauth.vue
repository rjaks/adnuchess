<template>
  <div class="container mx-auto p-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold">OAuth Debug Information</h1>
      
      <div class="bg-gray-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Configuration Status</h2>
        <div class="space-y-2">
          <p><strong>Google Client ID:</strong> {{ clientId ? 'Configured' : 'MISSING' }}</p>
          <p><strong>Client ID Value:</strong> {{ clientId || 'Not set' }}</p>
          <p><strong>Current URL:</strong> {{ currentUrl }}</p>
          <p><strong>NODE_ENV:</strong> {{ nodeEnv }}</p>
        </div>
      </div>

      <div class="bg-yellow-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Instructions</h2>
        <div class="space-y-2 text-sm">
          <p>1. Create a <code>.env</code> file in your project root</p>
          <p>2. Add your Google Client ID:</p>
          <pre class="bg-gray-100 p-2 rounded mt-2">GOOGLE_CLIENT_ID=your_actual_client_id_here</pre>
          <p>3. Restart your development server</p>
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Current Environment Variables</h2>
        <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">{{ JSON.stringify(runtimeConfig, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const clientId = runtimeConfig.public.googleClientId

const currentUrl = ref('')
const nodeEnv = process.env.NODE_ENV

onMounted(() => {
  currentUrl.value = window.location.href
})
</script>