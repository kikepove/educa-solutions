import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = 'kike.poveda@gmail.com'
    const password = 'test123'
    
    // Check user with tenant (same as authorize)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado en la base de datos',
        step: 'findUser'
      })
    }
    
    const checks = {
      userExists: true,
      hasPassword: !!user.password,
      isActive: user.isActive,
      tenantId: user.tenantId,
      tenantExists: user.tenant ? true : false,
      tenantIsActive: user.tenant?.isActive,
      deletedAt: user.deletedAt,
    }
    
    // Check password
    let passwordWorks = false
    if (user.password) {
      passwordWorks = await bcrypt.compare(password, user.password)
    }
    
    // Reset password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true,
      },
    })
    
    // Verify again
    const verifyUser = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    })
    
    if (!verifyUser) {
      return NextResponse.json({ error: 'Usuario no encontrado después del reset' }, { status: 500 })
    }
    
    const passwordWorksAfterReset = await bcrypt.compare(password, verifyUser.password!)
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset done. Try test123',
      checks,
      passwordWorksBeforeReset: passwordWorks,
      passwordWorksAfterReset,
      nextAuthSimulation: {
        wouldFail: !verifyUser.isActive || !passwordWorksAfterReset || (verifyUser.tenantId && verifyUser.tenant && !verifyUser.tenant.isActive),
        reason: !verifyUser.isActive ? 'Usuario desactivado' : 
                !passwordWorksAfterReset ? 'Contraseña incorrecta' :
                (verifyUser.tenantId && verifyUser.tenant && !verifyUser.tenant.isActive) ? 'Centro desactivado' :
                'OK - debería funcionar'
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset done. Try test123',
      checks,
      passwordWorksBeforeReset: passwordWorks,
      passwordWorksAfterReset,
      nextAuthSimulation: {
        wouldFail: !verifyUser.isActive || !passwordWorksAfterReset || (verifyUser.tenantId && verifyUser.tenant && !verifyUser.tenant.isActive),
        reason: !verifyUser.isActive ? 'Usuario desactivado' : 
                !passwordWorksAfterReset ? 'Contraseña incorrecta' :
                (verifyUser.tenantId && verifyUser.tenant && !verifyUser.tenant.isActive) ? 'Centro desactivado' :
                'OK - debería funcionar'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}