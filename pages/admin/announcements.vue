<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
    <div class="mx-auto max-w-7xl px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Announcements Management</h1>
        <p class="mt-2 text-slatdefinePageMeta({
  title: 'Announcement Management',
  middleware: 'adminOnly'
})0">Manage site-wide announcements and news</p>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg class="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Create Announcement</h3>
              <p class="text-sm text-slate-600">Post new site announcement</p>
            </div>
          </div>
          <button
            type="button"
            class="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            Create New
          </button>
        </div>

        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Active Announcements</h3>
              <p class="text-sm text-slate-600">{{ activeAnnouncements.length }} currently active</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <svg class="h-6 w-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">Weekly Features</h3>
              <p class="text-sm text-slate-600">Manage weekly content</p>
            </div>
          </div>
          <button
            type="button"
            class="mt-4 w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            @click="showWeeklyModal = true"
          >
            Manage Weekly
          </button>
        </div>
      </div>

      <!-- Announcements List -->
      <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-slate-900">All Announcements</h2>
          <div class="flex gap-2">
            <select
              v-model="filterStatus"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="announcement in filteredAnnouncements"
            :key="announcement.id"
            class="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
          >
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                  :class="getStatusClass(announcement.status)"
                >
                  {{ announcement.status }}
                </span>
                <span class="text-sm text-slate-500">{{ formatDate(announcement.createdAt) }}</span>
              </div>
              <h3 class="mt-1 font-medium text-slate-900">{{ announcement.title }}</h3>
              <p class="text-sm text-slate-600">{{ announcement.preview }}</p>
              <div class="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <span>Type: {{ announcement.type }}</span>
                <span v-if="announcement.scheduledFor">Scheduled: {{ formatDate(announcement.scheduledFor) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                @click="editAnnouncement(announcement)"
              >
                Edit
              </button>
              <button
                v-if="announcement.status === 'active'"
                type="button"
                class="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                @click="archiveAnnouncement(announcement.id)"
              >
                Archive
              </button>
              <button
                v-else-if="announcement.status === 'scheduled'"
                type="button"
                class="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                @click="publishAnnouncement(announcement.id)"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <AnnouncementModal
      :is-open="showCreateModal || showEditModal"
      :announcement="editingAnnouncement"
      @close="closeModals"
      @save="saveAnnouncement"
    />

    <!-- Weekly Content Modal -->
    <WeeklyContentModal
      :is-open="showWeeklyModal"
      @close="showWeeklyModal = false"
      @save="saveWeeklyContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConvex } from '~/composables/useConvex'

// Types
type AnnouncementStatus = 'active' | 'scheduled' | 'archived'
type AnnouncementType = 'general' | 'tournament' | 'maintenance' | 'weekly_puzzle' | 'leaderboard'

interface Announcement {
  id: string
  title: string
  content: string
  preview: string
  type: AnnouncementType
  status: AnnouncementStatus
  createdAt: string
  scheduledFor?: string
  author: string
  pinned: boolean
}

// Composables
const { api } = useConvex()

// State
const announcements = ref<Announcement[]>([])
const filterStatus = ref<'all' | AnnouncementStatus>('all')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showWeeklyModal = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const isLoading = ref(false)

// Computed
const activeAnnouncements = computed(() => 
  announcements.value.filter(a => a.status === 'active')
)

const filteredAnnouncements = computed(() => {
  if (filterStatus.value === 'all') return announcements.value
  return announcements.value.filter(a => a.status === filterStatus.value)
})

// Methods
const loadAnnouncements = async () => {
  isLoading.value = true
  try {
    const response = await api.query('admin_announcements', 'getAllAnnouncements')
    announcements.value = response
  } catch (error) {
    console.error('Failed to load announcements:', error)
  } finally {
    isLoading.value = false
  }
}

const editAnnouncement = (announcement: Announcement) => {
  editingAnnouncement.value = announcement
  showEditModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingAnnouncement.value = null
}

const saveAnnouncement = async (announcementData: any) => {
  try {
    if (editingAnnouncement.value) {
      await api.mutation('admin_announcements', 'updateAnnouncement', {
        id: editingAnnouncement.value.id,
        ...announcementData
      })
    } else {
      await api.mutation('admin_announcements', 'createAnnouncement', announcementData)
    }
    await loadAnnouncements()
    closeModals()
  } catch (error) {
    console.error('Failed to save announcement:', error)
  }
}

const archiveAnnouncement = async (id: string) => {
  try {
    await api.mutation('admin_announcements', 'updateAnnouncementStatus', {
      id,
      status: 'archived'
    })
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to archive announcement:', error)
  }
}

const publishAnnouncement = async (id: string) => {
  try {
    await api.mutation('admin_announcements', 'updateAnnouncementStatus', {
      id,
      status: 'active'
    })
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to publish announcement:', error)
  }
}

const saveWeeklyContent = async (weeklyData: any) => {
  try {
    await api.mutation('admin_weekly', 'setWeeklyContent', weeklyData)
    showWeeklyModal.value = false
  } catch (error) {
    console.error('Failed to save weekly content:', error)
  }
}

const getStatusClass = (status: AnnouncementStatus) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800'
  }
  return classes[status]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadAnnouncements()
})

definePageMeta({
  title: 'Announcements Management',
  middleware: 'admin-only'
})
</script>