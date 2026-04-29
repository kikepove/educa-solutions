import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import prisma from '@/lib/db'
import { hasPermission } from '@/utils/permissions'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  surname: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'usuarios', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
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
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'usuarios', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateUserSchema.parse(body)

    // Verificar que el usuario existe y pertenece al tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Preparar datos para actualizar
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.surname !== undefined) updateData.surname = data.surname
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    
    // Si se proporciona password, hashearla
    if (data.password) {
      const bcrypt = require('bcryptjs')
      updateData.password = await bcrypt.hash(data.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
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
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'usuarios', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verificar que el usuario existe y pertenece al tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Soft delete (marcar como eliminado)
    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Usuario eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
