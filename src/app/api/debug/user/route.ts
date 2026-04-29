import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'kike.poveda@gmail.com'
    const password = searchParams.get('password') || 'admin123'
    
    console.log('[DEBUG] Resetting password for:', email)
    
    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('[DEBUG] New password hash:', hashedPassword.substring(0, 20) + '...')
    
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    console.log('[DEBUG] User updated:', user.id, 'isActive:', user.isActive)
    
    // Also ensure all ADMIN users are active
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { isActive: true },
    })
    
    return NextResponse.json({ 
      message: 'Password reset successful. Try login now!',
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive }
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    const hashedPassword = await bcrypt.hash(password || 'admin123', 12)
    
    const user = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { isActive: true },
    })
    
    return NextResponse.json({ 
      message: 'Password reset successful',
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}