import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PrismaService } from '../services/prisma.service'

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user, body } = request

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle()
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.sysAuditLog.create({
            data: {
              userId: user?.id || 0,
              action: this.getActionFromMethod(method),
              module: this.extractModule(url),
              resourceType: this.extractResource(url),
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']?.substring(0, 500),
              afterSnapshot: body ? JSON.parse(JSON.stringify(body)) : undefined,
            },
          })
        } catch {
          // audit log failure should not break the request
        }
      }),
    )
  }

  private getActionFromMethod(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PATCH: 'UPDATE',
      PUT: 'UPDATE',
      DELETE: 'DELETE',
    }
    return map[method] || 'UNKNOWN'
  }

  private extractModule(url: string): string {
    const parts = url.split('/').filter(Boolean)
    return parts[2] || 'unknown' // skip 'api/v1'
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter(Boolean)
    return parts[2] || 'unknown'
  }
}
