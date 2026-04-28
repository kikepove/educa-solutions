import prisma from '@/lib/db'
import type { CreateInventoryItemInput } from '@/utils/validation'

export async function createInventoryItem(
  tenantId: string,
  technicianId: string,
  data: CreateInventoryItemInput
) {
  return prisma.inventoryItem.create({
    data: {
      ...data,
      tenantId,
      technicianId,
    },
  })
}

export async function getInventoryItems(
  tenantId: string,
  options?: {
    category?: string
    status?: string
    classroomId?: string
    search?: string
    limit?: number
    offset?: number
  }
) {
  const where: any = { tenantId, deletedAt: null }

  if (options?.category) where.category = options.category
  if (options?.status) where.status = options.status
  if (options?.classroomId) where.classroomId = options.classroomId
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { serialNumber: { contains: options.search, mode: 'insensitive' } },
      { assetTag: { contains: options.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        classroom: true,
        technician: true,
      },
      orderBy: { name: 'asc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.inventoryItem.count({ where }),
  ])

  return { data, total }
}

export async function getInventoryItemById(itemId: string, tenantId: string) {
  return prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId, deletedAt: null },
    include: {
      classroom: true,
      technician: true,
    },
  })
}

export async function updateInventoryItem(
  itemId: string,
  tenantId: string,
  data: Partial<CreateInventoryItemInput>
) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, tenantId },
  })

  if (!item) {
    throw new Error('Item no encontrado')
  }

  return prisma.inventoryItem.update({
    where: { id: itemId },
    data,
  })
}

export async function deleteInventoryItem(itemId: string, tenantId: string) {
  return prisma.inventoryItem.update({
    where: { id: itemId, tenantId },
    data: { deletedAt: new Date() },
  })
}

export async function getInventoryCategories(tenantId: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { tenantId, deletedAt: null },
    select: { category: true },
    distinct: ['category'],
  })
  return items.map((i) => i.category)
}

export async function getInventoryStats(tenantId: string) {
  const [total, byCategory, byStatus, lowStock] = await Promise.all([
    prisma.inventoryItem.count({ where: { tenantId, deletedAt: null } }),
    prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.inventoryItem.groupBy({
      by: ['status'],
      where: { tenantId, deletedAt: null },
      _count: true,
    }),
    prisma.inventoryItem.count({
      where: {
        tenantId,
        deletedAt: null,
        warrantyEnd: { lte: new Date() },
      },
    }),
  ])

  return {
    total,
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    expiredWarranty: lowStock,
  }
}
