import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    // Verificar variables de entorno (sin exponer secretos)
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrlValue: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    // Verificar sesión actual
    const session = await getServerSession()
    
    return NextResponse.json({
      status: 'ok',
      envCheck,
      session,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 })
  }
}
