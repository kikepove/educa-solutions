import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPaths = [
  '/api/auth',
  '/api/v1/public',
  '/api/v1/stripe/webhook',
]

const tenantPaths = ['/api/v1/centros', '/api/v1/usuarios', '/api/v1/aulas']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tenantId = (token as any).tenantId
    const role = (token as any).role

    if (tenantPaths.some((path) => pathname.startsWith(path)) && !tenantId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Tenant requerido' }, { status: 400 })
    }

    const response = NextResponse.next()
    if (tenantId) {
      response.headers.set('x-tenant-id', tenantId)
    }
    response.headers.set('x-user-role', role)
    response.headers.set('x-user-id', token.sub || '')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}