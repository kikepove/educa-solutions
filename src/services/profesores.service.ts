import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { CreateUserInput } from '@/utils/validation'

export async function createTeacher(tenantId: string, data: {
  name: string
  surname: string
  email: string
  phone?: string
  department?: string
  password?: string
}) {
  // Verificar si ya existe un profesor con ese email
  const existingByEmail = await prisma.teacher.findFirst({
    where: { tenantId, email: data.email },
  })

  if (existingByEmail) {
    throw new Error('Ya existe un profesor con ese email')
  }

  // Si no se proporciona contraseña, generar una temporal
  const password = data.password || Math.random().toString(36).slice(-8)
  const hashedPassword = await bcrypt.hash(password, 12)

  // El code se genera automáticamente con @default(cuid()) en Prisma
  const [teacher, user] = await prisma.$transaction([
    prisma.teacher.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        department: data.department,
        tenantId,
      },
    }),
    prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        role: 'PROFESOR',
        password: hashedPassword,
        tenantId,
      },
    }),
  ])

  return { teacher, user, password: data.password ? 'CUSTOM' : password }
}

export async function getTeachers(tenantId: string) {
  return prisma.teacher.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { surname: 'asc' },
  })
}

export async function getTeacherById(teacherId: string, tenantId: string) {
  return prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  })
}

export async function updateTeacher(
  teacherId: string,
  tenantId: string,
  data: Partial<{
    name: string
    surname: string
    email: string
    phone: string
    department: string
    isActive: boolean
  }>
) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  })

  if (!teacher) {
    throw new Error('Profesor no encontrado')
  }

  return prisma.teacher.update({
    where: { id: teacherId },
    data,
  })
}

export async function deleteTeacher(teacherId: string, tenantId: string) {
  // Eliminar usuario asociado
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  })

  if (teacher) {
    await prisma.user.deleteMany({
      where: { email: teacher.email, tenantId, role: 'PROFESOR' },
    })
  }

  // Eliminar profesor permanentemente
  return prisma.teacher.delete({
    where: { id: teacherId },
  })
}

export async function getTeachersByTenant(tenantId: string) {
  return prisma.teacher.findMany({
    where: { tenantId, isActive: true },
    orderBy: { surname: 'asc' },
  })
}

export async function resetTeacherPassword(teacherId: string, tenantId: string, newPassword?: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, tenantId },
  })

  if (!teacher) {
    throw new Error('Profesor no encontrado')
  }

  const password = newPassword || Math.random().toString(36).slice(-8)
  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.updateMany({
    where: { email: teacher.email, tenantId, role: 'PROFESOR' },
    data: { password: hashedPassword },
  })

  return { password }
}
