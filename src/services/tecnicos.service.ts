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
  password?: string
}, tenantIds?: string[]) {
  // Verificar si ya existe un técnico con ese DNI o email
  const existing = await prisma.technician.findFirst({
    where: { OR: [{ dni: data.dni }, { email: data.email }] },
  })

  if (existing) {
    throw new Error('Ya existe un técnico con ese DNI o email')
  }

  // Si no se proporciona contraseña, generar una temporal
  const finalPassword = data.password || Math.random().toString(36).slice(-8)
  const hashedPassword = await bcrypt.hash(finalPassword, 12)

  // Crear el técnico
  const technician = await prisma.technician.create({
    data: {
      dni: data.dni,
      name: data.name,
      surname: data.surname,
      email: data.email,
      phone: data.phone,
      specialties: data.specialties || [],
    },
  })

  // Crear el usuario asociado
  await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      surname: data.surname,
      dni: data.dni,
      phone: data.phone,
      role: 'TECNICO',
      password: hashedPassword,
      tenantId,
      isActive: true,
    },
  })

  // Asignar a múltiples centros si se proporcionan
  const idsToAssign = tenantIds && tenantIds.length > 0 ? tenantIds : [tenantId]
  for (const tid of idsToAssign) {
    await prisma.technicianTenant.create({
      data: {
        technicianId: technician.id,
        tenantId: tid,
      },
    })
  }

  return { technician, password: data.password ? 'CUSTOM' : finalPassword }
}

export async function getTechnicians(tenantId: string) {
  return prisma.technician.findMany({
    where: {
      deletedAt: null,
      technicianTenants: {
        some: { tenantId },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getTechnicianById(technicianId: string, tenantId: string) {
  return prisma.technician.findFirst({
    where: {
      id: technicianId,
      deletedAt: null,
      technicianTenants: {
        some: { tenantId },
      },
    },
  })
}

export async function updateTechnician(
  technicianId: string,
  tenantId: string | null,
  userRole: string,
  data: Partial<{
    name: string
    surname: string
    email: string
    phone: string
    specialties: string[]
    isActive: boolean
  }>
) {
  const where: any = {
    id: technicianId,
    deletedAt: null,
  }

  // Si no es ADMIN, filtrar por tenant
  if (userRole !== 'ADMIN') {
    where.technicianTenants = {
      some: { tenantId },
    }
  }

  const technician = await prisma.technician.findFirst({ where })

  if (!technician) {
    throw new Error('Técnico no encontrado')
  }

  // Actualizar técnico
  const updated = await prisma.technician.update({
    where: { id: technicianId },
    data,
  })

  // Si se actualiza email, actualizar también el usuario asociado
  if (data.email) {
    const userData: any = { 
      email: data.email, 
      isActive: data.isActive,
    }
    if (data.name !== undefined) userData.name = data.name
    if (data.surname !== undefined) userData.surname = data.surname
    if (data.phone !== undefined) userData.phone = data.phone
    
    await prisma.user.updateMany({
      where: { dni: technician.dni, role: 'TECNICO' },
      data: userData,
    })
  } else if (data.name || data.surname || data.phone || data.isActive !== undefined) {
    const userData: any = {}
    if (data.name !== undefined) userData.name = data.name
    if (data.surname !== undefined) userData.surname = data.surname
    if (data.phone !== undefined) userData.phone = data.phone
    if (data.isActive !== undefined) userData.isActive = data.isActive
    
    await prisma.user.updateMany({
      where: { dni: technician.dni, role: 'TECNICO' },
      data: userData,
    })
  }

  return updated
}

export async function deleteTechnician(technicianId: string, tenantId: string | null, userRole: string) {
  const where: any = {
    id: technicianId,
    deletedAt: null,
  }

  // Si no es ADMIN, filtrar por tenant
  if (userRole !== 'ADMIN') {
    where.technicianTenants = {
      some: { tenantId },
    }
  }

  const technician = await prisma.technician.findFirst({ where })

  if (!technician) {
    throw new Error('Técnico no encontrado')
  }

  return prisma.technician.update({
    where: { id: technicianId },
    data: { deletedAt: new Date() },
  })
}

export async function getAllTechnicians() {
  return prisma.technician.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: {
      technicianTenants: {
        include: { tenant: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function assignTechnicianToTenant(technicianId: string, tenantId: string) {
  // Verificar si ya existe la asignación
  const existing = await prisma.technicianTenant.findFirst({
    where: { technicianId, tenantId },
  })

  if (existing) {
    throw new Error('El técnico ya está asignado a este centro')
  }

  return prisma.technicianTenant.create({
    data: { technicianId, tenantId },
  })
}

export async function removeTechnicianFromTenant(technicianId: string, tenantId: string) {
  return prisma.technicianTenant.deleteMany({
    where: { technicianId, tenantId },
  })
}