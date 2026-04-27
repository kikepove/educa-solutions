import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { CreateUserInput } from '@/utils/validation'

export async function createTechnician(tenantId: string, data: {
  dni: string
  name: string
  surname: string
  email: string
  phone?: string
  specialties?: string[]
}) {
  const existing = await prisma.technician.findFirst({
    where: { tenantId, dni: data.dni },
  })

  if (existing) {
    throw new Error('Ya existe un técnico con ese DNI')
  }

  const bcrypt = require('bcryptjs')
  const tempPassword = Math.random().toString(36).slice(-8)

  const [technician, user] = await prisma.$transaction([
    prisma.technician.create({
      data: {
        ...data,
        tenantId,
      },
    }),
    prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        surname: data.surname,
        dni: data.dni,
        phone: data.phone,
        role: 'TECNICO',
        password: await bcrypt.hash(tempPassword, 12),
        tenantId,
      },
    }),
  ])

  return { technician, user, tempPassword }
}

export async function getTechnicians(tenantId: string) {
  return prisma.technician.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
  })
}

export async function getTechnicianById(technicianId: string, tenantId: string) {
  return prisma.technician.findFirst({
    where: { id: technicianId, tenantId },
  })
}

export async function updateTechnician(
  technicianId: string,
  tenantId: string,
  data: Partial<{
    name: string
    surname: string
    email: string
    phone: string
    specialties: string[]
    isActive: boolean
  }>
) {
  const technician = await prisma.technician.findFirst({
    where: { id: technicianId, tenantId },
  })

  if (!technician) {
    throw new Error('Técnico no encontrado')
  }

  return prisma.technician.update({
    where: { id: technicianId },
    data,
  })
}

export async function deleteTechnician(technicianId: string, tenantId: string) {
  return prisma.technician.update({
    where: { id: technicianId, tenantId },
    data: { deletedAt: new Date() },
  })
}

export async function getTechniciansByTenant(tenantId: string) {
  return prisma.technician.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  })
}