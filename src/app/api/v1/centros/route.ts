import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { createTenant, getAllTenants, getTenantById, updateTenant, deleteTenant } from '@/services/centros.service'
import { createTenantSchema } from '@/utils/validation'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('showAll') === 'true'

    const tenants = await getAllTenants(showAll)
    return NextResponse.json(tenants)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createTenantSchema.parse(body)

    const tenant = await createTenant(data)
    return NextResponse.json(tenant, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
