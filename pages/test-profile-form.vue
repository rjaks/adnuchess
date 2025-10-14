<template>
  <div class="container mx-auto p-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">🧪 Profile Setup Form Test</h1>
    
    <!-- Form Preview -->
    <section class="mx-auto max-w-xl space-y-8 rounded-3xl border bg-white/80 p-8 shadow">
      <header>
        <h1 class="text-2xl font-bold text-slate-900">Complete your profile</h1>
        <p class="text-slate-600">Please provide your information to complete your AdNU Chess Arena profile.</p>
      </header>

      <form class="space-y-5" @submit.prevent="testSave">
        <div>
          <label class="block text-sm font-medium text-slate-700">Full Name</label>
          <input
            v-model.trim="name"
            type="text"
            required
            placeholder="Enter your full name"
            class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500"
          />
          <p class="mt-1 text-xs text-slate-500">This will be used for official purposes and rankings</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Display Name <span class="text-slate-400">(Optional)</span></label>
          <input
            v-model.trim="displayName"
            type="text"
            placeholder="Enter a display name (defaults to your full name)"
            class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500"
          />
          <p class="mt-1 text-xs text-slate-500">This is how other players will see you in games and chat</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">Department <span class="text-red-500">*</span></label>
          <select
            v-model="department"
            required
            class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500 bg-white"
          >
            <option value="">Select your department</option>
            <optgroup label="College of Arts and Sciences">
              <option value="biology">Biology</option>
              <option value="chemistry">Chemistry</option>
              <option value="english">English</option>
              <option value="filipino">Filipino</option>
              <option value="history">History</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="psychology">Psychology</option>
            </optgroup>
            <optgroup label="College of Business and Accountancy">
              <option value="accountancy">Accountancy</option>
              <option value="business-administration">Business Administration</option>
              <option value="economics">Economics</option>
            </optgroup>
            <optgroup label="College of Engineering">
              <option value="chemical-engineering">Chemical Engineering</option>
              <option value="civil-engineering">Civil Engineering</option>
              <option value="computer-engineering">Computer Engineering</option>
              <option value="electrical-engineering">Electrical Engineering</option>
              <option value="industrial-engineering">Industrial Engineering</option>
              <option value="mechanical-engineering">Mechanical Engineering</option>
            </optgroup>
            <optgroup label="College of Computer Studies">
              <option value="computer-science">Computer Science</option>
              <option value="information-systems">Information Systems</option>
              <option value="information-technology">Information Technology</option>
            </optgroup>
            <optgroup label="College of Education">
              <option value="elementary-education">Elementary Education</option>
              <option value="secondary-education">Secondary Education</option>
              <option value="special-education">Special Education</option>
            </optgroup>
            <optgroup label="College of Law">
              <option value="law">Law</option>
            </optgroup>
            <optgroup label="College of Medicine">
              <option value="medicine">Medicine</option>
            </optgroup>
            <optgroup label="College of Nursing">
              <option value="nursing">Nursing</option>
            </optgroup>
            <optgroup label="Graduate School">
              <option value="graduate-studies">Graduate Studies</option>
            </optgroup>
            <optgroup label="Other">
              <option value="administration">Administration</option>
              <option value="other">Other</option>
            </optgroup>
          </select>
          <p class="mt-1 text-xs text-slate-500">Select your academic department or unit</p>
        </div>

        <fieldset class="space-y-3">
          <legend class="block text-sm font-medium text-slate-700">Role <span class="text-red-500">*</span></legend>
          <div class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="radio" value="student" v-model="role" class="text-blue-600" />
              <span>Student</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="radio" value="faculty" v-model="role" class="text-blue-600" />
              <span>Faculty</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="radio" value="alumni" v-model="role" class="text-blue-600" />
              <span>Alumni</span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          :disabled="submitting || !name || !department || !role"
          class="w-full rounded-xl bg-[#021d94] px-4 py-2 font-semibold text-white hover:bg-[#021d94]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {{ submitting ? "Saving..." : "Save & Continue" }}
        </button>
      </form>
    </section>

    <!-- Test Results -->
    <div v-if="result" class="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 class="font-bold text-green-800 mb-2">Form Submission Test Result:</h3>
      <pre class="text-sm text-green-700 overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const displayName = ref('')
const department = ref('')
const role = ref('')
const submitting = ref(false)
const result = ref(null)

const testSave = () => {
  submitting.value = true
  
  // Simulate the final payload that would be sent
  const finalDisplayName = displayName.value.trim() || name.value
  
  result.value = {
    userId: 'test-user-id',
    name: name.value,
    displayName: finalDisplayName,
    department: department.value,
    role: role.value,
    timestamp: new Date().toISOString()
  }
  
  setTimeout(() => {
    submitting.value = false
  }, 1000)
}
</script>
