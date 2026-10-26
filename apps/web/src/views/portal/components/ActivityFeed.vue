<template>
  <el-card>
    <template #header><span>最近活动</span></template>
    <el-timeline v-if="notifications.length > 0">
      <el-timeline-item
        v-for="item in notifications"
        :key="item.id"
        :timestamp="formatDate(item.createdAt)"
        placement="top"
        :type="timelineType(item.type)"
      >
        <div class="activity-title">{{ item.title }}</div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无活动" :image-size="60" />
  </el-card>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

defineProps<{
  notifications: Array<{
    id: number; title: string; type: string; createdAt: string;
  }>
}>()

function timelineType(type: string): string {
  const map: Record<string, string> = {
    task: 'primary', approval: 'warning', alert: 'danger', system: 'info',
  }
  return map[type] || 'info'
}

function formatDate(date: string): string {
  return dayjs(date).format('MM-DD HH:mm')
}
</script>

<style scoped>
.activity-title {
  font-size: 13px;
  color: #303133;
}
</style>
