import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../common/services/prisma.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { username },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })

    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const roles = user.userRoles.map((ur) => ur.role.code)
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.code),
    )

    const payload = {
      userId: user.id,
      username: user.username,
      realName: user.realName,
      roles,
      permissions,
    }

    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' })

    await this.prisma.sysUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        department: user.department,
        position: user.position,
        roles,
        permissions: [...new Set(permissions)],
      },
    }
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, { ignoreExpiration: true })
      const user = await this.prisma.sysUser.findUnique({
        where: { id: payload.userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      })

      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户已禁用')
      }

      const roles = user.userRoles.map((ur) => ur.role.code)
      const permissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.code),
      )

      const newPayload = {
        userId: user.id,
        username: user.username,
        realName: user.realName,
        roles,
        permissions,
      }

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      }
    } catch {
      throw new UnauthorizedException('Token 无效或已过期')
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.sysUser.findUnique({
      where: { id: userId },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const roles = user.userRoles.map((ur) => ur.role.code)
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.code),
    )

    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      department: user.department,
      position: user.position,
      roles,
      permissions: [...new Set(permissions)],
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.sysUser.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isValid) {
      throw new UnauthorizedException('原密码错误')
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await this.prisma.sysUser.update({
      where: { id: userId },
      data: { passwordHash: hash },
    })

    return { message: '密码修改成功' }
  }
}
