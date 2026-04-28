import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { getTenantById, updateTenant, deleteTenant, regenerateTenantQR } from '@/services/centros.service'
import { createTenantSchema } from '@/utils/validation'
import { hasPermission } from '@/utils/permissions'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tenant = await getTenantById(params.id)
    if (!tenant) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 })
    }

    if (user.role !== 'ADMIN' && user.tenantId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(tenant)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.tenantId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTenantSchema.partial().parse(body)

    // Si se envía password, actualizar el usuario DIRECTOR asociado
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10)
      const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
      if (tenant?.email) {
        await prisma.user.updateMany({
          where: { email: tenant.email, role: 'DIRECTOR', tenantId: params.id },
          data: { password: hashedPassword },
        })
      }
      delete (data as any).password
    }

    const tenant = await updateTenant(params.id, data)
    return NextResponse.json(tenant)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    console.log('[DEBUG DELETE centro] user:', user)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Solo admins pueden eliminar centros' }, { status: 403 })
    }

    if (!hasPermission(user.role, 'centros', 'delete')) {
      return NextResponse.json({ error: 'Forbidden - No tienes permiso para eliminar centros' }, { status: 403 })
    }

    console.log('[DEBUG DELETE centro] params.id:', params.id)
    await deleteTenant(params.id)
    return NextResponse.json({ message: 'Centro eliminado' })
  } catch (error: any) {
    console.error('[DEBUG DELETE centro] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}