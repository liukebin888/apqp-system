import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/services/prisma.service'

const AP_MATRIX: Record<number, Record<number, Record<number, string>>> = {
  1: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'L', 9: 'L', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'M', 9: 'M', 10: 'M' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  2: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'L', 8: 'L', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  3: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  4: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'M' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  5: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'M', 10: 'H' }, 2: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'L', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  6: { 1: { 1: 'L', 2: 'L', 3: 'L', 4: 'M', 5: 'M', 6: 'M', 7: 'M', 8: 'M', 9: 'H', 10: 'H' }, 2: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  7: { 1: { 1: 'L', 2: 'L', 3: 'M', 4: 'M', 5: 'M', 6: 'M', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  8: { 1: { 1: 'L', 2: 'M', 3: 'M', 4: 'M', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  9: { 1: { 1: 'M', 2: 'M', 3: 'M', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
  10: { 1: { 1: 'M', 2: 'M', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 2: { 1: 'M', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 3: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 4: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 5: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 6: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 7: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 8: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 9: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' }, 10: { 1: 'H', 2: 'H', 3: 'H', 4: 'H', 5: 'H', 6: 'H', 7: 'H', 8: 'H', 9: 'H', 10: 'H' } },
}

function calcAP(s: number, o: number, d: number): string {
  const sv = Math.max(1, Math.min(10, s))
  const ov = Math.max(1, Math.min(10, o))
  const dv = Math.max(1, Math.min(10, d))
  return AP_MATRIX[sv]?.[ov]?.[dv] || 'L'
}

const SEVERITY_TABLE = [
  { rating: 1, criteria: '无影响', description: '无可辨别的影响' },
  { rating: 2, criteria: '轻微', description: '外观/噪音/振动等轻微不便' },
  { rating: 3, criteria: '较低', description: '外观/噪音/振动等不便' },
  { rating: 4, criteria: '低', description: '外观/噪音/振动等不便，多数客户不满意' },
  { rating: 5, criteria: '中等', description: '舒适性/便利性受损' },
  { rating: 6, criteria: '较高', description: '舒适性/便利性严重受损' },
  { rating: 7, criteria: '高', description: '产品功能降级' },
  { rating: 8, criteria: '很高', description: '产品功能丧失' },
  { rating: 9, criteria: '严重', description: '不符合法规要求（无预警）' },
  { rating: 10, criteria: '极严重', description: '不符合法规要求（有预警）' },
]

const OCCURRENCE_TABLE = [
  { rating: 1, criteria: '极低', description: '每百万件 < 1 件失效' },
  { rating: 2, criteria: '低', description: '每百万件约 10 件失效' },
  { rating: 3, criteria: '较低', description: '每百万件约 100 件失效' },
  { rating: 4, criteria: '偶尔', description: '每百万件约 500 件失效' },
  { rating: 5, criteria: '中等', description: '每百万件约 2,000 件失效' },
  { rating: 6, criteria: '较高', description: '每百万件约 5,000 件失效' },
  { rating: 7, criteria: '高', description: '每百万件约 10,000 件失效' },
  { rating: 8, criteria: '很高', description: '每百万件约 25,000 件失效' },
  { rating: 9, criteria: '极高', description: '每百万件约 50,000 件失效' },
  { rating: 10, criteria: '极高', description: '每百万件 >= 100,000 件失效' },
]

const DETECTION_TABLE = [
  { rating: 1, criteria: '几乎确定', description: '现有控制措施几乎肯定能探测到' },
  { rating: 2, criteria: '很高', description: '现有控制措施有很高的探测能力' },
  { rating: 3, criteria: '高', description: '现有控制措施有较高的探测能力' },
  { rating: 4, criteria: '中高', description: '现有控制措施有中高的探测能力' },
  { rating: 5, criteria: '中等', description: '现有控制措施有中等的探测能力' },
  { rating: 6, criteria: '中低', description: '现有控制措施探测能力偏低' },
  { rating: 7, criteria: '低', description: '现有控制措施探测能力低' },
  { rating: 8, criteria: '很低', description: '现有控制措施探测能力很低' },
  { rating: 9, criteria: '极低', description: '现有控制措施几乎无法探测' },
  { rating: 10, criteria: '不可探测', description: '无有效探测手段' },
]

@Injectable()
export class FmeaService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // Helpers
  // ============================================================

  private async generateNo(prefix: string, seqName: string): Promise<string> {
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const seq = await this.prisma.sysSequence.upsert({
      where: { seqName },
      update: { currentVal: { increment: 1 } },
      create: { seqName, currentVal: 1, prefix, dateFormat: 'YYYYMMDD' },
    })
    return `${prefix}${dateStr}${String(seq.currentVal).padStart(4, '0')}`
  }

  // ============================================================
  // DFMEA
  // ============================================================

  async findAllDfmeas(projectId?: number) {
    const where = projectId ? { projectId } : {}
    return this.prisma.fmeaDfmea.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        teamLeader: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneDfmea(id: number) {
    return this.prisma.fmeaDfmea.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        teamLeader: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            actionOwner: { select: { id: true, realName: true } },
            children: { include: { actionOwner: { select: { id: true, realName: true } } } },
          },
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async createDfmea(data: any, userId: number) {
    const fmeaNo = await this.generateNo('DF', 'dfmea_seq')
    return this.prisma.fmeaDfmea.create({
      data: {
        ...data,
        fmeaNo,
        status: 'draft',
        createdById: userId,
      },
    })
  }

  async updateDfmea(id: number, data: any) {
    return this.prisma.fmeaDfmea.update({ where: { id }, data })
  }

  async deleteDfmea(id: number) {
    return this.prisma.fmeaDfmea.delete({ where: { id } })
  }

  async approveDfmea(id: number, userId: number) {
    return this.prisma.fmeaDfmea.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
    })
  }

  async copyDfmea(id: number, userId: number) {
    const source = await this.prisma.fmeaDfmea.findUnique({
      where: { id },
      include: { items: { include: { children: true } } },
    })
    if (!source) throw new NotFoundException('DFMEA not found')
    const fmeaNo = await this.generateNo('DF', 'dfmea_seq')
    const newDfmea = await this.prisma.fmeaDfmea.create({
      data: {
        projectId: source.projectId,
        fmeaNo,
        title: `${source.title} (Copy)`,
        version: 1,
        status: 'draft',
        scope: source.scope,
        teamLeaderId: source.teamLeaderId,
        createdById: userId,
      },
    })
    for (const item of source.items.filter(i => !i.parentId)) {
      await this.copyDfmeaItemWithChildren(item, newDfmea.id, null)
    }
    return this.findOneDfmea(newDfmea.id)
  }

  private async copyDfmeaItemWithChildren(item: any, newDfmeaId: number, newParentId: number | null) {
    const newItem = await this.prisma.fmeaDfmeaItem.create({
      data: {
        dfmeaId: newDfmeaId,
        parentId: newParentId,
        level: item.level,
        itemName: item.itemName,
        functionRequirement: item.functionRequirement,
        failureMode: item.failureMode,
        failureEffect: item.failureEffect,
        severityRating: item.severityRating,
        failureCause: item.failureCause,
        occurrenceRating: item.occurrenceRating,
        currentPreventionCtrl: item.currentPreventionCtrl,
        currentDetectionCtrl: item.currentDetectionCtrl,
        detectionRating: item.detectionRating,
        apRating: item.apRating,
        recommendedAction: item.recommendedAction,
        actionStatus: 'pending',
        sortOrder: item.sortOrder,
      },
    })
    if (item.children?.length) {
      for (const child of item.children) {
        await this.copyDfmeaItemWithChildren(child, newDfmeaId, newItem.id)
      }
    }
  }

  // DFMEA Items
  async createDfmeaItem(dfmeaId: number, data: any) {
    const ap = calcAP(
      data.severityRating || 1,
      data.occurrenceRating || 1,
      data.detectionRating || 1,
    )
    return this.prisma.fmeaDfmeaItem.create({
      data: { ...data, dfmeaId, apRating: ap },
    })
  }

  async updateDfmeaItem(id: number, data: any) {
    if (data.severityRating !== undefined || data.occurrenceRating !== undefined || data.detectionRating !== undefined) {
      const existing = await this.prisma.fmeaDfmeaItem.findUnique({ where: { id } })
      if (existing) {
        const s = data.severityRating ?? existing.severityRating
        const o = data.occurrenceRating ?? existing.occurrenceRating
        const d = data.detectionRating ?? existing.detectionRating
        data.apRating = calcAP(s, o, d)
      }
    }
    return this.prisma.fmeaDfmeaItem.update({ where: { id }, data })
  }

  async deleteDfmeaItem(id: number) {
    await this.prisma.fmeaDfmeaItem.deleteMany({ where: { parentId: id } })
    return this.prisma.fmeaDfmeaItem.delete({ where: { id } })
  }

  // ============================================================
  // Process Flow
  // ============================================================

  async findAllProcessFlows(projectId?: number) {
    const where = projectId ? { projectId } : {}
    return this.prisma.fmeaProcessFlow.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { steps: true, pfmeas: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneProcessFlow(id: number) {
    return this.prisma.fmeaProcessFlow.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        steps: { orderBy: { sortOrder: 'asc' } },
        pfmeas: { select: { id: true, fmeaNo: true, title: true, status: true } },
      },
    })
  }

  async createProcessFlow(data: any, userId: number) {
    const flowNo = await this.generateNo('PF', 'process_flow_seq')
    return this.prisma.fmeaProcessFlow.create({
      data: { ...data, flowNo, createdById: userId },
    })
  }

  async updateProcessFlow(id: number, data: any) {
    return this.prisma.fmeaProcessFlow.update({ where: { id }, data })
  }

  async deleteProcessFlow(id: number) {
    return this.prisma.fmeaProcessFlow.delete({ where: { id } })
  }

  async addProcessFlowStep(flowId: number, data: any) {
    return this.prisma.fmeaProcessFlowStep.create({ data: { ...data, flowId } })
  }

  async updateProcessFlowStep(id: number, data: any) {
    return this.prisma.fmeaProcessFlowStep.update({ where: { id }, data })
  }

  async deleteProcessFlowStep(id: number) {
    return this.prisma.fmeaProcessFlowStep.delete({ where: { id } })
  }

  // ============================================================
  // PFMEA
  // ============================================================

  async findAllPfmeas(projectId?: number) {
    const where = projectId ? { projectId } : {}
    return this.prisma.fmeaPfmea.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        processFlow: { select: { id: true, flowNo: true, title: true } },
        teamLeader: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOnePfmea(id: number) {
    return this.prisma.fmeaPfmea.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true } },
        processFlow: { select: { id: true, flowNo: true, title: true } },
        teamLeader: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        createdBy: { select: { id: true, realName: true } },
        items: {
          include: {
            processFlowStep: { select: { id: true, stepNo: true, operationName: true } },
            actionOwner: { select: { id: true, realName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  async createPfmea(data: any, userId: number) {
    const fmeaNo = await this.generateNo('PF', 'pfmea_seq')
    return this.prisma.fmeaPfmea.create({
      data: { ...data, fmeaNo, status: 'draft', createdById: userId },
    })
  }

  async updatePfmea(id: number, data: any) {
    return this.prisma.fmeaPfmea.update({ where: { id }, data })
  }

  async deletePfmea(id: number) {
    return this.prisma.fmeaPfmea.delete({ where: { id } })
  }

  async approvePfmea(id: number, userId: number) {
    return this.prisma.fmeaPfmea.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
    })
  }

  async createPfmeaItem(pfmeaId: number, data: any) {
    const ap = calcAP(
      data.severityRating || 1,
      data.occurrenceRating || 1,
      data.detectionRating || 1,
    )
    return this.prisma.fmeaPfmeaItem.create({
      data: { ...data, pfmeaId, apRating: ap },
    })
  }

  async updatePfmeaItem(id: number, data: any) {
    if (data.severityRating !== undefined || data.occurrenceRating !== undefined || data.detectionRating !== undefined) {
      const existing = await this.prisma.fmeaPfmeaItem.findUnique({ where: { id } })
      if (existing) {
        const s = data.severityRating ?? existing.severityRating
        const o = data.occurrenceRating ?? existing.occurrenceRating
        const d = data.detectionRating ?? existing.detectionRating
        data.apRating = calcAP(s, o, d)
      }
    }
    return this.prisma.fmeaPfmeaItem.update({ where: { id }, data })
  }

  async deletePfmeaItem(id: number) {
    return this.prisma.fmeaPfmeaItem.delete({ where: { id } })
  }

  // ============================================================
  // Control Plan
  // ============================================================

  async findAllControlPlans(projectId?: number, cpType?: string) {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (cpType) where.cpType = cpType
    return this.prisma.fmeaControlPlan.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneControlPlan(id: number) {
    return this.prisma.fmeaControlPlan.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        approvedBy: { select: { id: true, realName: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  async createControlPlan(data: any, userId: number) {
    const cpNo = await this.generateNo('CP', 'control_plan_seq')
    return this.prisma.fmeaControlPlan.create({
      data: { ...data, cpNo, status: 'draft', createdById: userId },
    })
  }

  async updateControlPlan(id: number, data: any) {
    return this.prisma.fmeaControlPlan.update({ where: { id }, data })
  }

  async deleteControlPlan(id: number) {
    return this.prisma.fmeaControlPlan.delete({ where: { id } })
  }

  async approveControlPlan(id: number, userId: number) {
    return this.prisma.fmeaControlPlan.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
    })
  }

  async createControlPlanItem(controlPlanId: number, data: any) {
    return this.prisma.fmeaControlPlanItem.create({ data: { ...data, controlPlanId } })
  }

  async updateControlPlanItem(id: number, data: any) {
    return this.prisma.fmeaControlPlanItem.update({ where: { id }, data })
  }

  async deleteControlPlanItem(id: number) {
    return this.prisma.fmeaControlPlanItem.delete({ where: { id } })
  }

  async generateControlPlanFromPfmea(controlPlanId: number) {
    const cp = await this.prisma.fmeaControlPlan.findUnique({
      where: { id: controlPlanId },
      include: { project: true },
    })
    if (!cp) throw new NotFoundException('Control Plan not found')
    const pfmeas = await this.prisma.fmeaPfmea.findMany({
      where: { projectId: cp.projectId, status: { in: ['approved', 'released'] } },
      include: {
        items: {
          include: { processFlowStep: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    let itemCount = 0
    for (const pfmea of pfmeas) {
      for (const item of pfmea.items) {
        await this.prisma.fmeaControlPlanItem.create({
          data: {
            controlPlanId,
            partProcessName: item.processFlowStep?.operationName || item.processStep,
            characteristicDesc: item.failureMode || null,
            specificationTol: null,
            measurementMethod: item.currentDetectionCtrl || null,
            sampleSize: null,
            sampleFrequency: null,
            controlMethod: item.currentPreventionCtrl || null,
            reactionPlan: item.recommendedAction || null,
            specialCharId: item.specialCharId,
            sortOrder: itemCount++,
          },
        })
      }
    }
    return { generated: itemCount }
  }

  // ============================================================
  // Special Characteristics
  // ============================================================

  async findAllSpecialChars(projectId?: number, charType?: string) {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (charType) where.charType = charType
    return this.prisma.fmeaSpecialCharacteristic.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createSpecialChar(data: any, userId: number) {
    return this.prisma.fmeaSpecialCharacteristic.create({
      data: { ...data, createdById: userId },
    })
  }

  async updateSpecialChar(id: number, data: any) {
    return this.prisma.fmeaSpecialCharacteristic.update({ where: { id }, data })
  }

  async deleteSpecialChar(id: number) {
    return this.prisma.fmeaSpecialCharacteristic.delete({ where: { id } })
  }

  async getSpecialCharTraceability(id: number) {
    const sc = await this.prisma.fmeaSpecialCharacteristic.findUnique({ where: { id } })
    if (!sc) throw new NotFoundException('Special characteristic not found')
    const [dfmeaItems, pfmeaItems, cpItems] = await Promise.all([
      this.prisma.fmeaDfmeaItem.findMany({
        where: { specialCharId: id },
        include: { dfmea: { select: { fmeaNo: true, title: true } } },
      }),
      this.prisma.fmeaPfmeaItem.findMany({
        where: { specialCharId: id },
        include: { pfmea: { select: { fmeaNo: true, title: true } } },
      }),
      this.prisma.fmeaControlPlanItem.findMany({
        where: { specialCharId: id },
        include: { controlPlan: { select: { cpNo: true, title: true } } },
      }),
    ])
    return { specialChar: sc, dfmeaItems, pfmeaItems, cpItems }
  }

  // ============================================================
  // SPC Studies
  // ============================================================

  async findAllSpcStudies(projectId?: number) {
    const where = projectId ? { projectId } : {}
    return this.prisma.qeSpcStudy.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { dataPoints: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneSpcStudy(id: number) {
    return this.prisma.qeSpcStudy.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        dataPoints: { orderBy: { subgroupNo: 'asc' } },
      },
    })
  }

  async createSpcStudy(data: any, userId: number) {
    const studyNo = await this.generateNo('SPC', 'spc_study_seq')
    return this.prisma.qeSpcStudy.create({
      data: { ...data, studyNo, createdById: userId },
    })
  }

  async updateSpcStudy(id: number, data: any) {
    return this.prisma.qeSpcStudy.update({ where: { id }, data })
  }

  async deleteSpcStudy(id: number) {
    return this.prisma.qeSpcStudy.delete({ where: { id } })
  }

  async addSpcDataPoint(studyId: number, data: any) {
    const dp = await this.prisma.qeSpcDataPoint.create({
      data: { ...data, studyId },
    })
    return dp
  }

  async addSpcDataPointsBulk(studyId: number, points: any[]) {
    return this.prisma.qeSpcDataPoint.createMany({
      data: points.map(p => ({ ...p, studyId })),
    })
  }

  async calculateSpc(studyId: number) {
    const study = await this.prisma.qeSpcStudy.findUnique({
      where: { id: studyId },
      include: { dataPoints: { orderBy: { subgroupNo: 'asc' } } },
    })
    if (!study || study.dataPoints.length === 0) throw new NotFoundException('No data points')

    const points = study.dataPoints
    const allValues: number[] = []
    for (const dp of points) {
      if (dp.sampleValues && Array.isArray(dp.sampleValues)) {
        allValues.push(...(dp.sampleValues as number[]))
      }
      if (dp.subgroupMean !== null) {
        allValues.push(Number(dp.subgroupMean))
      }
    }
    if (allValues.length === 0) throw new NotFoundException('No measurement values')

    const n = allValues.length
    const mean = allValues.reduce((a, b) => a + b, 0) / n
    const variance = allValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)
    const stdOverall = Math.sqrt(variance)

    const ranges: number[] = []
    for (const dp of points) {
      if (dp.subgroupRange !== null) ranges.push(Number(dp.subgroupRange))
      else if (dp.sampleValues && Array.isArray(dp.sampleValues) && (dp.sampleValues as number[]).length > 1) {
        const vals = dp.sampleValues as number[]
        ranges.push(Math.max(...vals) - Math.min(...vals))
      }
    }
    const rBar = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0
    const d2Map: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 }
    const d2 = d2Map[study.subgroupSize] || 2.326
    const sigmaWithin = rBar > 0 ? rBar / d2 : stdOverall

    const usl = study.usl ? Number(study.usl) : null
    const lsl = study.lsl ? Number(study.lsl) : null

    let cp: number | null = null
    let cpk: number | null = null
    let pp: number | null = null
    let ppk: number | null = null

    if (usl !== null && lsl !== null) {
      cp = sigmaWithin > 0 ? (usl - lsl) / (6 * sigmaWithin) : null
      cpk = sigmaWithin > 0 ? Math.min((usl - mean) / (3 * sigmaWithin), (mean - lsl) / (3 * sigmaWithin)) : null
      pp = stdOverall > 0 ? (usl - lsl) / (6 * stdOverall) : null
      ppk = stdOverall > 0 ? Math.min((usl - mean) / (3 * stdOverall), (mean - lsl) / (3 * stdOverall)) : null
    }

    let capabilityResult = 'incapable'
    if (cpk !== null) {
      if (cpk >= 1.67) capabilityResult = 'capable'
      else if (cpk >= 1.0) capabilityResult = 'marginal'
    }

    const ucl = mean + 3 * sigmaWithin
    const lcl = mean - 3 * sigmaWithin

    const updated = await this.prisma.qeSpcStudy.update({
      where: { id: studyId },
      data: {
        cp: cp !== null ? cp : undefined,
        cpk: cpk !== null ? cpk : undefined,
        pp: pp !== null ? pp : undefined,
        ppk: ppk !== null ? ppk : undefined,
        capabilityResult,
        ucl,
        lcl,
      },
    })

    for (const dp of points) {
      let isOOC = false
      let violation: string | null = null
      const m = dp.subgroupMean !== null ? Number(dp.subgroupMean) : null
      if (m !== null) {
        if (m > ucl || m < lcl) { isOOC = true; violation = 'beyond_limits' }
      }
      if (dp.sampleValues && Array.isArray(dp.sampleValues)) {
        for (const v of dp.sampleValues as number[]) {
          if (v > ucl || v < lcl) { isOOC = true; violation = 'beyond_limits'; break }
        }
      }
      if (isOOC) {
        await this.prisma.qeSpcDataPoint.update({
          where: { id: dp.id },
          data: { isOutOfControl: true, violationRule: violation },
        })
      }
    }

    return this.findOneSpcStudy(studyId)
  }

  async getSpcChartData(studyId: number) {
    const study = await this.prisma.qeSpcStudy.findUnique({
      where: { id: studyId },
      include: { dataPoints: { orderBy: { subgroupNo: 'asc' } } },
    })
    if (!study) throw new NotFoundException('Study not found')
    return {
      study: {
        chartType: study.chartType,
        ucl: study.ucl ? Number(study.ucl) : null,
        lcl: study.lcl ? Number(study.lcl) : null,
        usl: study.usl ? Number(study.usl) : null,
        lsl: study.lsl ? Number(study.lsl) : null,
        cp: study.cp ? Number(study.cp) : null,
        cpk: study.cpk ? Number(study.cpk) : null,
        pp: study.pp ? Number(study.pp) : null,
        ppk: study.ppk ? Number(study.ppk) : null,
        capabilityResult: study.capabilityResult,
      },
      dataPoints: study.dataPoints.map(dp => ({
        subgroupNo: dp.subgroupNo,
        mean: dp.subgroupMean ? Number(dp.subgroupMean) : null,
        range: dp.subgroupRange ? Number(dp.subgroupRange) : null,
        isOutOfControl: dp.isOutOfControl,
        violationRule: dp.violationRule,
      })),
    }
  }

  // ============================================================
  // MSA Studies
  // ============================================================

  async findAllMsaStudies(projectId?: number) {
    const where = projectId ? { projectId } : {}
    return this.prisma.qeMsaStudy.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        _count: { select: { measurements: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneMsaStudy(id: number) {
    return this.prisma.qeMsaStudy.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectName: true } },
        createdBy: { select: { id: true, realName: true } },
        measurements: {
          include: { operator: { select: { id: true, realName: true } } },
          orderBy: [{ partId: 'asc' }, { trialNo: 'asc' }],
        },
      },
    })
  }

  async createMsaStudy(data: any, userId: number) {
    const studyNo = await this.generateNo('MSA', 'msa_study_seq')
    return this.prisma.qeMsaStudy.create({
      data: { ...data, studyNo, createdById: userId },
    })
  }

  async updateMsaStudy(id: number, data: any) {
    return this.prisma.qeMsaStudy.update({ where: { id }, data })
  }

  async deleteMsaStudy(id: number) {
    return this.prisma.qeMsaStudy.delete({ where: { id } })
  }

  async addMsaMeasurement(studyId: number, data: any) {
    return this.prisma.qeMsaMeasurement.create({ data: { ...data, studyId } })
  }

  async addMsaMeasurementsBulk(studyId: number, measurements: any[]) {
    return this.prisma.qeMsaMeasurement.createMany({
      data: measurements.map(m => ({ ...m, studyId })),
    })
  }

  async calculateMsaGrr(studyId: number) {
    const study = await this.prisma.qeMsaStudy.findUnique({
      where: { id: studyId },
      include: { measurements: { orderBy: [{ partId: 'asc' }, { operatorId: 'asc' }, { trialNo: 'asc' }] } },
    })
    if (!study || study.measurements.length === 0) throw new NotFoundException('No measurements')

    const k = study.numOperators
    const n = study.numParts
    const r = study.numTrials
    const measurements = study.measurements

    const grouped: Record<string, Record<string, number[]>> = {}
    for (const m of measurements) {
      const partKey = String(m.partId)
      const opKey = String(m.operatorId)
      if (!grouped[partKey]) grouped[partKey] = {}
      if (!grouped[partKey][opKey]) grouped[partKey][opKey] = []
      grouped[partKey][opKey].push(Number(m.measuredValue))
    }

    const partMeans: number[] = []
    const ranges: number[] = []
    const opMeans: number[] = []
    const allValues: number[] = []

    for (const partKey of Object.keys(grouped)) {
      const partVals: number[] = []
      for (const opKey of Object.keys(grouped[partKey])) {
        const trials = grouped[partKey][opKey]
        const trialMean = trials.reduce((a, b) => a + b, 0) / trials.length
        partVals.push(...trials)
        allValues.push(...trials)
        const range = Math.max(...trials) - Math.min(...trials)
        ranges.push(range)
      }
      partMeans.push(partVals.reduce((a, b) => a + b, 0) / partVals.length)
    }

    for (const opKey of new Set(measurements.map(m => String(m.operatorId)))) {
      const opVals = measurements.filter(m => String(m.operatorId) === opKey).map(m => Number(m.measuredValue))
      opMeans.push(opVals.reduce((a, b) => a + b, 0) / opVals.length)
    }

    const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length
    const rBar = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : 0
    const maxOpMean = Math.max(...opMeans)
    const minOpMean = Math.min(...opMeans)
    const xDiff = maxOpMean - minOpMean

    const d2Map: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326 }
    const d2r = d2Map[r] || 1.693
    const d2k = d2Map[k] || 1.693

    const ev = rBar / d2r
    const av = xDiff / d2k
    const avAdjusted = Math.sqrt(av ** 2 - ev ** 2 / (n * r))
    const grr = Math.sqrt(ev ** 2 + (isNaN(avAdjusted) ? 0 : avAdjusted ** 2))

    const partVariance = partMeans.reduce((sum, m) => sum + (m - grandMean) ** 2, 0) / (partMeans.length - 1)
    const pv = Math.sqrt(partVariance)
    const tv = Math.sqrt(grr ** 2 + pv ** 2)

    const tolerance = study.tolerance ? Number(study.tolerance) : tv * 6
    const grrPercent = tolerance > 0 ? (grr * 6 / tolerance) * 100 : 0
    const evPercent = tolerance > 0 ? (ev * 6 / tolerance) * 100 : 0
    const avPercent = tolerance > 0 ? (av * 6 / tolerance) * 100 : 0
    const pvPercent = tolerance > 0 ? (pv * 6 / tolerance) * 100 : 0
    const tvPercent = 100
    const ndc = grr > 0 ? Math.floor(1.41 * (pv / grr)) : 0

    let acceptanceResult = 'unacceptable'
    if (grrPercent < 10) acceptanceResult = 'acceptable'
    else if (grrPercent < 30) acceptanceResult = 'marginal'

    return this.prisma.qeMsaStudy.update({
      where: { id: studyId },
      data: {
        evPercent: evPercent,
        avPercent: avPercent,
        grrPercent: grrPercent,
        pvPercent: pvPercent,
        tvPercent: tvPercent,
        ndc,
        acceptanceResult,
      },
    })
  }

  // ============================================================
  // Knowledge Base
  // ============================================================

  async findAllKbEntries(entryType?: string, category?: string) {
    const where: any = {}
    if (entryType) where.entryType = entryType
    if (category) where.category = category
    return this.prisma.fmeaKnowledgeBase.findMany({
      where,
      include: { createdBy: { select: { id: true, realName: true } } },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findOneKbEntry(id: number) {
    return this.prisma.fmeaKnowledgeBase.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, realName: true } } },
    })
  }

  async createKbEntry(data: any, userId: number) {
    return this.prisma.fmeaKnowledgeBase.create({
      data: { ...data, createdById: userId },
    })
  }

  async updateKbEntry(id: number, data: any) {
    return this.prisma.fmeaKnowledgeBase.update({ where: { id }, data })
  }

  async deleteKbEntry(id: number) {
    return this.prisma.fmeaKnowledgeBase.delete({ where: { id } })
  }

  async incrementKbUsage(id: number) {
    return this.prisma.fmeaKnowledgeBase.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })
  }

  async recommendKbEntries(keywords: string, fmeaType?: string) {
    const terms = keywords.split(/[\s,，、]+/).filter(t => t.length > 0)
    const where: any = {}
    if (fmeaType) {
      where.OR = [
        { applicableFmeaType: fmeaType },
        { applicableFmeaType: 'both' },
        { applicableFmeaType: null },
      ]
    }
    const entries = await this.prisma.fmeaKnowledgeBase.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: 50,
    })
    const scored = entries.map(entry => {
      let score = 0
      const text = `${entry.title} ${entry.description || ''} ${entry.tags || ''}`.toLowerCase()
      for (const term of terms) {
        if (text.includes(term.toLowerCase())) score++
      }
      return { ...entry, score }
    }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 10)
    return scored
  }

  async getReferenceTables() {
    return { severityTable: SEVERITY_TABLE, occurrenceTable: OCCURRENCE_TABLE, detectionTable: DETECTION_TABLE }
  }

  // ============================================================
  // Statistics
  // ============================================================

  async getOverviewStats(projectId?: number) {
    const where = projectId ? { projectId } : {}
    const [dfmeas, pfmeas, controlPlans, specialChars, spcStudies, msaStudies] = await Promise.all([
      this.prisma.fmeaDfmea.count({ where }),
      this.prisma.fmeaPfmea.count({ where }),
      this.prisma.fmeaControlPlan.count({ where }),
      this.prisma.fmeaSpecialCharacteristic.count({ where }),
      this.prisma.qeSpcStudy.count({ where }),
      this.prisma.qeMsaStudy.count({ where }),
    ])
    const [dfmeaItems, pfmeaItems] = await Promise.all([
      this.prisma.fmeaDfmeaItem.count({ where: { dfmea: projectId ? { projectId } : {} } }),
      this.prisma.fmeaPfmeaItem.count({ where: { pfmea: projectId ? { projectId } : {} } }),
    ])
    const highApCount = await this.prisma.fmeaDfmeaItem.count({
      where: { apRating: 'H', dfmea: projectId ? { projectId } : {} },
    }) + await this.prisma.fmeaPfmeaItem.count({
      where: { apRating: 'H', pfmea: projectId ? { projectId } : {} },
    })
    return {
      dfmeas, pfmeas, controlPlans, specialChars, spcStudies, msaStudies,
      dfmeaItems, pfmeaItems, highApCount,
    }
  }

  async getApDistribution(projectId?: number) {
    const dfmeaWhere = { dfmea: projectId ? { projectId } : {} }
    const pfmeaWhere = { pfmea: projectId ? { projectId } : {} }
    const [dfmeaH, dfmeaM, dfmeaL, pfmeaH, pfmeaM, pfmeaL] = await Promise.all([
      this.prisma.fmeaDfmeaItem.count({ where: { ...dfmeaWhere, apRating: 'H' } }),
      this.prisma.fmeaDfmeaItem.count({ where: { ...dfmeaWhere, apRating: 'M' } }),
      this.prisma.fmeaDfmeaItem.count({ where: { ...dfmeaWhere, apRating: 'L' } }),
      this.prisma.fmeaPfmeaItem.count({ where: { ...pfmeaWhere, apRating: 'H' } }),
      this.prisma.fmeaPfmeaItem.count({ where: { ...pfmeaWhere, apRating: 'M' } }),
      this.prisma.fmeaPfmeaItem.count({ where: { ...pfmeaWhere, apRating: 'L' } }),
    ])
    return {
      dfmea: { high: dfmeaH, medium: dfmeaM, low: dfmeaL },
      pfmea: { high: pfmeaH, medium: pfmeaM, low: pfmeaL },
    }
  }
}
