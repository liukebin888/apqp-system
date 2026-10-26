<template>
  <el-card>
    <template #header><span>项目状态分布</span></template>
    <div ref="chartRef" class="chart-container"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  active: number
  onHold: number
  completed: number
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: props.active, name: '进行中', itemStyle: { color: '#67c23a' } },
        { value: props.onHold, name: '暂停', itemStyle: { color: '#e6a23c' } },
        { value: props.completed, name: '已完成', itemStyle: { color: '#409eff' } },
      ].filter(d => d.value > 0),
    }],
  })
}

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    render()
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  chart?.resize()
}

watch(() => [props.active, props.onHold, props.completed], render)
</script>

<style scoped>
.chart-container {
  height: 260px;
}
</style>
