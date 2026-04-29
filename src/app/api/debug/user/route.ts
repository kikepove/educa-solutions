import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // 1. Activate all ADMIN users
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: { isActive: true },
    })
    
    // 2. Reset password for kike.poveda@gmail.com
    const hashedPassword = await bcrypt.hash('1a2bkike', 12)
    const user = await prisma.user.update({
      where: { email: 'kike.poveda@gmail.com' },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    
    return NextResponse.json({ 
      message: 'Admin user fixed',
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}