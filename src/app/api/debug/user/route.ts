import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password || 'admin123', 12)
    
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    
    // Also ensure all ADMIN users are active
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { isActive: true },
    })
    
    return NextResponse.json({ 
      message: 'User fixed',
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}