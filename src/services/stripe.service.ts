import prisma from '@/lib/db'
import { createCheckoutSession, createCustomer, cancelSubscription, getSubscription, stripe } from '@/lib/stripe'

export async function createSubscription(
  tenantId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new Error('Centro no encontrado')

  let customerId = tenant.stripeCustomerId

  if (!customerId) {
    const customer = await createCustomer(tenantId, tenant.name, tenant.email || undefined)
    customerId = customer.id
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await createCheckoutSession({
    tenantId,
    tenantName: tenant.name,
    customerId,
    priceId,
    successUrl,
    cancelUrl,
  })

  return session
}

export async function handleCheckoutCompleted(subscriptionId: string, tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionId,
      subscriptionStatus: 'ACTIVA',
      isActive: true,
    },
  })
}

export async function handleSubscriptionDeleted(tenantId: string) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionId: null,
      subscriptionStatus: 'CANCELADA',
      isActive: false,
    },
  })
}

export async function handleSubscriptionUpdated(
  tenantId: string,
  status: 'ACTIVA' | 'CANCELADA' | 'PAST_DUE' | 'TRIALING'
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionStatus: status },
  })
}

export async function getTenantSubscription(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionId: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  })

  if (!tenant?.subscriptionId) return null

  try {
    const subscription = await stripe.subscriptions.retrieve(tenant.subscriptionId)
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  } catch {
    return null
  }
}

export async function cancelTenantSubscription(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionId: true },
  })

  if (!tenant?.subscriptionId) {
    throw new Error('No hay suscripción activa')
  }

  await cancelSubscription(tenant.subscriptionId)

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionStatus: 'CANCELADA' },
  })
}
