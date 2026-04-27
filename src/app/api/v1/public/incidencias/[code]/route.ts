import { NextResponse } from 'next/server'
import { createPublicIncident, getIncidents } from '@/services/incidencias.service'
import { createIncidentSchema } from '@/utils/validation'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { data, total } = await getIncidents(params.code, {
      limit: 50,
    })
    return NextResponse.json({ data, total })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json()
    const data = createIncidentSchema.parse(body)

    const incident = await createPublicIncident(params.code, data)
    return NextResponse.json(incident, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}