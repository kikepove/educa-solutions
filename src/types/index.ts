import { UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type Role = UserRole

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string | null
  tenantName?: string
  tenantSlug?: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as SessionUser
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autorizado')
  }
  return user
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error('Permiso denegado')
  }
  return user
}

export async function requireTenant(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.tenantId) {
    throw new Error('Tenant no encontrado')
  }
  return user
}
