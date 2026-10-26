<template>
  <el-col :span="3">
    <el-card shadow="hover" class="kpi-card" @click="navigate">
      <div class="kpi-icon" :style="{ backgroundColor: color + '15', color }">
        <el-icon :size="24"><component :is="icon" /></el-icon>
      </div>
      <div class="kpi-content">
        <div class="kpi-value" :style="{ color }">{{ displayValue }}</div>
        <div class="kpi-label">{{ label }}</div>
        <div v-if="subText" class="kpi-sub">{{ subText }}</div>
      </div>
    </el-card>
  </el-col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  label: string
  value: number | string
  icon: any
  color: string
  subText?: string
  to?: string
}>()

const router = useRouter()

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value >= 10000 ? (props.value / 10000).toFixed(1) + '万' : props.value
  }
  return props.value
})

function navigate() {
  if (props.to) router.push(props.to)
}
</script>

<style scoped lang="scss">
.kpi-card {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    width: 100%;
  }
  &:hover {
    transform: translateY(-2px);
  }
}
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-content {
  flex: 1;
  min-width: 0;
}
.kpi-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}
.kpi-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}
.kpi-sub {
  font-size: 11px;
  color: #b0b3b8;
  margin-top: 2px;
}
</style>
