import prisma from '@/lib/db'
import { createCustomer } from '@/lib/stripe'
import { generateTenantQR } from '@/lib/qr'
import type { CreateTenantInput } from '@/utils/validation'
import bcrypt from 'bcryptjs'

function generateTenantCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createTenant(data: CreateTenantInput) {
  let code = generateTenantCode()
  let codeExists = await prisma.tenant.findUnique({ where: { code } })
  while (codeExists) {
    code = generateTenantCode()
    codeExists = await prisma.tenant.findUnique({ where: { code } })
  }

  const hashedPassword = await bcrypt.hash(data.password!, 10)

  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      code,
      address: data.address,
      phone: data.phone,
      email: data.email,
    },
  })

  const qrData = await generateTenantQR(code)
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { qrUrl: qrData.qrDataUrl },
  })

  // Crear usuario DIRECTOR asociado al centro
  await prisma.user.create({
    data: {
      email: data.email!,
      name: data.name,
      password: hashedPassword,
      role: 'DIRECTOR',
      tenantId: tenant.id,
    },
  })

  return {
    ...tenant,
    qrUrl: qrData.qrDataUrl,
    publicUrl: qrData.url,
  }
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          classrooms: true,
          teachers: true,
          incidents: true,
        },
      },
    },
  })
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
  })
}

export async function getTenantByCode(code: string) {
  return prisma.tenant.findUnique({
    where: { code },
    include: {
      classrooms: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  })
}

export async function getAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          users: true,
          classrooms: true,
          teachers: true,
        },
      },
    },
  })
}

export async function updateTenant(id: string, data: Partial<CreateTenantInput>) {
  return prisma.tenant.update({
    where: { id },
    data,
  })
}

export async function deleteTenant(id: string) {
  return prisma.tenant.update({
    where: { id },
    data: { isActive: false },
  })
}

export async function regenerateTenantQR(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error('Centro no encontrado')

  const qrData = await generateTenantQR(tenant.code)
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { qrUrl: qrData.qrDataUrl },
  })

  return qrData
}

export async function activateTenantSubscription(
  tenantId: string,
  subscriptionId: string,
  stripeCustomerId: string
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionId,
      stripeCustomerId,
      subscriptionStatus: 'ACTIVA',
      isActive: true,
    },
  })
}

export async function deactivateTenantSubscription(tenantId: string) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionId: null,
      subscriptionStatus: 'CANCELADA',
      isActive: false,
    },
  })
}

export async function checkTenantAccess(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isActive: true, subscriptionStatus: true },
  })

  if (!tenant) return false
  return tenant.isActive && tenant.subscriptionStatus === 'ACTIVA'
}