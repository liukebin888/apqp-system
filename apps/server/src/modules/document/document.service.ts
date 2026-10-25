import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/services/prisma.service'
import { Client } from 'minio'
import { createHash } from 'crypto'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class DocumentService {
  private minioClient: Client

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.minioClient = new Client({
      endPoint: config.get<string>('minio.endpoint') || 'localhost',
      port: config.get<number>('minio.port') || 9000,
      useSSL: config.get<boolean>('minio.useSsl') || false,
      accessKey: config.get<string>('minio.accessKey') || '',
      secretKey: config.get<string>('minio.secretKey') || '',
    })
  }

  async findAll(params: { projectId?: number; bizType?: string; docType?: string; status?: string }) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.bizType) where.bizType = params.bizType
    if (params.docType) where.docType = params.docType
    if (params.status) where.status = params.status

    return this.prisma.document.findMany({
      where,
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findOne(id: number) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        permissions: true,
      },
    })
    if (!doc) throw new NotFoundException('文档不存在')
    return doc
  }

  async create(data: {
    docCode: string
    docName: string
    docType: string
    bizType?: string
    bizId?: number
    projectId?: number
    isControlled?: boolean
    uploadedById: number
  }) {
    const existing = await this.prisma.document.findUnique({ where: { docCode: data.docCode } })
    if (existing) throw new BadRequestException('文档编号已存在')

    return this.prisma.document.create({
      data: {
        docCode: data.docCode,
        docName: data.docName,
        docType: data.docType,
        bizType: data.bizType,
        bizId: data.bizId,
        projectId: data.projectId,
        isControlled: data.isControlled || false,
        uploadedById: data.uploadedById,
      },
    })
  }

  async update(id: number, data: {
    docName?: string
    docType?: string
    bizType?: string
    status?: string
    isControlled?: boolean
  }) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')

    return this.prisma.document.update({ where: { id }, data })
  }

  async delete(id: number) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')

    if (doc.storagePath) {
      try {
        await this.minioClient.removeObject('documents', doc.storagePath)
      } catch {
        // file may not exist in minio, ignore
      }
    }

    await this.prisma.document.delete({ where: { id } })
    return { message: '删除成功' }
  }

  async uploadFile(id: number, file: Express.Multer.File, userId: number) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')

    const checksum = createHash('sha256').update(file.buffer).digest('hex')
    const ext = path.extname(file.originalname)
    const storagePath = `${doc.docCode}/v${doc.revision}${ext}`

    try {
      const bucketExists = await this.minioClient.bucketExists('documents')
      if (!bucketExists) {
        await this.minioClient.makeBucket('documents')
      }
      await this.minioClient.putObject('documents', storagePath, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      })
    } catch {
      // If MinIO is not available, save file locally
      const localDir = path.join(process.cwd(), 'uploads', doc.docCode)
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true })
      const localPath = path.join(localDir, `v${doc.revision}${ext}`)
      fs.writeFileSync(localPath, file.buffer)
    }

    const newRevision = doc.revision + 1
    const newVersion = this.nextVersion(doc.version)

    if (doc.storagePath) {
      await this.prisma.documentVersion.create({
        data: {
          documentId: id,
          version: doc.version,
          revision: doc.revision,
          storagePath: doc.storagePath,
          changeDescription: `版本 ${doc.version} r${doc.revision}`,
          createdById: userId,
        },
      })
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        storagePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        checksumSha: checksum,
        version: newVersion,
        revision: newRevision,
      },
    })
  }

  async approve(id: number, approverId: number) {
    return this.prisma.document.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    })
  }

  async release(id: number) {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')
    if (doc.status !== 'approved') throw new BadRequestException('只有已审批的文档才能发布')

    return this.prisma.document.update({
      where: { id },
      data: { status: 'released' },
    })
  }

  async setPermissions(documentId: number, permissions: { granteeType: string; granteeId: number; permissionLevel: string }[]) {
    await this.prisma.documentPermission.deleteMany({ where: { documentId } })
    if (permissions.length) {
      await this.prisma.documentPermission.createMany({
        data: permissions.map(p => ({ documentId, ...p })),
      })
    }
    return { message: '权限设置成功' }
  }

  async downloadFile(id: number): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id } })
    if (!doc) throw new NotFoundException('文档不存在')
    if (!doc.storagePath) throw new BadRequestException('文档未上传文件')

    try {
      const stream = await this.minioClient.getObject('documents', doc.storagePath)
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      const filename = path.basename(doc.storagePath)
      return { buffer, mimeType: doc.mimeType || 'application/octet-stream', filename }
    } catch {
      const localPath = path.join(process.cwd(), 'uploads', doc.storagePath)
      if (!fs.existsSync(localPath)) throw new NotFoundException('文件不存在')
      const buffer = fs.readFileSync(localPath)
      const filename = path.basename(doc.storagePath)
      return { buffer, mimeType: doc.mimeType || 'application/octet-stream', filename }
    }
  }

  private nextVersion(current: string): string {
    const charCode = current.charCodeAt(0)
    if (charCode >= 90) return 'A'
    return String.fromCharCode(charCode + 1)
  }
}
