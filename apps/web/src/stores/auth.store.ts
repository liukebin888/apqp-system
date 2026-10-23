import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const roles = computed(() => user.value?.roles || [])
  const permissions = computed(() => user.value?.permissions || [])

  function hasPermission(code: string): boolean {
    if (roles.value.includes('admin')) return true
    return permissions.value.includes(code)
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  async function login(username: string, password: string) {
    const data: any = await authApi.login({ username, password })
    token.value = data.accessToken
    user.value = data.user
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  async function fetchProfile() {
    const data: any = await authApi.getProfile()
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }

  return { token, user, isLoggedIn, roles, permissions, hasPermission, hasRole, login, logout, fetchProfile }
})
