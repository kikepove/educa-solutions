import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const activate = searchParams.get('activate')
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    const isActive = activate === 'true'
    
    const user = await prisma.user.update({
      where: { email },
      data: { isActive },
    })
    
    return NextResponse.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'}`,
      user: { id: user.id, email: user.email, isActive: user.isActive }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}