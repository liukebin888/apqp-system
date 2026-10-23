import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async nextNo(seqName: string): Promise<string> {
    const today = new Date()
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0')

    return this.prisma.$transaction(async (tx) => {
      const seq = await tx.sysSequence.findUnique({ where: { seqName } })
      if (!seq) {
        await tx.sysSequence.create({
          data: { seqName, currentVal: 1, prefix: '', dateFormat: 'YYYYMMDD' },
        })
        return `${dateStr}${'0001'}`
      }

      const newVal = seq.currentVal + 1
      await tx.sysSequence.update({
        where: { seqName },
        data: { currentVal: newVal },
      })

      const prefix = seq.prefix || ''
      const numStr = newVal.toString().padStart(4, '0')
      return seq.dateFormat ? `${prefix}${dateStr}${numStr}` : `${prefix}${numStr}`
    })
  }
}
