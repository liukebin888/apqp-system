<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">魔程化解 项目管理</span>
        <span v-else>MC</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-sub-menu index="portal">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>工作台</span>
          </template>
          <el-menu-item index="/dashboard">工作台</el-menu-item>
          <el-menu-item index="/my-tasks">我的任务</el-menu-item>
          <el-menu-item index="/notifications">消息中心</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="project">
          <template #title>
            <el-icon><Folder /></el-icon>
            <span>项目进度</span>
          </template>
          <el-menu-item index="/projects">项目列表</el-menu-item>
          <el-menu-item index="/project-kanban">项目看板</el-menu-item>
          <el-menu-item index="/progress-reports">进度报告</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="workflow">
          <template #title>
            <el-icon><Stamp /></el-icon>
            <span>流程管理</span>
          </template>
          <el-menu-item index="/workflow/definitions">流程定义</el-menu-item>
          <el-menu-item index="/workflow/approval-center">审批中心</el-menu-item>
          <el-menu-item index="/workflow/my-initiated">我发起的</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/pre-project">
          <el-icon><TrendCharts /></el-icon>
          <template #title>预立项管理</template>
        </el-menu-item>

        <el-menu-item index="/gate-reviews">
          <el-icon><Checked /></el-icon>
          <template #title>Gate 评审</template>
        </el-menu-item>

        <el-sub-menu index="ots-ppap">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>OTS/PPAP</span>
          </template>
          <el-menu-item index="/ots">OTS 样件管理</el-menu-item>
          <el-menu-item index="/ppap">PPAP 提报管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/quality">
          <el-icon><CircleCheck /></el-icon>
          <template #title>质量管理</template>
        </el-menu-item>
        <el-menu-item index="/quality-engineering">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>质量工程</template>
        </el-menu-item>
        <el-menu-item index="/change-management">
          <el-icon><Switch /></el-icon>
          <template #title>工程变更管理</template>
        </el-menu-item>
        <el-menu-item index="/issues">
          <el-icon><Warning /></el-icon>
          <template #title>问题管理</template>
        </el-menu-item>
        <el-menu-item index="/functional-safety">
          <el-icon><Finished /></el-icon>
          <template #title>功能安全</template>
        </el-menu-item>
        <el-menu-item index="/aspice-requirements">
          <el-icon><Notebook /></el-icon>
          <template #title>A-SPICE 需求管理</template>
        </el-menu-item>
        <el-menu-item index="/security">
          <el-icon><Lock /></el-icon>
          <template #title>信息安全</template>
        </el-menu-item>
        <el-menu-item index="/closures">
          <el-icon><CircleCheckFilled /></el-icon>
          <template #title>结项与移交</template>
        </el-menu-item>
        <el-menu-item index="/cost">
          <el-icon><Money /></el-icon>
          <template #title>成本管理</template>
        </el-menu-item>
        <el-menu-item index="/procurement">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>采购管理</template>
        </el-menu-item>
        <el-menu-item index="/supplier-collab">
          <el-icon><Van /></el-icon>
          <template #title>供方协同</template>
        </el-menu-item>
        <el-menu-item index="/knowledge">
          <el-icon><Collection /></el-icon>
          <template #title>知识库</template>
        </el-menu-item>
        <el-menu-item index="/documents">
          <el-icon><Document /></el-icon>
          <template #title>文档管理</template>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><PieChart /></el-icon>
          <template #title>数据分析</template>
        </el-menu-item>

        <el-menu-item index="/form-center">
          <el-icon><Tickets /></el-icon>
          <template #title>表单中心</template>
        </el-menu-item>

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
          <el-menu-item index="/system/config">系统参数</el-menu-item>
          <el-menu-item index="/system/project-tiers">项目分级配置</el-menu-item>
          <el-menu-item index="/security-audits">安全审计</el-menu-item>
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
  overflow-y: auto;
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
