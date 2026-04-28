import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { createTechnician, getTechnicians, getAllTechnicians, updateTechnician, deleteTechnician, assignTechnicianToTenant, removeTechnicianFromTenant } from '@/services/tecnicos.service'
import { hasPermission } from '@/utils/permissions'
import { z } from 'zod'

const createTechnicianSchema = z.object({
  dni: z.string().min(1, 'El DNI es requerido'),
  name: z.string().min(2, 'El nombre es requerido'),
  surname: z.string().min(2, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  tenantIds: z.array(z.string()).min(1, 'Selecciona al menos un centro'),
})

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const technicians = user.role === 'ADMIN' 
      ? await getAllTechnicians() 
      : await getTechnicians(user.tenantId!)
    return NextResponse.json(technicians)
  } catch (error: any) {
    console.error('[DEBUG GET tecnicos] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    console.log('[DEBUG POST tecnico] user:', user?.role, 'tenantId:', user?.tenantId)

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'tecnicos', 'create')) {
      return NextResponse.json({ error: 'Forbidden - No tienes permiso para crear técnicos' }, { status: 403 })
    }

    const body = await request.json()
    console.log('[DEBUG POST tecnico] body:', body)
    
    try {
      const data = createTechnicianSchema.parse(body)
      console.log('[DEBUG POST tecnico] parsed:', data)
      
      const tenantId = user.role === 'ADMIN' && data.tenantIds?.[0] ? data.tenantIds[0] : user.tenantId
      if (!tenantId) {
        return NextResponse.json({ error: 'Selecciona al menos un centro' }, { status: 400 })
      }

      const result = await createTechnician(tenantId, { ...data, password: data.password }, data.tenantIds)
      console.log('[DEBUG POST tecnico] created:', result)
      
      return NextResponse.json(result, { status: 201 })
    } catch (parseError: any) {
      console.error('[DEBUG POST tecnico] parse error:', parseError)
      return NextResponse.json({ error: parseError.message || 'Error de validación', details: parseError.errors }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[DEBUG POST tecnico] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
