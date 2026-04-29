import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Attempt login for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          throw new Error('Credenciales requeridas')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        })

        console.log('[AUTH] User found:', {
          id: user?.id,
          email: user?.email,
          hasPassword: !!user?.password,
          isActive: user?.isActive,
          tenantId: user?.tenantId,
          tenantIsActive: user?.tenant?.isActive,
          deletedAt: user?.deletedAt,
        })

        if (!user || !user.password) {
          console.log('[AUTH] User not found or no password')
          throw new Error('Usuario no encontrado')
        }

        if (!user.isActive) {
          console.log('[AUTH] User inactive')
          throw new Error('Usuario desactivado')
        }

        if (user.deletedAt) {
          console.log('[AUTH] User deleted')
          throw new Error('Usuario no encontrado')
        }

        if (user.tenantId && user.tenant && !user.tenant.isActive) {
          console.log('[AUTH] Tenant inactive')
          throw new Error('Centro desactivado')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log('[AUTH] Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password')
          throw new Error('Contraseña incorrecta')
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname || ''}`.trim(),
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
          tenantSlug: user.tenant?.slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.tenantName = (user as any).tenantName
        token.tenantSlug = (user as any).tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).tenantName = token.tenantName
        ;(session.user as any).tenantSlug = token.tenantSlug
      }
      return session
    },
  },
}