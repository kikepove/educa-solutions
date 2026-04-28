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
  console.log('[createTechnician] Starting with:', { tenantId, dataDni: data.dni, dataEmail: data.email, tenantIds })

  try {
    // Verificar si ya existe un técnico con ese DNI o email
    const existing = await prisma.technician.findFirst({
      where: { OR: [{ dni: data.dni }, { email: data.email }] },
    })

    if (existing) {
      console.log('[createTechnician] Existing found:', existing.id)
      throw new Error('Ya existe un técnico con ese DNI o email')
    }

    // Si no se proporciona contraseña, generar una temporal
    const finalPassword = data.password || Math.random().toString(36).slice(-8)
    console.log('[createTechnician] Generated password')
    
    const hashedPassword = await bcrypt.hash(finalPassword, 12)

    // Crear el técnico
    console.log('[createTechnician] Creating technician in DB...')
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
    console.log('[createTechnician] Technician created:', technician.id)

    // Crear el usuario asociado
    console.log('[createTechnician] Creating user...')
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
    console.log('[createTechnician] User created')

    // Asignar a múltiples centros si se proporcionan
    const idsToAssign = tenantIds && tenantIds.length > 0 ? tenantIds : [tenantId]
    console.log('[createTechnician] Assigning to centers:', idsToAssign)
    for (const tid of idsToAssign) {
      await prisma.technicianTenant.create({
        data: {
          technicianId: technician.id,
          tenantId: tid,
        },
      })
    }
    console.log('[createTechnician] Done')

    return { technician, password: data.password ? 'CUSTOM' : finalPassword }
  } catch (error: any) {
    console.error('[createTechnician] ERROR:', error.message, error.stack)
    throw error
  }
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
  console.log('[updateTechnician] Starting:', { technicianId, userRole, data })

  // Para ADMIN, buscar directamente por ID
  // Para otros roles, verificar que pertenece a su tenant
  let technician
  if (userRole === 'ADMIN') {
    technician = await prisma.technician.findUnique({ where: { id: technicianId } })
  } else if (tenantId) {
    technician = await prisma.technician.findFirst({
      where: { 
        id: technicianId,
        deletedAt: null,
        technicianTenants: {
          some: { tenantId },
        },
      },
    })
  }

  if (!technician) {
    console.log('[updateTechnician] Technician not found for id:', technicianId)
    throw new Error('Técnico no encontrado')
  }

  console.log('[updateTechnician] Found:', technician.id, technician.dni)

  // Actualizar técnico
  const updated = await prisma.technician.update({
    where: { id: technicianId },
    data,
  })
  console.log('[updateTechnician] Updated technician')

  // Actualizar también el usuario asociado
  const userData: any = {}
  if (data.email !== undefined) userData.email = data.email
  if (data.name !== undefined) userData.name = data.name
  if (data.surname !== undefined) userData.surname = data.surname
  if (data.phone !== undefined) userData.phone = data.phone
  if (data.isActive !== undefined) userData.isActive = data.isActive
  
  if (Object.keys(userData).length > 0) {
    await prisma.user.updateMany({
      where: { dni: technician.dni, role: 'TECNICO' },
      data: userData,
    })
    console.log('[updateTechnician] Updated user')
  }

return updated
}

export async function deleteTechnician(technicianId: string, tenantId: string | null, userRole: string) {
  console.log('[deleteTechnician] Starting:', { technicianId, userRole })

  let technician
  if (userRole === 'ADMIN') {
    technician = await prisma.technician.findUnique({ where: { id: technicianId } })
  } else if (tenantId) {
    technician = await prisma.technician.findFirst({
      where: { 
        id: technicianId,
        deletedAt: null,
        technicianTenants: {
          some: { tenantId },
        },
      },
    })
  }

  if (!technician) {
    console.log('[deleteTechnician] Not found:', technicianId)
    throw new Error('Técnico no encontrado')
  }

  console.log('[deleteTechnician] Found, deleting:', technician.id)
  
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