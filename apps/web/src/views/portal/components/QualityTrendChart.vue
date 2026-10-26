<template>
  <el-card>
    <template #header><span>质量趋势</span></template>
    <div ref="chartRef" class="chart-container"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const props = defineProps<{
  data: Array<{ month: string; opened: number; closed: number; critical: number }>
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { top: 10, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.month),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '新增', type: 'line', smooth: true, data: props.data.map(d => d.opened), itemStyle: { color: '#e6a23c' } },
      { name: '关闭', type: 'line', smooth: true, data: props.data.map(d => d.closed), itemStyle: { color: '#67c23a' } },
      { name: '严重', type: 'line', smooth: true, data: props.data.map(d => d.critical), itemStyle: { color: '#f56c6c' } },
    ],
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

watch(() => props.data, render, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 260px;
}
</style>
