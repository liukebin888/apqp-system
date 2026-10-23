import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationApi } from '@/api'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    const data: any = await notificationApi.unreadCount()
    unreadCount.value = data.count
  }

  async function markAllRead() {
    await notificationApi.markAllRead()
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, markAllRead }
})
