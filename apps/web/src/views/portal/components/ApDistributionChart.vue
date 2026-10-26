<template>
  <el-card>
    <template #header><span>FMEA AP 分布</span></template>
    <div ref="chartRef" class="chart-container"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const props = defineProps<{
  dfmea: { high: number; medium: number; low: number }
  pfmea: { high: number; medium: number; low: number }
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

function render() {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { top: 10, right: 20, bottom: 40, left: 40 },
    xAxis: { type: 'category', data: ['DFMEA', 'PFMEA'] },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '高 (H)', type: 'bar', stack: 'total', data: [props.dfmea.high, props.pfmea.high], itemStyle: { color: '#f56c6c' } },
      { name: '中 (M)', type: 'bar', stack: 'total', data: [props.dfmea.medium, props.pfmea.medium], itemStyle: { color: '#e6a23c' } },
      { name: '低 (L)', type: 'bar', stack: 'total', data: [props.dfmea.low, props.pfmea.low], itemStyle: { color: '#67c23a' } },
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

watch(() => [props.dfmea, props.pfmea], render, { deep: true })
</script>

<style scoped>
.chart-container {
  height: 260px;
}
</style>
