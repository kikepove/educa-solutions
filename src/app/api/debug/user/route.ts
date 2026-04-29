import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = 'kike.poveda@gmail.com'
    const password = 'test123'
    
    console.log('[DEBUG] Processing password reset for:', email)
    
    // First check current state
    const currentUser = await prisma.user.findUnique({
      where: { email },
    })
    
    console.log('[DEBUG] Current user state:', {
      id: currentUser?.id,
      hasPassword: !!currentUser?.password,
      isActive: currentUser?.isActive,
      role: currentUser?.role,
    })
    
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    console.log('[DEBUG] New hash:', hashedPassword.substring(0, 20))
    
    // Update user with new password and ensure active
    const updated = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    
    console.log('[DEBUG] Updated:', updated.id, 'isActive:', updated.isActive)
    
    // Verify the update worked
    const verifyUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        password: true,
      },
    })
    
    console.log('[DEBUG] Verified:', verifyUser)
    
    // Check if password works
    const testMatch = await bcrypt.compare(password, verifyUser!.password!)
    console.log('[DEBUG] Password test:', testMatch)
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset done. Try test123',
      user: {
        email: verifyUser?.email,
        isActive: verifyUser?.isActive,
        passwordWorks: testMatch,
      }
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}