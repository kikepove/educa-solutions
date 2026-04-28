import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { updateTechnician, deleteTechnician } from '@/services/tecnicos.service'
import { hasPermission } from '@/utils/permissions'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const technician = await updateTechnician(params.id, user.tenantId, user.role, body)
    return NextResponse.json(technician)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteTechnician(params.id, user.tenantId, user.role)
    return NextResponse.json({ message: 'Técnico eliminado' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}