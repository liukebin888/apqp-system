export interface LoginDto {
  username: string
  password: string
}

export interface TokenPayload {
  userId: number
  username: string
  realName: string
  roles: string[]
  permissions: string[]
}

export interface UserInfo {
  id: number
  username: string
  realName: string
  email: string | null
  phone: string | null
  avatar: string | null
  department: {
    id: number
    name: string
  } | null
  position: {
    id: number
    name: string
  } | null
  roles: string[]
  permissions: string[]
}
