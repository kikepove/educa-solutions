import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { createTechnician, getTechnicians } from '@/services/tecnicos.service'
import { hasPermission } from '@/utils/permissions'
import { z } from 'zod'

const createTechnicianSchema = z.object({
  dni: z.string().min(1, 'El DNI es requerido'),
  name: z.string().min(2, 'El nombre es requerido'),
  surname: z.string().min(2, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const technicians = await getTechnicians(user.tenantId)
    return NextResponse.json(technicians)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTechnicianSchema.parse(body)

    const result = await createTechnician(user.tenantId, data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}