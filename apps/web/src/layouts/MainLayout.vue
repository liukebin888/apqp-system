<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">APQP 项目管理</span>
        <span v-else>AQ</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-sub-menu index="project">
          <template #title>
            <el-icon><Folder /></el-icon>
            <span>项目管理</span>
          </template>
          <el-menu-item index="/projects">项目列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="workflow">
          <template #title>
            <el-icon><Stamp /></el-icon>
            <span>流程管理</span>
          </template>
          <el-menu-item index="/workflow/approval-center">审批中心</el-menu-item>
          <el-menu-item index="/workflow/my-initiated">我发起的</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="master-data">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>主数据</span>
          </template>
          <el-menu-item index="/master-data/customers">客户管理</el-menu-item>
          <el-menu-item index="/master-data/products">产品管理</el-menu-item>
          <el-menu-item index="/master-data/suppliers">供应商管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/users">用户管理</el-menu-item>
          <el-menu-item index="/system/roles">角色管理</el-menu-item>
          <el-menu-item index="/system/departments">组织架构</el-menu-item>
          <el-menu-item index="/system/audit-logs">审计日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0">
            <el-icon class="header-icon" @click="$router.push('/notifications')"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="28">{{ authStore.user?.realName?.charAt(0) }}</el-avatar>
              <span class="username">{{ authStore.user?.realName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const isCollapse = ref(false)
const currentRoute = computed(() => route.path)

onMounted(() => {
  notificationStore.fetchUnreadCount()
})

function handleCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #303133;
}

.main-content {
  background-color: #f5f7fa;
}
</style>
