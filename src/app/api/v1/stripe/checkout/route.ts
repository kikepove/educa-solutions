import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { createSubscription, getTenantSubscription, cancelTenantSubscription } from '@/services/stripe.service'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { priceId } = body

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID requerido' }, { status: 400 })
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const session = await createSubscription(
      user.tenantId,
      priceId,
      `${baseUrl}/dashboard?subscription=success`,
      `${baseUrl}/dashboard?subscription=cancelled`
    )

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const subscription = await getTenantSubscription(user.tenantId)
    return NextResponse.json(subscription)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await cancelTenantSubscription(user.tenantId)
    return NextResponse.json({ message: 'Suscripción cancelada' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}