<template>
  <el-card>
    <template #header><span>快捷入口</span></template>
    <div class="shortcuts-grid">
      <div
        v-for="item in shortcuts"
        :key="item.label"
        class="shortcut-item"
        @click="$router.push(item.to)"
      >
        <div class="shortcut-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <span class="shortcut-label">{{ item.label }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Plus, Document, Switch, Warning, ShoppingCart, Flag } from '@element-plus/icons-vue'

const shortcuts = [
  { label: '新建项目', icon: Plus, color: '#409eff', to: '/projects' },
  { label: '新建 ECR', icon: Switch, color: '#e6a23c', to: '/change-management' },
  { label: '问题登记', icon: Warning, color: '#f56c6c', to: '/quality' },
  { label: '采购申请', icon: ShoppingCart, color: '#67c23a', to: '/procurement' },
  { label: '文档管理', icon: Document, color: '#909399', to: '/documents' },
  { label: 'Gate 评审', icon: Flag, color: '#b37feb', to: '/gate-reviews' },
]
</script>

<style scoped>
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.shortcut-item:hover {
  background-color: #f5f7fa;
}
.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shortcut-label {
  font-size: 13px;
  color: #606266;
}
</style>
