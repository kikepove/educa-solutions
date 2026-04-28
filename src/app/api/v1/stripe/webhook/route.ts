import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { constructWebhookEvent } from '@/lib/stripe'
import { 
  handleCheckoutCompleted, 
  handleSubscriptionDeleted,
  handleSubscriptionUpdated 
} from '@/services/stripe.service'
import prisma from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Falta firma' }, { status: 400 })
  }

  let event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (error: any) {
    console.error('Error verificando webhook:', error.message)
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const tenantId = session.metadata?.tenantId
        const subscriptionId = session.subscription as string

        if (tenantId && subscriptionId) {
          await handleCheckoutCompleted(subscriptionId, tenantId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (tenant) {
          let status: 'ACTIVA' | 'CANCELADA' | 'PAST_DUE' | 'TRIALING' = 'ACTIVA'
          
          switch (subscription.status) {
            case 'active':
              status = 'ACTIVA'
              break
            case 'canceled':
              status = 'CANCELADA'
              break
            case 'past_due':
              status = 'PAST_DUE'
              break
            case 'trialing':
              status = 'TRIALING'
              break
          }

          await handleSubscriptionUpdated(tenant.id, status)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (tenant) {
          await handleSubscriptionDeleted(tenant.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        })

        if (tenant) {
          await handleSubscriptionUpdated(tenant.id, 'PAST_DUE')
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error procesando webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
