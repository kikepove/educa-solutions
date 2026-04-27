import prisma from '@/lib/db'
import type { CreateIncidentInput, UpdateIncidentInput } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'
import type { UserRole } from '@prisma/client'

export async function createIncident(
  tenantId: string,
  userId: string,
  data: CreateIncidentInput,
  role: UserRole,
  createdById?: string
) {
  if (!hasPermission(role, 'incidencias', 'create')) {
    throw new Error('No tienes permiso para crear incidencias')
  }

  return prisma.incident.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIA',
      category: data.category || 'OTRO',
      location: data.location,
      classroomId: data.classroomId,
      teacherId: data.teacherId,
      tenantId,
      createdById: createdById || userId,
      source: 'WEB',
    },
    include: {
      classroom: true,
      teacher: true,
      technician: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function createPublicIncident(
  tenantCode: string,
  data: CreateIncidentInput
) {
  const tenant = await prisma.tenant.findUnique({
    where: { code: tenantCode },
    select: { id: true, name: true },
  })

  if (!tenant) {
    throw new Error('Centro no encontrado')
  }

  return prisma.incident.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIA',
      category: data.category || 'OTRO',
      location: data.location,
      classroomId: data.classroomId,
      tenantId: tenant.id,
      createdById: 'public',
      source: 'QR',
      isPublic: true,
    },
    include: {
      classroom: true,
    },
  })
}

export async function getIncidents(
  tenantId: string,
  options?: {
    status?: string
    priority?: string
    category?: string
    classroomId?: string
    technicianId?: string
    search?: string
    limit?: number
    offset?: number
  }
) {
  const where: any = { tenantId, deletedAt: null }

  if (options?.status) where.status = options.status
  if (options?.priority) where.priority = options.priority
  if (options?.category) where.category = options.category
  if (options?.classroomId) where.classroomId = options.classroomId
  if (options?.technicianId) where.technicianId = options.technicianId
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: {
        classroom: true,
        teacher: true,
        technician: true,
        createdBy: {
          select: { id: true, name: true, surname: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.incident.count({ where }),
  ])

  return { data, total }
}

export async function getIncidentById(incidentId: string, tenantId: string) {
  return prisma.incident.findFirst({
    where: { id: incidentId, tenantId, deletedAt: null },
    include: {
      classroom: true,
      teacher: true,
      technician: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function updateIncident(
  incidentId: string,
  tenantId: string,
  data: UpdateIncidentInput,
  role: UserRole,
  userId: string
) {
  if (!hasPermission(role, 'incidencias', 'update')) {
    throw new Error('No tienes permiso para actualizar incidencias')
  }

  const incident = await prisma.incident.findFirst({
    where: { id: incidentId, tenantId },
  })

  if (!incident) {
    throw new Error('Incidencia no encontrada')
  }

  const isOwner = incident.createdById === userId
  const isTICOrAdmin = role === 'TIC' || role === 'ADMIN' || role === 'DIRECTOR'

  if (role === 'PROFESOR' && !isOwner) {
    throw new Error('Solo puedes editar tus propias incidencias')
  }

  const updateData: any = { ...data }

  if (data.status === 'RESUELTA' || data.status === 'CERRADA') {
    updateData.resolvedAt = new Date()
  }

  return prisma.incident.update({
    where: { id: incidentId },
    data: updateData,
    include: {
      classroom: true,
      teacher: true,
      technician: true,
      createdBy: {
        select: { id: true, name: true, surname: true },
      },
    },
  })
}

export async function deleteIncident(incidentId: string, tenantId: string) {
  return prisma.incident.update({
    where: { id: incidentId },
    data: { deletedAt: new Date() },
  })
}

export async function getIncidentStats(tenantId: string) {
  const [total, byStatus, byPriority, byCategory, recent] = await Promise.all([
    prisma.incident.count({ where: { tenantId, deletedAt: null } }),
    prisma.incident.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.incident.groupBy({
      by: ['priority'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.incident.groupBy({
      by: ['category'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.incident.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { classroom: true },
    }),
  ])

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
    recent,
  }
}