import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import type { CreateUserInput } from '@/utils/validation'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(data: CreateUserInput & { tenantId?: string }) {
  const hashedPassword = await hashPassword(data.password)
  
  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      surname: data.surname,
      phone: data.phone,
      role: data.role,
      tenantId: data.tenantId,
    },
  })
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  })
}

export async function getUsersByTenant(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
  })
}

export async function resetUserPassword(email: string): Promise<string> {
  const user = await getUserByEmail(email)
  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  const temporaryPassword = Math.random().toString(36).slice(-8)
  const hashedPassword = await hashPassword(temporaryPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  return temporaryPassword
}
