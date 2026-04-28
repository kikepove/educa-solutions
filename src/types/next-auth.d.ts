import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    tenantId: string | null
    tenantName?: string
    tenantSlug?: string
  }

  interface Session {
    user: User & {
      id: string
      role: string
      tenantId: string | null
      tenantName?: string
      tenantSlug?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string | null
    tenantName?: string
    tenantSlug?: string
  }
}
