<template>
  <section class="mx-auto max-w-xl space-y-8 rounded-3xl border bg-white/80 p-8 shadow">
    <header>
      <h1 class="text-2xl font-bold text-slate-900">Complete your profile</h1>
      <p class="text-slate-600">Choose your role and confirm your display name.</p>
    </header>

    <form class="space-y-6" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-slate-700">Display name</label>
        <input
          v-model.trim="name"
          type="text"
          required
          class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
        />
      </div>

      <fieldset class="space-y-3">
        <legend class="block text-sm font-medium text-slate-700">Role</legend>
        <div class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3">
            <input type="radio" value="student" v-model="role" /> <span>Student</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3">
            <input type="radio" value="faculty" v-model="role" /> <span>Faculty</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3">
            <input type="radio" value="alumni" v-model="role" /> <span>Alumni</span>
          </label>
        </div>
      </fieldset>

      <button
        :disabled="submitting || !name || !role"
        class="rounded-xl bg-[#021d94] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {{ submitting ? "Saving..." : "Save & Continue" }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'   // ← use this

type Role = 'student' | 'faculty' | 'alumni'

const { $convex } = useNuxtApp()
const auth = useAuth()

const name = ref<string>('')
const role = ref<Role | ''>('')
const submitting = ref(false)

onMounted(async () => {
  if (!auth.user.value) await auth.refresh()
  const user = auth.user.value
  if (!user) return navigateTo('/welcome')

  const prof = await $convex.query(api.profiles.getByUserId, { userId: user.id })
  name.value = (prof?.name as string) ?? user.name ?? ''
  role.value = ((prof?.role as Role | undefined) ?? '') as Role | ''
})

async function save() {
  if (!auth.user.value || !name.value || role.value === '') return   // clearer check
  submitting.value = true
  try {
    await $convex.mutation(api.profiles.completeProfile, {
      userId: auth.user.value.id,
      name: name.value,
      role: role.value as Role,
    })
    await navigateTo('/')
  } finally {
    submitting.value = false
  }
}
</script>

