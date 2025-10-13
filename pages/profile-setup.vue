<template>
  <section class="mx-auto max-w-xl space-y-8 rounded-3xl border bg-white/80 p-8 shadow">
    <header>
      <h1 class="text-2xl font-bold text-slate-900">Complete your profile</h1>
      <p class="text-slate-600">Choose your role, department, and confirm your display name.</p>
    </header>

    <form class="space-y-6" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-slate-700">Display name</label>
        <input
          v-model.trim="name"
          type="text"
          required
          placeholder="Enter your preferred display name"
          class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#021d94] focus:ring-2 focus:ring-[#021d94] focus:ring-opacity-20"
        />
        <p class="mt-1 text-xs text-slate-500">This is how other players will see your name</p>
      </div>

      <fieldset class="space-y-3">
        <legend class="block text-sm font-medium text-slate-700">Role</legend>
        <div class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 p-3 hover:bg-gray-50 transition-colors" :class="{ 'border-[#021d94] bg-[#021d94]/5': role === 'student' }">
            <input type="radio" value="student" v-model="role" class="text-[#021d94] focus:ring-[#021d94]" /> 
            <span>Student</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 p-3 hover:bg-gray-50 transition-colors" :class="{ 'border-[#021d94] bg-[#021d94]/5': role === 'faculty' }">
            <input type="radio" value="faculty" v-model="role" class="text-[#021d94] focus:ring-[#021d94]" /> 
            <span>Faculty</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 p-3 hover:bg-gray-50 transition-colors" :class="{ 'border-[#021d94] bg-[#021d94]/5': role === 'alumni' }">
            <input type="radio" value="alumni" v-model="role" class="text-[#021d94] focus:ring-[#021d94]" /> 
            <span>Alumni</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label for="department" class="block text-sm font-medium text-slate-700">College/Department (Optional)</label>
        <select
          id="department"
          v-model="department"
          class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#021d94] focus:ring-2 focus:ring-[#021d94] focus:ring-opacity-20"
        >
          <option value="">Select your college (optional)...</option>
          <option v-for="college in adnuColleges" :key="college.value" :value="college.label">
            {{ college.label }}
          </option>
        </select>
        <p class="mt-1 text-xs text-slate-500">This helps identify you on leaderboards and can be changed later</p>
      </div>

      <button
        :disabled="submitting || !name || !role"
        class="w-full rounded-xl bg-[#021d94] px-4 py-3 font-semibold text-white hover:bg-[#021d94]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
import { api } from '~/convex/_generated/api'

type Role = 'student' | 'faculty' | 'alumni'

const { $convex } = useNuxtApp()
const auth = useAuth()

const name = ref<string>('')
const role = ref<Role | ''>('')
const department = ref<string>('')
const submitting = ref(false)

// AdNU Colleges list - same as in account.vue
const adnuColleges = [
  { value: 'humanities-social-sciences', label: 'College of Humanities and Social Sciences' },
  { value: 'business-accountancy', label: 'College of Business and Accountancy' },
  { value: 'computer-studies', label: 'College of Computer Studies' },
  { value: 'education', label: 'College of Education' },
  { value: 'science-engineering-architecture', label: 'College of Science, Engineering, and Architecture' },
  { value: 'nursing', label: 'College of Nursing' },
  { value: 'law', label: 'College of Law' }
]

onMounted(async () => {
  if (!auth.user.value) await auth.refresh()
  const user = auth.user.value
  if (!user) return navigateTo('/welcome')

  const prof = await $convex.query(api.profiles.getByUserId, { userId: user.id })
  name.value = (prof?.name as string) ?? user.name ?? ''
  role.value = ((prof?.role as Role | undefined) ?? '') as Role | ''
  department.value = (prof?.department as string) ?? ''
})

async function save() {
  if (!auth.user.value || !name.value || role.value === '') return
  
  submitting.value = true
  try {
    await $convex.mutation(api.profiles.completeProfile, {
      userId: auth.user.value.id,
      name: name.value,
      role: role.value as Role,
      department: department.value || undefined,
    })
    await navigateTo('/')
  } catch (error) {
    console.error('Profile completion failed:', error)
    // You could show an error message here
  } finally {
    submitting.value = false
  }
}
</script>

