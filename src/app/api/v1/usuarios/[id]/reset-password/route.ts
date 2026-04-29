import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import prisma from '@/lib/db'
import { resetUserPassword } from '@/services/auth.service'
import { hasPermission } from '@/utils/permissions'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'usuarios', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verificar que el usuario existe y pertenece al mismo tenant (para DIRECTOR)
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

    // Resetear contraseña usando el email
    const tempPassword = await resetUserPassword(targetUser.email)

    return NextResponse.json({
      message: 'Contraseña reseteada',
      temporaryPassword: tempPassword,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
