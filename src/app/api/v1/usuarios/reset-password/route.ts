import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/types'
import { resetUserPassword } from '@/services/auth.service'
import { hasPermission } from '@/utils/permissions'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'usuarios', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = resetPasswordSchema.parse(body)

    const tempPassword = await resetUserPassword(email)
    
    return NextResponse.json({ 
      message: 'Contraseña reseteada',
      tempPassword 
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
