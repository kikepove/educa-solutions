import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get customers() {
    return getStripe().customers
  },
  get subscriptions() {
    return getStripe().subscriptions
  },
  get webhooks() {
    return getStripe().webhooks
  },
}

export async function createCheckoutSession({
  tenantId,
  tenantName,
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  tenantId: string
  tenantName: string
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
      tenantName,
    },
  }

  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_email = `${tenantId}@educa-solutions.local`
  }

  return getStripe().checkout.sessions.create(sessionParams)
}

export async function createCustomer(tenantId: string, tenantName: string, email?: string) {
  return getStripe().customers.create({
    metadata: {
      tenantId,
    },
    name: tenantName,
    email,
  })
}

export async function getSubscription(subscriptionId: string) {
  return getStripe().subscriptions.retrieve(subscriptionId)
}

export async function cancelSubscription(subscriptionId: string) {
  return getStripe().subscriptions.cancel(subscriptionId)
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
