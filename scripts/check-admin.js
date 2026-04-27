const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndFixAdmin() {
  try {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: 'kike.poveda@gmail.com' },
      include: { tenant: true }
    })

    if (!user) {
      console.log('Usuario no encontrado. Creando...')
      
      // Crear tenant si no existe
      let tenant = await prisma.tenant.findFirst({
        where: { code: 'EDUCA' }
      })

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Educa Solutions Demo',
            slug: 'educa-demo',
            code: 'EDUCA',
            email: 'kike.poveda@gmail.com',
            isActive: true,
            subscriptionStatus: 'ACTIVA',
          }
        })
        console.log('Tenant creado:', tenant.id)
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash('1a2bKike', 10)
      
      const newUser = await prisma.user.create({
        data: {
          email: 'kike.poveda@gmail.com',
          password: hashedPassword,
          name: 'Kike',
          surname: 'Poveda',
          role: 'ADMIN',
          isActive: true,
          tenantId: tenant.id,
        }
      })

      console.log('Usuario creado exitosamente:')
      console.log('Email: kike.poveda@gmail.com')
      console.log('Password: 1a2bKike')
      console.log('ID:', newUser.id)
      
    } else {
      console.log('Usuario encontrado:')
      console.log('Email:', user.email)
      console.log('Role:', user.role)
      console.log('Active:', user.isActive)
      console.log('Tenant ID:', user.tenantId)
      console.log('Tenant Name:', user.tenant?.name)
      
      // Verificar si la contraseña es correcta
      const isPasswordValid = await bcrypt.compare('1a2bKike', user.password)
      console.log('Password valid:', isPasswordValid)
      
      if (!isPasswordValid) {
        console.log('Corrigiendo contraseña...')
        const hashedPassword = await bcrypt.hash('1a2bKike', 10)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
        console.log('Contraseña actualizada')
      }
      
      if (!user.isActive) {
        console.log('Activando usuario...')
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: true }
        })
        console.log('Usuario activado')
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixAdmin()
